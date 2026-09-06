# SPDX-License-Identifier: Elastic-2.0
# Copyright (c) 2026 TG
"""Isolated Whisper process: cancellation terminates computation too."""

import json
import sys
from pathlib import Path
from novelvideo.client_profile import transcribe

if __name__ == "__main__":
    print(json.dumps(transcribe(Path(sys.argv[1])), ensure_ascii=False))
