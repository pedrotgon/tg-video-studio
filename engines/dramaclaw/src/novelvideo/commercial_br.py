"""Planejamento determinístico de campanhas comerciais brasileiras.

Transforma qualquer briefing em variações editoriais revisáveis. Não chama a
geração de mídia nem representa roteiro, imagem ou vídeo como concluído.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any


COMMERCIAL_PLAN_VERSION = 2

CREATIVE_BLUEPRINTS = (
    {
        "angle": "dor_imediata",
        "label": "Dor imediata",
        "hook": "Para {audience}: o que ainda dificulta alcançar {promise}?",
        "approach": "Reconhecer a dificuldade atual do público e apresentar {offer} como próximo passo possível.",
        "proof": "Mostrar uma situação cotidiana do público, o problema real e como {offer} entra nesse contexto.",
        "scenes": (
            "situação real do público",
            "problema em primeiro plano",
            "oferta apresentada como próximo passo",
        ),
    },
    {
        "angle": "prova_pratica",
        "label": "Demonstração prática",
        "hook": "Veja, na prática, como funciona {offer}.",
        "approach": "Demonstrar o uso da oferta sem atalhos, promessas inventadas ou resultados simulados.",
        "proof": "Registrar uma demonstração contínua com detalhes verificáveis e resultado compatível com o briefing.",
        "scenes": (
            "oferta apresentada",
            "uso ou funcionamento demonstrado",
            "resultado observável e contextualizado",
        ),
    },
    {
        "angle": "objecao",
        "label": "Quebra de objeção",
        "hook": "Ainda tem dúvida se {offer} faz sentido para você?",
        "approach": "Responder à principal objeção com linguagem direta, contexto e limites transparentes.",
        "proof": "Contrastar a dúvida comum com fatos, demonstrações ou condições realmente informadas no briefing.",
        "scenes": (
            "objeção apresentada na tela",
            "resposta demonstrada",
            "condições e limites esclarecidos",
        ),
    },
    {
        "angle": "comparacao",
        "label": "Comparação",
        "hook": "Qual é a diferença entre continuar como está e experimentar {offer}?",
        "approach": "Comparar o cenário atual com a proposta da oferta sem desqualificar concorrentes nem inventar dados.",
        "proof": "Usar critérios observáveis relacionados a {promise} em uma comparação lado a lado.",
        "scenes": (
            "cenário atual",
            "oferta aplicada ao mesmo contexto",
            "diferenças resumidas lado a lado",
        ),
    },
    {
        "angle": "depoimento",
        "label": "Depoimento",
        "hook": "Eu queria {promise}, mas precisava de uma solução que coubesse na minha realidade.",
        "approach": "Criar um relato cotidiano e verificável, sem antes e depois enganoso ou garantia absoluta.",
        "proof": "Relacionar a experiência com {offer} a detalhes concretos da rotina e da decisão de compra.",
        "scenes": (
            "relato direto para a câmera",
            "oferta inserida na rotina",
            "aprendizado e convite transparente",
        ),
    },
    {
        "angle": "passo_a_passo",
        "label": "Passo a passo",
        "hook": "Três passos para começar com {offer}.",
        "approach": "Ensinar uma sequência curta que reduza a fricção e torne a oferta compreensível.",
        "proof": "Executar cada passo em ordem e mostrar o que a pessoa precisa para continuar.",
        "scenes": (
            "passo 1: preparar",
            "passo 2: aplicar",
            "passo 3: conferir e avançar",
        ),
    },
    {
        "angle": "beneficio",
        "label": "Benefício principal",
        "hook": "E se {promise} pudesse começar com uma escolha mais simples?",
        "approach": "Traduzir o benefício central em uma situação concreta, sem transformá-lo em garantia.",
        "proof": "Mostrar como {offer} contribui para o benefício no contexto informado pelo público.",
        "scenes": (
            "necessidade do público",
            "benefício em contexto",
            "oferta conectada ao próximo passo",
        ),
    },
    {
        "angle": "bastidores",
        "label": "Bastidores",
        "hook": "O que existe por trás de {offer}?",
        "approach": "Revelar processo, cuidado ou escolhas que sustentam a proposta comercial.",
        "proof": "Mostrar etapas reais, pessoas, materiais ou decisões disponíveis no briefing.",
        "scenes": (
            "origem da oferta",
            "processo ou preparação",
            "resultado pronto para o público",
        ),
    },
    {
        "angle": "acao_agora",
        "label": "Ação imediata",
        "hook": "Se {promise} importa para você, qual é o menor passo possível hoje?",
        "approach": "Criar movimento sem urgência falsa, escassez inventada ou pressão enganosa.",
        "proof": "Apresentar uma ação simples e a consequência imediata realmente oferecida.",
        "scenes": (
            "momento de decisão",
            "primeira ação possível",
            "CTA claro e sem pressão falsa",
        ),
    },
    {
        "angle": "oferta",
        "label": "Oferta objetiva",
        "hook": "Antes de decidir, veja exatamente o que {offer} oferece.",
        "approach": "Explicar a oferta, para quem ela serve e o próximo passo sem inventar preço ou condição.",
        "proof": "Listar somente benefícios, entregáveis e condições presentes no briefing.",
        "scenes": (
            "visão geral da oferta",
            "entregáveis e condições",
            "CTA final com decisão informada",
        ),
    },
)


def _text(value: Any, fallback: str) -> str:
    normalized = " ".join(str(value or "").split())
    return normalized or fallback


def commercial_plan_fingerprint(
    campaign: dict[str, Any], output: dict[str, Any]
) -> str:
    payload = json.dumps(
        {"version": COMMERCIAL_PLAN_VERSION, "campaign": campaign, "output": output},
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build_commercial_creatives(
    campaign: dict[str, Any], output: dict[str, Any]
) -> list[dict[str, Any]]:
    """Cria planos distintos e específicos para o briefing recebido."""

    count = max(1, min(10, int(output.get("variants", 5))))
    duration = max(15, min(60, int(output.get("duration_seconds", 30))))
    ratio = _text(output.get("aspect_ratio"), "9:16")
    audience = _text(campaign.get("audience"), "o público definido")
    offer = _text(campaign.get("offer"), "a oferta")
    promise = _text(campaign.get("core_promise"), "o benefício principal")
    requested_cta = _text(campaign.get("cta"), "Saiba mais")
    channel = _text(campaign.get("primary_channel"), "instagram_reels")
    tone = _text(campaign.get("tone"), "direto, humano e confiável")
    context = {"audience": audience, "offer": offer, "promise": promise}

    creatives: list[dict[str, Any]] = []
    for index in range(count):
        blueprint = CREATIVE_BLUEPRINTS[index]
        hook = blueprint["hook"].format(**context)
        approach = blueprint["approach"].format(**context)
        proof = blueprint["proof"].format(**context)
        visuals = tuple(scene.format(**context) for scene in blueprint["scenes"])
        voiceovers = (hook, f"{promise}. {approach}", f"{proof} {requested_cta}.")
        scenes = [
            {
                "order": scene_index + 1,
                "visual": visual,
                "voiceover": voiceovers[scene_index],
                "on_screen": hook
                if scene_index == 0
                else (promise if scene_index == 1 else requested_cta),
            }
            for scene_index, visual in enumerate(visuals)
        ]
        script_lines = [f"CRIATIVO {index + 1:02d} — {blueprint['label'].upper()}"]
        for scene in scenes:
            script_lines.extend(
                (
                    f"CENA {scene['order']} — {scene['visual'].upper()}",
                    f"NARRAÇÃO: {scene['voiceover']}",
                    f"TEXTO NA TELA: {scene['on_screen']}",
                )
            )
        creatives.append(
            {
                "number": index + 1,
                "title": f"Criativo {index + 1:02d} · {blueprint['label']}",
                "angle": blueprint["angle"],
                "approach": approach,
                "hook": hook,
                "promise": promise,
                "proof": proof,
                "cta": requested_cta,
                "audience": audience,
                "tone": tone,
                "script": "\n".join(script_lines),
                "scenes": scenes,
                "duration_seconds": duration,
                "aspect_ratio": ratio,
                "channel": channel,
                "status": "planejado",
            }
        )
    return creatives
