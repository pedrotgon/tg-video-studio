import sys
import time
import json
import subprocess
import httpx
from pathlib import Path

GATEWAY_URL = "http://127.0.0.1:8000"

SUBJECT = "Treino em casa que queima pochete"
SCRIPT = (
    "Se você quer eliminar aquela gordurinha acumulada na parte inferior da barriga sem precisar sair de casa, "
    "existe uma combinação de movimentos que foca exatamente nessa região. Ao ativar a musculatura profunda "
    "do abdômen com a técnica correta, você melhora a firmeza da pele, fortalece o core e estimula o gasto calórico.\n\n"
    "Para fazer na sua sala, comece na posição de prancha e puxe os joelhos alternadamente em direção ao peito, "
    "mantendo o abdômen contraído. Em seguida, deite-se de costas, apoie a lombar e eleve as pernas devagar, "
    "garantindo que toda a força venha do abdômen inferior.\n\n"
    "Essa rotina simples melhora a postura, define a cintura e se adapta à sua rotina diária sem nenhum equipamento. "
    "Clique no botão abaixo para conferir o passo a passo completo e comece agora mesmo."
)

def run():
    print(f"[1/5] Disparando gerador de vídeo para o tema: '{SUBJECT}'...")
    payload = {
        "videoSubject": SUBJECT,
        "videoScript": SCRIPT,
        "tone": "direto",
        "keywords": "home workout, abs workout, burning belly fat, fitness exercise",
        "voiceName": "pt-BR-FranciscaNeural",
        "videoRatio": "9:16",
        "subtitleEnabled": True,
        "subtitlePosition": "bottom"
    }

    with httpx.Client(timeout=30) as client:
        resp = client.post(f"{GATEWAY_URL}/api/simple/generate", json=payload)
        resp.raise_for_status()
        data = resp.json()
        task_id = data.get("id")
        print(f"Tarefa iniciada com ID: {task_id}")

    print(f"[2/5] Acompanhando processamento da esteira (Task {task_id})...")
    start_time = time.time()
    video_url = None
    last_step = ""

    while time.time() - start_time < 360: # 6 min max
        time.sleep(4)
        with httpx.Client(timeout=15) as client:
            resp = client.get(f"{GATEWAY_URL}/api/simple/tasks/{task_id}")
            if resp.status_code != 200:
                print(f"Polling HTTP {resp.status_code}")
                continue
            task_info = resp.json()
            status = task_info.get("status")
            progress = task_info.get("progress")
            msg = task_info.get("currentStepMessage")
            if msg != last_step:
                print(f"Progresso {progress}%: {msg}")
                last_step = msg

            if status == "completed":
                video_url = task_info.get("videoUrl")
                print(f"[3/5] Vídeo gerado com sucesso! URL: {video_url}")
                break
            elif status == "error":
                print(f"ERRO na esteira: {task_info.get('error')}")
                sys.exit(1)

    if not video_url:
        print("Timeout aguardando geração do vídeo.")
        sys.exit(1)

    print("[4/5] Baixando e inspecionando vídeo com ffprobe...")
    out_dir = Path("test_results")
    out_dir.mkdir(exist_ok=True)
    local_video_path = out_dir / f"e2e_video_{task_id}.mp4"

    with httpx.Client(timeout=60) as client:
        v_resp = client.get(video_url)
        v_resp.raise_for_status()
        local_video_path.write_bytes(v_resp.content)
    print(f"Vídeo salvo localmente em: {local_video_path} ({local_video_path.stat().st_size / 1024 / 1024:.2f} MB)")

    # Run ffprobe
    probe_cmd = [
        "/Users/pedrotgon/.local/bin/ffprobe",
        "-v", "error",
        "-show_entries", "format=duration,size,bit_rate:stream=codec_type,codec_name,width,height",
        "-of", "json",
        str(local_video_path)
    ]
    probe_res = subprocess.run(probe_cmd, capture_output=True, text=True)
    probe_data = json.loads(probe_res.stdout)

    streams = probe_data.get("streams", [])
    format_info = probe_data.get("format", {})
    duration = float(format_info.get("duration", 0))

    video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

    print(f"Duração: {duration:.1f}s")
    if video_stream:
        print(f"Vídeo: {video_stream.get('codec_name')}, Resolução: {video_stream.get('width')}x{video_stream.get('height')}")
    if audio_stream:
        print(f"Áudio: {audio_stream.get('codec_name')}")

    # Extract sample frames to verify visual quality & subtitles
    print("[5/5] Extraindo frames de amostra (início, meio e fim)...")
    for t_sec, label in [(2, "frame_01_hook"), (duration / 2, "frame_02_body"), (max(1, duration - 3), "frame_03_cta")]:
        frame_path = out_dir / f"{label}.jpg"
        extract_cmd = [
            "/Users/pedrotgon/.local/bin/ffmpeg",
            "-y",
            "-ss", str(t_sec),
            "-i", str(local_video_path),
            "-vframes", "1",
            "-q:v", "2",
            str(frame_path)
        ]
        subprocess.run(extract_cmd, capture_output=True)
        print(f"Frame gerado: {frame_path} ({frame_path.stat().st_size} bytes)")

    print("\n=== VALIDAÇÃO DE QUALIDADE ===")
    assert duration >= 15, f"Vídeo muito curto ({duration}s)"
    assert video_stream and video_stream.get("height", 0) > video_stream.get("width", 0), "Vídeo não está na proporção vertical 9:16"
    assert audio_stream is not None, "Vídeo não possui faixa de áudio"
    print("✅ TESTE E2E APROVADO! Todos os critérios técnicos e de renderização passaram com sucesso.")

if __name__ == "__main__":
    run()
