"""Attach locally produced Dindoca assets to the original project and pipeline."""
from pathlib import Path
import json
import shutil
import sqlite3
import httpx

root = Path(__file__).resolve().parents[1]
engine = root / "engines/dramaclaw"
with sqlite3.connect(engine / "state/local/projects.db") as db:
    project, state, output = db.execute("SELECT id,state_dir,output_dir FROM projects WHERE name='Dindoca'").fetchone()
config_path = Path(state) / "project_config.json"
config = json.loads(config_path.read_text(encoding="utf-8"))
plans = [
    ("Sua mesa merece carinho", "Tem sabor que faz a gente se sentir em casa. Queijo coalho, goiabada cascão e produtos do interior escolhidos com cuidado. Dindoca Casa de Fazenda. Conheça nossos produtos.", ["Bento e Dora recebem a família na cozinha", "Queijo coalho e goiabada cascão em destaque", "Mesa acolhedora e convite para conhecer a Dindoca"]),
    ("Um encontro de queijo e goiabada", "Dora trouxe a goiabada. Bento já separou o queijo. E você, já escolheu a companhia? Dindoca Casa de Fazenda. Coisas boas do interior para compartilhar.", ["Dora apresenta a goiabada cascão", "Bento aproxima o queijo coalho", "Os dois convidam para compartilhar à mesa"]),
    ("Domingo tem gosto de casa", "A conversa vai ficando boa. A mesa vai ganhando vida. Farinha, queijo e sabores que lembram o interior. Dindoca Casa de Fazenda. Qual sabor não pode faltar no seu domingo?", ["Luz da manhã entra pela janela verde", "Produtos da mandioca e queijo completam a mesa", "Bento e Dora fazem o convite de domingo"]),
]
with httpx.Client(base_url="http://127.0.0.1:8780/api/v1", timeout=60) as client:
    for number,(title,script,visuals) in enumerate(plans,1):
        creative = config["creatives"][number-1]
        creative.update(title=title,script=script,hook=script.split('.')[0],approach="Afeto e descoberta dos sabores do interior com os mascotes da marca",proof="Produtos informados no briefing; imagens ilustrativas",status="concept_film" if number==1 else "planned")
        creative["scenes"] = [{"order":i+1,"visual":visual,"voiceover":script if i==0 else "","on_screen":"Dindoca Casa de Fazenda" if i==2 else ""} for i,visual in enumerate(visuals)]
        response = client.patch(f"/projects/{project}/episodes/{number}",json={"title":title,"beat_source_text":script,"character_names":["Bento","Dora"],"key_events":visuals}).raise_for_status().json()
        assert response["ok"]
    with (root / "public/dindoca/casa-de-fazenda.png").open("rb") as image:
        response=client.post(f"/projects/{project}/scenes/Cozinha da Casa de Fazenda/master/upload", files={"file":("casa-de-fazenda.png",image,"image/png")}).raise_for_status().json()
        assert response["ok"]
    config_path.write_text(json.dumps(config,ensure_ascii=False,indent=2),encoding="utf-8")
    target=Path(output)/"videos/episodes/ep001_final.mp4"
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(root/"public/dindoca/dindoca-filme-conceito.mp4",target)
    result=client.get(f"/projects/{project}/episodes/1/final").raise_for_status().json()
    assert result["data"]["exists"]
    print("Dindoca: three scripts, scene reference and first film attached to native pipeline.")
