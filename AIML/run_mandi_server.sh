#!/usr/bin/env bash
# One-command start: Mandi Intelligence + Govt Schemes (incl. PMFBY claim PDF) on port 8000.
# First-time: from AIML run: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
set -e
cd "$(dirname "$0")"
cd mandi_intelligence/api
AIML_ROOT="$(cd ../.. && pwd)"
if [ -d "$AIML_ROOT/.venv" ]; then
  echo "Starting Mandi + Govt Schemes (PMFBY PDF) on http://0.0.0.0:8000 ..."
  exec "$AIML_ROOT/.venv/bin/python" -m uvicorn main:app --port 8000 --host 0.0.0.0
else
  echo "No .venv found. Create with: cd AIML && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
  exec python3 -m uvicorn main:app --port 8000 --host 0.0.0.0
fi
