#!/bin/bash
set -e

echo "🦀 Latents Migration Script"
echo "============================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
command -v rustc >/dev/null 2>&1 || { echo "Rust not found. Install from https://rustup.rs/"; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo "Cargo not found. Install from https://rustup.rs/"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js not found. Install from https://nodejs.org/"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "PostgreSQL client not found. Please install PostgreSQL."; exit 1; }

echo -e "${GREEN}✓ All prerequisites found${NC}"

# Step 2: Setup environment
echo -e "${YELLOW}Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Created .env file. Please edit it with your database credentials.${NC}"
fi

# Step 3: Install SQLx CLI (if not already installed)
echo -e "${YELLOW}Installing SQLx CLI...${NC}"
cargo install sqlx-cli --no-default-features --features native-tls,postgres 2>/dev/null || true

# Step 4: Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd crates/frontend
npm install
npm run build
cd ../..
echo -e "${GREEN}✓ Frontend built${NC}"

# Step 5: Setup database (if DATABASE_URL is set)
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    
    if [ -n "$DATABASE_URL" ]; then
        echo -e "${YELLOW}Setting up database...${NC}"
        
        # Extract database name from URL
        DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        # Create database if it doesn't exist
        psql postgres://postgres:password@localhost:5432/postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
            psql postgres://postgres:password@localhost:5432/postgres -c "CREATE DATABASE $DB_NAME"
        
        # Run migrations
        cd crates/server
        cargo sqlx migrate run
        cd ../..
        
        echo -e "${GREEN}✓ Database setup complete${NC}"
    fi
fi

# Step 6: Build server
echo -e "${YELLOW}Building Rust server...${NC}"
cargo build --release -p latents-server
echo -e "${GREEN}✓ Server built${NC}"

echo ""
echo -e "${GREEN}🎉 Migration complete!${NC}"
echo ""
echo "To run the server:"
echo "  ./target/release/latents-server"
echo ""
echo "Or for development:"
echo "  cargo run -p latents-server"
