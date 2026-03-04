#!/bin/bash
# =============================================================================
# Start frontend dev server with hot reload only
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}⚛️  Starting frontend dev server...${NC}"

cd crates/frontend

echo -e "${GREEN}✅ Frontend hot reload enabled${NC}"
echo -e "${BLUE}   App: http://localhost:5173${NC}"
echo -e "${BLUE}   Proxying /api to http://localhost:5000${NC}"
echo ""

npm run dev
