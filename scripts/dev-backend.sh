#!/bin/bash
# =============================================================================
# Start backend with hot reload only
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🦀 Starting backend with hot reload...${NC}"

# Check if cargo-watch is installed
if ! command -v cargo-watch &> /dev/null; then
    echo -e "${YELLOW}⚠️  cargo-watch not found. Installing...${NC}"
    cargo install cargo-watch
fi

echo -e "${GREEN}✅ Backend hot reload enabled${NC}"
echo -e "${BLUE}   API: http://localhost:5000${NC}"
echo ""

cargo watch -p latents-server -x run
