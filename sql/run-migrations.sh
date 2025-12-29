#!/bin/bash

# ============================================================================
# Run pending migrations
# Description: Apply all SQL migrations in the migrations folder
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  Running Database Migrations"
echo "══════════════════════════════════════════════════════════════"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set your Neon connection string:"
    echo "  export DATABASE_URL='postgresql://user:pass@host.neon.tech/neondb?sslmode=require'"
    echo ""
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ ERROR: psql is not installed${NC}"
    echo ""
    exit 1
fi

# Test connection
echo -e "${BLUE}🔌 Testing database connection...${NC}"
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to database${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connection successful${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${YELLOW}⚠️  No migrations directory found${NC}"
    exit 0
fi

# Find all SQL files in migrations directory
SQL_FILES=($(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort))

if [ ${#SQL_FILES[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No migration files found${NC}"
    exit 0
fi

echo -e "${BLUE}Found ${#SQL_FILES[@]} migration(s)${NC}"
echo ""

# Execute each migration
for filepath in "${SQL_FILES[@]}"; do
    filename=$(basename "$filepath")
    
    echo -e "${BLUE}📄 Running $filename...${NC}"
    
    if psql "$DATABASE_URL" -f "$filepath" > /tmp/migration_output.txt 2>&1; then
        grep "✓" /tmp/migration_output.txt || true
        echo -e "${GREEN}✅ $filename completed${NC}"
    else
        echo -e "${RED}❌ Error in $filename${NC}"
        echo ""
        echo "Error output:"
        cat /tmp/migration_output.txt
        exit 1
    fi
    
    echo ""
done

echo "══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
echo "══════════════════════════════════════════════════════════════"
echo ""

# Cleanup
rm -f /tmp/migration_output.txt

exit 0

