"""Planejamento persistível de campanhas comerciais brasileiras.

O planejador cria variações editoriais reais e não finge geração de mídia. As
etapas de imagem, voz, vídeo e montagem continuam explícitas no motor.
"""

from __future__ import annotations

from typing import Any


CREATIVE_BLUEPRINTS = (
    {
        "angle": "dor_imediata",
        "approach": "Começar pela falta de tempo e mostrar uma entrada possível na rotina.",
        "hook": "Sua agenda está cheia, mas você ainda quer cuidar de si?",
        "promise": "Um começo curto e organizado para encaixar o treino no dia.",
        "proof": "Mostrar o cronômetro, o espaço real de casa e a primeira sequência sem cortes milagrosos.",
        "cta": "Conheça o programa e escolha seu primeiro treino.",
        "scenes": ("celular com agenda cheia", "tapete em um canto da sala", "sequência curta com cronômetro"),
    },
    {
        "angle": "prova_pratica",
        "approach": "Demonstrar o produto em uso, com foco no que a pessoa consegue fazer agora.",
        "hook": "Veja como transformar alguns minutos livres em movimento de verdade.",
        "promise": "Uma demonstração clara para entender o programa antes de começar.",
        "proof": "Gravar o passo a passo de uma sequência e identificar cada etapa na tela.",
        "cta": "Veja a demonstração completa.",
        "scenes": ("apresentação do programa", "demonstração de um exercício", "checagem da sequência concluída"),
    },
    {
        "angle": "objeção",
        "approach": "Responder à dúvida de quem acredita que precisa de academia ou equipamento.",
        "hook": "Você acha que precisa de academia para começar?",
        "promise": "Um caminho em casa para dar o primeiro passo com o que você já tem.",
        "proof": "Comparar o ambiente necessário com o espaço comum usado na demonstração, sem prometer resultado.",
        "cta": "Tire a dúvida e conheça o plano.",
        "scenes": ("pergunta direta para a câmera", "espaço doméstico preparado", "lista visual do que é necessário"),
    },
    {
        "angle": "comparacao",
        "approach": "Contrastar improviso e constância para apresentar organização como benefício.",
        "hook": "Treinar quando dá ou seguir uma rotina que cabe no seu dia?",
        "promise": "Mais clareza para sair do improviso e saber qual é o próximo passo.",
        "proof": "Exibir duas rotinas lado a lado e destacar o calendário simples do programa.",
        "cta": "Compare as opções e conheça o programa.",
        "scenes": ("rotina improvisada em post-its", "calendário semanal simples", "pessoa iniciando a sessão planejada"),
    },
    {
        "angle": "depoimento",
        "approach": "Usar um relato cotidiano, sem promessa absoluta, para criar identificação.",
        "hook": "Eu também dizia que não tinha tempo para treinar.",
        "promise": "Uma experiência realista de quem encontrou um formato mais fácil de manter.",
        "proof": "Depoimento em ambiente cotidiano com detalhes verificáveis da rotina, sem antes e depois.",
        "cta": "Conheça o formato que fez sentido para essa rotina.",
        "scenes": ("relato olhando para a câmera", "detalhe da rotina em casa", "encerramento com convite transparente"),
    },
    {
        "angle": "passo_a_passo",
        "approach": "Ensinar três ações simples para reduzir a fricção de começar.",
        "hook": "Três passos para parar de adiar o primeiro treino.",
        "promise": "Um roteiro simples para preparar o espaço, escolher a sessão e começar.",
        "proof": "Mostrar os três passos numerados sendo realizados em sequência.",
        "cta": "Salve os passos e conheça o programa.",
        "scenes": ("separar o espaço", "selecionar a sessão", "iniciar o exercício"),
    },
    {
        "angle": "beneficio",
        "approach": "Explorar o ganho de praticidade sem transformar benefício em garantia.",
        "hook": "O melhor do treino em casa pode ser a praticidade.",
        "promise": "Mais conveniência para cuidar da rotina sem deslocamento.",
        "proof": "Mostrar a transição entre trabalho, preparação e treino no mesmo ambiente.",
        "cta": "Veja se essa praticidade combina com você.",
        "scenes": ("fim de uma tarefa", "troca rápida de ambiente", "sessão iniciada em casa"),
    },
    {
        "angle": "bastidores",
        "approach": "Revelar como a experiência foi pensada para pessoas com dias corridos.",
        "hook": "Por trás de um treino curto existe uma escolha: facilitar o começo.",
        "promise": "Entender a lógica do programa para usar cada sessão com intenção.",
        "proof": "Mostrar a organização do conteúdo, a seleção de sessões e o espaço de prática.",
        "cta": "Conheça os bastidores do programa.",
        "scenes": ("organização das sessões", "seleção de um objetivo", "prática em ambiente real"),
    },
    {
        "angle": "urgencia",
        "approach": "Criar ação imediata sem urgência falsa: o próximo momento disponível é agora.",
        "hook": "Se você tem alguns minutos hoje, já pode dar um primeiro passo.",
        "promise": "Começar com uma sessão compatível com o tempo disponível.",
        "proof": "Exibir a escolha de duração e o início da sessão, sem contador artificial.",
        "cta": "Escolha sua sessão e comece hoje.",
        "scenes": ("relógio marcando tempo disponível", "seletor de duração", "primeiro movimento"),
    },
    {
        "angle": "oferta",
        "approach": "Apresentar o que está incluído e deixar a decisão clara, sem inventar condição.",
        "hook": "Antes de decidir, veja exatamente o que o programa oferece.",
        "promise": "Uma visão objetiva do conteúdo para avaliar se a oferta serve para sua rotina.",
        "proof": "Listar apenas itens informados no briefing e mostrar a navegação do programa.",
        "cta": "Confira a oferta completa.",
        "scenes": ("visão geral do programa", "detalhes da oferta", "tela final com CTA"),
    },
)


