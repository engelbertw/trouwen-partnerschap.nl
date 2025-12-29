#!/bin/bash

# ============================================================================
# ihuwelijk Database Deployment Script
# Version: 1.0
# Description: Deploy complete ihuwelijk database to Neon Postgres
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
echo "  ihuwelijk Database Deployment"
echo "══════════════════════════════════════════════════════════════"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set your Neon connection string:"
    echo "  export DATABASE_URL='postgresql://user:pass@host.neon.tech/neondb?sslmode=require'"
    echo ""
    echo "Or add to .env file:"
    echo "  DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require"
    echo ""
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ ERROR: psql is not installed${NC}"
    echo ""
    echo "Install PostgreSQL client:"
    echo "  macOS:   brew install postgresql"
    echo "  Ubuntu:  sudo apt-get install postgresql-client"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    echo ""
    exit 1
fi

# Test connection
echo -e "${BLUE}🔌 Testing database connection...${NC}"
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo "Please check your DATABASE_URL"
    exit 1
fi
echo -e "${GREEN}✅ Connection successful${NC}"
echo ""

# Confirm deployment
echo -e "${YELLOW}⚠️  This will create/modify database schema and data${NC}"
echo ""
read -p "Continue with deployment? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy](es)?$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Array of SQL files to execute
SQL_FILES=(
    "000_schema.sql"
    "010_enums_lookups.sql"
    "015_gemeente_table.sql"
    "016_add_gemeente_oin_to_tables.sql"
    "017_gemeente_immutability.sql"
    "020_core_tables.sql"
    "030_payment_communication.sql"
    "040_triggers_functions.sql"
    "050_views.sql"
    "060_seeds.sql"
    "070_validation_rules.sql"
    "080_validation_seeds.sql"
)

# Execute each SQL file
echo "══════════════════════════════════════════════════════════════"
echo "  Starting deployment"
echo "══════════════════════════════════════════════════════════════"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for file in "${SQL_FILES[@]}"; do
    filepath="$SCRIPT_DIR/$file"
    
    if [ ! -f "$filepath" ]; then
        echo -e "${RED}❌ File not found: $file${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}📄 Running $file...${NC}"
    
    if psql "$DATABASE_URL" -f "$filepath" > /tmp/deployment_output.txt 2>&1; then
        # Show output with ✓ symbols
        grep "✓" /tmp/deployment_output.txt || true
        echo -e "${GREEN}✅ $file completed${NC}"
    else
        echo -e "${RED}❌ Error in $file${NC}"
        echo ""
        echo "Error output:"
        cat /tmp/deployment_output.txt
        exit 1
    fi
    
    echo ""
done

# Verification
echo "══════════════════════════════════════════════════════════════"
echo "  Verification"
echo "══════════════════════════════════════════════════════════════"
echo ""

echo -e "${BLUE}📊 Checking deployment...${NC}"

# Count tables
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'ihw';")
echo "  Tables created: $TABLE_COUNT"

# Count ceremony types
CEREMONY_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM ihw.type_ceremonie;")
echo "  Ceremony types: $CEREMONY_COUNT"

# Count locations
LOCATION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM ihw.locatie;")
echo "  Locations: $LOCATION_COUNT"

# Count BABS
BABS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM ihw.babs;")
echo "  BABS: $BABS_COUNT"

# Count time slots
SLOT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM ihw.tijdslot;")
echo "  Time slots: $SLOT_COUNT"

# Count validation rules
VALIDATION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM ihw.validatie_regel WHERE actief = true;" 2>/dev/null || echo "0")
echo "  Validation rules: $VALIDATION_COUNT"

echo ""

# Success
echo "══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "══════════════════════════════════════════════════════════════"
echo ""

echo "Next steps:"
echo "  1. Review the database in Neon Console"
echo "  2. Run verification queries (see README.md)"
echo "  3. Configure application DATABASE_URL"
echo "  4. Test connection from your app"
echo ""

echo "Useful commands:"
echo "  psql \"\$DATABASE_URL\" -c 'SELECT * FROM ihw.v_statistics;'"
echo "  psql \"\$DATABASE_URL\" -c '\dt ihw.*'"
echo "  psql \"\$DATABASE_URL\" -c '\dv ihw.*'"
echo ""

# Cleanup
rm -f /tmp/deployment_output.txt

exit 0

