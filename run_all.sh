#!/usr/bin/env bash
# CardioTwin - Unified Launcher for Linux & macOS

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "========================================================"
echo "      Starting CardioTwin Full Stack Application        "
echo "========================================================"
echo ""

# 1. Start Backend
echo "[1/2] Launching CardioTwin FastAPI Backend (:8000)..."
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

python3 -m pip install -r requirements.txt >/dev/null 2>&1 || true
python3 -m uvicorn cardiotwin.api.app:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait 3 seconds for backend
sleep 3

# 2. Start Frontend
echo "[2/2] Launching CardioTwin Vite Frontend (:5173)..."
cd "$PROJECT_ROOT/frontend"
npm install --silent >/dev/null 2>&1 || true
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo " All services launched successfully!"
echo " - Backend API:       http://127.0.0.1:8000"
echo " - Interactive Docs:  http://127.0.0.1:8000/docs"
echo " - Frontend UI:       http://localhost:5173"
echo "========================================================"
echo "Press Ctrl+C to stop all services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0" INT TERM
wait
