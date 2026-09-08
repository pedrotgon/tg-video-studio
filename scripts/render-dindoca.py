"""Render the first concept film from the original generated art and PT-BR narration."""
from pathlib import Path
import subprocess
import json
import imageio_ffmpeg

root = Path(__file__).resolve().parents[1]
media = root / "public/dindoca"
subtitles = '''[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Georgia,72,&H002B3819,&H002B3819,&H00FFFFFF,&H00000000,0,0,0,0,100,100,1,0,1,0,0,8,45,45,95,1
Style: Label,Arial,23,&H002B3819,&H002B3819,&H00FFFFFF,&H00000000,1,0,0,0,100,100,3,0,1,0,0,8,35,35,185,1
Style: Copy,Georgia,40,&H002B3819,&H002B3819,&H00FFFFFF,&H00000000,0,0,0,0,100,100,0,0,1,0,0,8,65,65,270,1
Style: Caption,Arial,27,&H00FFFFFF,&H00FFFFFF,&H002B3819,&H802B3819,0,0,0,0,100,100,0,0,3,9,0,2,50,50,76,1
Style: Note,Arial,16,&H00FFFFFF,&H00FFFFFF,&H002B3819,&H002B3819,0,0,0,0,100,100,0,0,1,1,0,2,30,30,28,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:18.00,Title,,0,0,0,,{\\fad(450,500)}Dindoca
Dialogue: 0,0:00:00.00,0:00:18.00,Label,,0,0,0,,{\\fad(450,500)}CASA DE FAZENDA
Dialogue: 0,0:00:00.40,0:00:05.50,Copy,,0,0,0,,{\\fad(300,300)}Tem sabor que\\Nabraça a gente.
Dialogue: 0,0:00:05.50,0:00:11.50,Copy,,0,0,0,,{\\fad(300,300)}Coisas boas\\Ndo nosso interior.
Dialogue: 0,0:00:11.50,0:00:18.00,Copy,,0,0,0,,{\\fad(300,500)}Sua mesa merece\\Nesse carinho.
Dialogue: 0,0:00:00.20,0:00:04.80,Caption,,0,0,0,,Tem sabor que faz a gente\\Nse sentir em casa.
Dialogue: 0,0:00:04.80,0:00:09.70,Caption,,0,0,0,,Queijo coalho, goiabada cascão\\Ne produtos do interior.
Dialogue: 0,0:00:09.70,0:00:13.00,Caption,,0,0,0,,Escolhidos com cuidado.
Dialogue: 0,0:00:13.00,0:00:18.00,Caption,,0,0,0,,Dindoca Casa de Fazenda.\\NConheça nossos produtos.
Dialogue: 0,0:00:00.00,0:00:18.00,Note,,0,0,0,,Filme conceito • Ilustração com IA
'''
if (media / "cues.json").exists():
    subtitles = "\n".join(line for line in subtitles.splitlines() if not (line.startswith("Dialogue:") and ",Caption," in line)) + "\n"
    def stamp(t):
        cs=round(t*100);return f"0:{cs//6000:02d}:{cs//100%60:02d}.{cs%100:02d}"
    for cue in json.loads((media / "cues.json").read_text(encoding="utf-8")):
        subtitles += f"Dialogue: 0,{stamp(cue['start'])},{stamp(cue['end'])},Caption,,0,0,0,,{cue['text']}\n"
(media / "filme.ass").write_text(subtitles, encoding="utf-8")
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loop", "1", "-i", "casa-de-fazenda.png", "-i", "narracao.mp3", "-vf", "scale=1080:1920,zoompan=z='1+0.00012*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=720x1280:fps=24,ass=filme.ass,fade=t=in:st=0:d=0.4,fade=t=out:st=17.5:d=0.5", "-af", "apad,afade=t=out:st=17.5:d=0.5", "-t", "18", "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "dindoca-filme-conceito.mp4"], cwd=media, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
print(media / "dindoca-filme-conceito.mp4")
