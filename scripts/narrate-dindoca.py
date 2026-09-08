"""Generate Portuguese narration and captions from actual word timestamps."""
import asyncio
import json
from pathlib import Path
import edge_tts
from seed_dindoca_text import SCRIPT

media = Path(__file__).resolve().parents[1] / "public/dindoca"

async def main():
    words = []
    speech = edge_tts.Communicate(SCRIPT, "pt-BR-FranciscaNeural", rate="-20%", boundary="WordBoundary")
    with (media / "narracao.mp3").open("wb") as audio:
        async for chunk in speech.stream():
            if chunk["type"] == "audio": audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary": words.append(chunk)
    cues=[]
    for start in range(0,len(words),6):
        group=words[start:start+6]
        cues.append({"start":group[0]["offset"]/1e7,"end":(group[-1]["offset"]+group[-1]["duration"])/1e7+.12,"text":" ".join(w["text"] for w in group)})
    (media / "cues.json").write_text(json.dumps(cues,ensure_ascii=False),encoding="utf-8")
    def stamp(t):
        ms=round(t*1000);return f"00:{ms//60000:02d}:{ms//1000%60:02d}.{ms%1000:03d}"
    (media / "legendas.vtt").write_text("WEBVTT\n\n"+"\n\n".join(f"{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for c in cues)+"\n",encoding="utf-8")
    print(f"Narration and {len(cues)} synchronized captions generated.")

asyncio.run(main())
