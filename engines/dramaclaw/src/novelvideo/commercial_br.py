"""Planejamento determinístico para campanhas comerciais brasileiras.

O módulo cria estrutura editorial persistível; ele não finge geração de mídia.
As etapas de roteiro, imagem, voz, vídeo e montagem continuam usando o motor
existente e só começam quando o usuário as aciona.
"""

from __future__ import annotations

from typing import Any


ANGLE_LIBRARY = (
    ("dor_imediata", "O problema que está travando o público hoje"),
    ("prova_pratica", "A demonstração simples da transformação"),
    ("objeção", "A resposta à principal dúvida antes da compra"),
    ("comparação", "O que muda quando a solução entra na rotina"),
    ("urgencia", "O motivo claro para agir agora"),
    ("bastidores", "A história humana por trás da oferta"),
    ("passo_a_passo", "Um primeiro passo fácil e aplicável"),
    ("depoimento", "A experiência de alguém com o mesmo desafio"),
    ("beneficio", "O benefício mais valioso em linguagem direta"),
    ("oferta", "A oferta explicada sem rodeios"),
)


def build_commercial_creatives(
    campaign: dict[str, Any], output: dict[str, Any]
) -> list[dict[str, Any]]:
    """Gera cartões de criativo reais para orientar o pipeline existente."""

    count = max(1, min(10, int(output.get("variants", 5))))
    duration = int(output.get("duration_seconds", 30))
    ratio = str(output.get("aspect_ratio", "9:16"))
    offer = str(campaign.get("offer", "a oferta"))
    promise = str(campaign.get("core_promise", "uma transformação prática"))
    cta = str(campaign.get("cta", "Saiba mais"))
    audience = str(campaign.get("audience", "seu público"))
    channel = str(campaign.get("primary_channel", "instagram_reels"))
    creatives: list[dict[str, Any]] = []
    for index in range(count):
        key, angle = ANGLE_LIBRARY[index % len(ANGLE_LIBRARY)]
        creatives.append(
            {
                "number": index + 1,
                "title": f"Criativo {index + 1:02d} · {angle}",
                "angle": key,
                "hook": f"Se você é {audience.lower()} e ainda enfrenta esse desafio, veja isto.",
                "promise": promise,
                "proof": f"Demonstração contextual de {offer} em situação cotidiana.",
                "cta": cta,
                "duration_seconds": duration,
                "aspect_ratio": ratio,
                "channel": channel,
                "status": "planejado",
            }
        )
    return creatives
