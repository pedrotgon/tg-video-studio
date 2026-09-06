// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { ensureAuthenticatedForAppRoute } from "@/lib/auth-mode";
import { useAllProjectSummaries } from "@/lib/queries/projects";
import { canonicalProjectRouteParam } from "@/lib/project-route";
import { useRegionStore } from "@/stores/region-store";
import { clusterConfig } from "@/lib/cluster-config";
import { getRegionCookie } from "@/lib/region-cookie";
import { authRequired } from "@/lib/runtime-config";
import { initRegionTabSync } from "@/lib/region-tab-sync";
import { initObservability } from "@/lib/observability";
import { TaskCenterProvider } from "@/task-center/provider";
import { TaskStatusBar } from "@/components/task-center/status-bar";
import { TaskPanel } from "@/components/task-center/panel";
import { MyBuddyCompanion } from "@/features/companion/MyBuddyCompanion";
import { AccessoryUnlockPrompt } from "@/features/rewards/AccessoryUnlockPrompt";
import { VersionUpdateDialog } from "@/features/version-update/VersionUpdateDialog";
import { PikoInspirationStation } from "@/features/piko-mini-game/PikoInspirationStation";
import { ProductSurfaceUnavailable } from "@/components/product-surface-unavailable";
import { TgCreativeRail } from "@/components/layout/tg-creative-rail";
import {
  surfaceAccess,
  useProductSurfaces,
  type ProductSurfaceCode,
} from "@/lib/queries/product-surfaces";

export function shouldRedirectMissingUsernameToLogin(): boolean {
  return authRequired();
}

const SESSION_CHECK_TIMEOUT_MS = 4000;

function validateSessionWithTimeout(validateSession: () => Promise<boolean>): Promise<boolean> {
  return Promise.race([
    validateSession(),
    new Promise<boolean>((resolve) => {
      window.setTimeout(() => resolve(false), SESSION_CHECK_TIMEOUT_MS);
    }),
  ]);
}