def build_commercial_creatives(
    campaign: dict[str, Any], output: dict[str, Any]
) -> list[dict[str, Any]]:
    """Build distinct, reviewable creative plans for the existing pipeline."""

    count = max(1, min(10, int(output.get("variants", 5))))
    duration = int(output.get("duration_seconds", 30))
    ratio = str(output.get("aspect_ratio", "9:16"))
    audience = str(campaign.get("audience", "seu público"))
    channel = str(campaign.get("primary_channel", "instagram_reels"))
    creatives: list[dict[str, Any]] = []
    for index in range(count):
        blueprint = CREATIVE_BLUEPRINTS[index % len(CREATIVE_BLUEPRINTS)]
        scenes = [
            {
                "order": scene_index + 1,
                "visual": scene,
                "voiceover": blueprint["hook"] if scene_index == 0 else blueprint["promise"],
                "on_screen": f"{scene_index + 1}. {scene.capitalize()}",
            }
            for scene_index, scene in enumerate(blueprint["scenes"])
        ]
        script = "\n".join(
            [
                f"GANCHO: {blueprint['hook']}",
                f"ABORDAGEM: {blueprint['approach']}",
                f"PROMESSA: {blueprint['promise']}",
                f"PROVA: {blueprint['proof']}",
                f"CTA: {blueprint['cta']}",
            ]
        )
        creatives.append(
            {
                "number": index + 1,
                "title": f"Criativo {index + 1:02d} · {blueprint['angle']}",
                "angle": blueprint["angle"],
                "approach": blueprint["approach"],
                "hook": blueprint["hook"],
                "promise": blueprint["promise"],
                "proof": blueprint["proof"],
                "cta": blueprint["cta"],
                "audience": audience,
                "script": script,
                "scenes": scenes,
                "duration_seconds": duration,
                "aspect_ratio": ratio,
                "channel": channel,
                "status": "planejado",
            }
        )
    return creatives
