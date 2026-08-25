import json
import subprocess
from pathlib import Path


def test_production_react_surfaces_have_no_hardcoded_cjk_ui_literals() -> None:
    repository = Path(__file__).resolve().parents[3]
    audit = repository / "scripts/audit_cjk_ui.mjs"
    output = subprocess.check_output(
        ["node", str(audit), "--json"], cwd=repository, text=True
    )

    assert json.loads(output) == []