function AppLayout() {
  const navigate = useNavigate();
  // `username` stands in for the old `apiKey` gate — the SPA is cookie-backed,
  // JS can no longer read the credential, so the login marker is username.
  const username = useAuthStore((s) => s.username);
  const validateSession = useAuthStore((s) => s.validateSession);
  const refreshAvatar = useAuthStore((s) => s.refreshAvatar);
  const [validated, setValidated] = useState(false);
  const [pikoStationOpen, setPikoStationOpen] = useState(false);
  const validatedUsernameRef = useRef<string | null>(null);
  const params = useParams({ strict: false }) as { project?: string };
  const routeProject = params.project ?? null;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const projectSummaries = useAllProjectSummaries();
  const backendStatus = (
    projectSummaries.error as { response?: { status?: number } } | undefined
  )?.response?.status;
  const backendUnavailable =
    projectSummaries.isError && backendStatus !== 401 && backendStatus !== 403;
  const canonicalProject = routeProject
    ? canonicalProjectRouteParam(routeProject, projectSummaries.data)
    : null;
  const reducedMotion = useReducedMotion();
  const routeTransitionKey = (() => {
    const match = pathname.match(/^\/projects\/([^/]+)(?:\/([^/]+))?/);
    if (!match) return pathname;
    return `/projects/${match[1]}/${match[2] ?? ""}`;
  })();
  const isAssistantPage = /^\/projects\/[^/]+\/assistant$/.test(pathname);
  const isPerfilPage = pathname.includes("/perfil");
  const productSurfaces = useProductSurfaces(Boolean(username && validated));
  const requiredSurfaceCode: ProductSurfaceCode | null = routeProject
    ? isAssistantPage
      ? "assistant"
      : /^\/projects\/[^/]+\/freezone$/.test(pathname)
        ? "freezone"
        : "mainline"
    : null;
  const requiredSurface = requiredSurfaceCode
    ? surfaceAccess(productSurfaces.data, requiredSurfaceCode)
    : undefined;

  // Keep viewport-relative panel sizes (AI assistant width, task panel height)
  // within the current window. Runs once on mount to fix persisted values that
  // were sized on a larger screen, then re-clamps on every window resize.
  useEffect(() => {
    const clamp = useAppStore.getState().clampDimensionsToViewport;
    clamp();
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(clamp);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Avatar is an EE-only feature served by its own endpoint (not /auth/me), so
  // refresh it independently whenever we're logged in — including after a page
  // reload that rehydrates `username` from localStorage. Deliberately NOT routed
  // through getCurrentUser: its 15s cache would skip the fetch and leave the
  // avatar null. login() also fires this once; the extra GET is negligible.
  useEffect(() => {
    if (username) void refreshAvatar();
  }, [username, refreshAvatar]);

  useEffect(() => {
    useRegionStore.getState().sanitizeAgainstConfig();
    if (clusterConfig.mode === "multi-region") {
      initObservability();
      const teardown = initRegionTabSync();
      return teardown;
    }
  }, []);

  useEffect(() => {
    if (!username) {
      if (shouldRedirectMissingUsernameToLogin()) {
        validatedUsernameRef.current = null;
        setValidated(false);
        navigate({ to: "/login" });
        return;
      }
      let cancelled = false;
      setValidated(false);
      validateSessionWithTimeout(validateSession).then((ok) => {
        if (cancelled) return;
        if (!ok) {
          validatedUsernameRef.current = null;
          if (authRequired()) {
            navigate({ to: "/login" });
          } else {
            setValidated(true);
          }
          return;
        }
        validatedUsernameRef.current = useAuthStore.getState().username;
        setValidated(true);
      });
      return () => {
        cancelled = true;
      };
    }
    if (validatedUsernameRef.current === username) {
      setValidated(true);
      return;
    }
    let cancelled = false;
    setValidated(false);
    validateSessionWithTimeout(validateSession).then((ok) => {
      if (cancelled) return;
      if (!ok) {
        validatedUsernameRef.current = null;
        if (authRequired()) {
          navigate({ to: "/login" });
        } else {
          setValidated(true);
        }
      } else {
        validatedUsernameRef.current = username;
        setValidated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [username, navigate, validateSession]);

  useEffect(() => {
    if (routeProject && !projectSummaries.isLoading && canonicalProject === null) {
      navigate({ to: "/", replace: true });
    }
  }, [canonicalProject, navigate, projectSummaries.isLoading, routeProject]);

  if (
    routeProject &&
    (projectSummaries.isLoading ||
      (Boolean(username && validated) && productSurfaces.isPending))
  ) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (backendUnavailable && !routeProject) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background px-6">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Central de Projetos indisponível</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Não foi possível conectar ao backend do TG Criativo. Verifique se a API está em execução e tente novamente.
          </p>
          <button
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!username || !validated) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <TaskCenterProvider projectId={canonicalProject}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <TgCreativeRail />
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
            {!isPerfilPage && <Header />}
            {!isPerfilPage && <MyBuddyCompanion />}
            {!isPerfilPage && <AccessoryUnlockPrompt />}
            {!isPerfilPage && <VersionUpdateDialog />}
            {!isPerfilPage && (
              <PikoInspirationStation
                open={pikoStationOpen}
                onClose={() => setPikoStationOpen(false)}
              />
            )}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <main
                id="main-content"
                tabIndex={-1}
                className={
                  isPerfilPage
                    ? "min-w-0 flex-1 overflow-y-auto p-0 focus:outline-none [scrollbar-gutter:stable]"
                    : isAssistantPage
                      ? "min-w-0 flex-1 overflow-y-auto px-6 pb-0 pt-6 focus:outline-none [scrollbar-gutter:stable]"
                      : "min-w-0 flex-1 overflow-y-auto p-6 focus:outline-none [scrollbar-gutter:stable]"
                }
              >
                <motion.div
                  key={routeTransitionKey}
                  className="h-full min-w-0"
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.28,
                    ease: "easeOut",
                  }}
                >
                  {requiredSurfaceCode && productSurfaces.error ? (
                    <ProductSurfaceUnavailable
                      message="Não foi possível confirmar a disponibilidade agora. Tente novamente em instantes."
                      retry={() => void productSurfaces.refetch()}
                    />
                  ) : requiredSurfaceCode && !requiredSurface ? (
                    <ProductSurfaceUnavailable message="Função não aberta configurada." />
                  ) : requiredSurface && !requiredSurface.available ? (
                    <ProductSurfaceUnavailable
                      message={
                        /[\u3400-\u9fff]/.test(requiredSurface.unavailable_message)
                          ? "Este recurso ainda não está disponível nesta configuração."
                          : requiredSurface.unavailable_message
                      }
                    />
                  ) : (
                    <Outlet />
                  )}
                </motion.div>
              </main>
            </div>
            <TaskPanel />
            <TaskStatusBar onOpenPikoStation={() => setPikoStationOpen(true)} />
          </div>
        </div>
      </div>
    </TaskCenterProvider>
  );
}

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (clusterConfig.mode === "multi-region" && !getRegionCookie()) {
      throw redirect({ to: "/login", replace: true });
    }
    if (!(await ensureAuthenticatedForAppRoute())) {
      throw redirect({ to: "/login", replace: true });
    }
  },
  component: AppLayout,
});
