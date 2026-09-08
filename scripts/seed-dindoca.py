"""Create Dindoca through the original Creative API; never replace existing projects."""
import httpx

API = "http://127.0.0.1:8780/api/v1"
SCRIPT = "Tem sabor que faz a gente se sentir em casa. Queijo coalho, goiabada cascão e produtos do interior escolhidos com cuidado. Dindoca Casa de Fazenda. Conheça nossos produtos."
PRODUCTS = "Carne do sol; picanha e mignon do sol; porco do sol; bode do sol; galinha caipira; codorna; sarapatel; xinxim de bofe; carneiro; bode; rabada; mininico; queijo coalho; requeijão; goiabada cascão; farinha; produtos da mandioca."
payload = {
    "name": "Dindoca", "content_profile": "commercial_br", "market": "pt-BR",
    "spine_template": "narrated", "aspect_ratio": "9:16", "visual_style": "stop_motion_fazenda_br",
    "narration_style": "third_person", "add_subtitles": True,
    "campaign": {
        "name": "Dindoca Casa de Fazenda", "objective": "Captar clientes e divulgar produtos diferenciados do interior",
        "primary_channel": "Instagram", "creative_format": "stop_motion",
        "audience": "Famílias, senhoras e pessoas que gostam de comer bem e de produtos do interior",
        "offer": "Queijo coalho, goiabada cascão e sabores do interior",
        "core_promise": "Qualidade, diferenciação e atendimento acolhedor",
        "cta": "Conheça nossos produtos", "own_script": SCRIPT,
        "tone": "Informal, brasileiro e acolhedor, sem caricatura regional",
        "required_terms": ["Dindoca Casa de Fazenda"],
        "forbidden_terms": ["preços inventados", "delivery garantido", "promoções não confirmadas"],
        "business_brief": {"administrator": "Patrícia Regis Teixeira", "founded": 2016, "employees": 1,
          "products": PRODUCTS, "strengths": "Qualidade e produtos diferenciados, menos comuns de achar",
          "improvements": "Divulgação, entrega, precificação e promoções",
          "mission": "Superar as expectativas do cliente", "vision": "Tornar-se uma grande marca no delivery",
          "competitors": "Mercados e açougues"},
    },
    "output": {"variants": 3, "duration_seconds": 15, "aspect_ratio": "9:16", "captions": True},
    "brand": {"tone": "Acolhedor, bem-humorado e brasileiro", "primary_color": "#19382B", "accent_color": "#C5A880", "logo_asset_id": None},
}

def main():
    with httpx.Client(timeout=60) as client:
        rows = client.get(f"{API}/projects").raise_for_status().json()["data"]
        existing = next((p for p in rows if p["name"] == "Dindoca"), None)
        if existing:
            print("Dindoca already exists; no data overwritten:", existing["id"])
            return
        result = client.post(f"{API}/projects", json=payload).raise_for_status().json()
        if not result.get("ok"): raise RuntimeError(result)
        rows = client.get(f"{API}/projects").raise_for_status().json()["data"]
        project = next(p["id"] for p in rows if p["name"] == "Dindoca")
        r = client.post(f"{API}/styles", json={"id":"stop_motion_fazenda_br", "project":project, "name":"Dindoca — Massinha brasileira", "config":{"style_family":"animation", "animation_subtype":"3d", "style_instructions":"Miniaturas artesanais de argila, casa de fazenda brasileira, luz quente, madeira, verde floresta e terracota. Bento, bode creme de lenço verde, e Dora, galinha amarelo mel. Alimentos apetitosos e proporções consistentes.", "avoid_instructions":"Não usar ambientação asiática, estereótipos, preços ou ofertas inventados.", "style_tag":"STOP MOTION BRASILEIRO", "label":"Dindoca"}}).raise_for_status().json()
        if not r.get("ok"): raise RuntimeError(r)
        for name, description, face in [
            ("Bento", "Bode anfitrião curioso e acolhedor. Apresenta os sabores da casa com humor gentil.", "Mascote de argila creme, chifres pequenos, lenço verde floresta, olhos expressivos. Miniatura artesanal."),
            ("Dora", "Galinha anfitriã alegre. Convida a família para a mesa e apresenta queijo e goiabada.", "Galinha de argila amarelo mel, crista terracota, asas arredondadas, olhar simpático. Miniatura artesanal."),
        ]:
            r=client.post(f"{API}/projects/{project}/characters",json={"name":name,"role":"Mascote da marca","description":description,"face_prompt":face,"age_group":"adult"}).raise_for_status().json()
            if not r.get("ok"): raise RuntimeError(r)
        r=client.post(f"{API}/projects/{project}/scenes",json={"name":"Cozinha da Casa de Fazenda","scene_type":"interior","time_of_day":"Manhã","description":"Cozinha brasileira acolhedora, mesa de madeira, janela verde, cerâmica e toalha de linho.","environment_prompt":"Miniatura de argila stop motion, luz quente natural. Queijo coalho, goiabada cascão e farinha sobre a mesa. Verde floresta, creme e terracota.","notes":"Conceito visual original; não representa instalações ou produtos reais fotografados."}).raise_for_status().json()
        if not r.get("ok"): raise RuntimeError(r)
        print("Dindoca created with original API:", project)

if __name__ == "__main__": main()
