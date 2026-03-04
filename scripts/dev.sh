#!/bin/bash
# =============================================================================
# Development script - Starts both backend and frontend with hot reload
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Latents Development Environment${NC}"
echo "========================================"

# Check if cargo-watch is installed
if ! command -v cargo-watch &> /dev/null; then
    echo -e "${YELLOW}⚠️  cargo-watch not found. Installing...${NC}"
    cargo install cargo-watch
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down development servers...${NC}"
    pkill -f "cargo watch" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Create logs directory
mkdir -p logs

# Start backend in background
echo -e "${GREEN}🦀 Starting backend server...${NC}"
cargo watch -p latents-server -q -x run > logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start. Check logs/backend.log${NC}"
    cat logs/backend.log
    exit 1
fi

echo -e "${GREEN}✅ Backend running (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}   API: http://localhost:5000${NC}"

# Start frontend in background
echo -e "${GREEN}⚛️  Starting frontend dev server...${NC}"
cd crates/frontend
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
sleep 3

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend failed to start. Check logs/frontend.log${NC}"
    cat logs/frontend.log
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Frontend running (PID: $FRONTEND_PID)${NC}"
echo -e "${BLUE}   App: http://localhost:5173${NC}"

echo ""
echo "========================================"
echo -e "${GREEN}🎉 Development environment ready!${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  • Backend API:  http://localhost:5000"
echo "  • Frontend App: http://localhost:5173"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "  • Backend:  tail -f logs/backend.log"
echo "  • Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo "========================================"

# Wait for both processes
wait
