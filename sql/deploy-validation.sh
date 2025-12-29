#!/bin/bash

# ============================================================================
# Validatie Regels Deployment Script
# Description: Deploy validation rules tables and seed data
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
echo "  Validatie Regels Deployment"
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Deploy validation schema
echo -e "${BLUE}📄 Deploying validation schema...${NC}"
if psql "$DATABASE_URL" -f "$SCRIPT_DIR/070_validation_rules.sql" > /tmp/validation_deploy.txt 2>&1; then
    echo -e "${GREEN}✅ Schema deployed${NC}"
else
    echo -e "${RED}❌ Error deploying schema${NC}"
    cat /tmp/validation_deploy.txt
    exit 1
fi
echo ""

# Seed validation rules
echo -e "${BLUE}📄 Seeding validation rules...${NC}"
if psql "$DATABASE_URL" -f "$SCRIPT_DIR/080_validation_seeds.sql" > /tmp/validation_seed.txt 2>&1; then
    echo -e "${GREEN}✅ Rules seeded${NC}"
else
    echo -e "${RED}❌ Error seeding rules${NC}"
    cat /tmp/validation_seed.txt
    exit 1
fi
echo ""

# Verification
echo "══════════════════════════════════════════════════════════════"
echo "  Verification"
echo "══════════════════════════════════════════════════════════════"
echo ""

echo -e "${BLUE}📊 Checking deployment...${NC}"

# Count total rules
TOTAL_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM ihw.validatie_regel;")
echo "  Total rules: $TOTAL_COUNT"

# Count active rules
ACTIVE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM ihw.validatie_regel WHERE actief = true;")
echo "  Active rules: $ACTIVE_COUNT"

# Count by category
echo ""
echo "  Rules by category:"
psql "$DATABASE_URL" -t -c "
  SELECT 
    '    ' || categorie || ': ' || COUNT(*)
  FROM ihw.validatie_regel 
  WHERE actief = true 
  GROUP BY categorie 
  ORDER BY categorie;
"

# Count by priority
echo ""
echo "  Rules by priority:"
psql "$DATABASE_URL" -t -c "
  SELECT 
    '    Prioriteit ' || prioriteit || ': ' || COUNT(*)
  FROM ihw.validatie_regel 
  WHERE actief = true 
  GROUP BY prioriteit 
  ORDER BY prioriteit;
"

echo ""
echo "══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Validation rules deployed successfully!${NC}"
echo "══════════════════════════════════════════════════════════════"
echo ""

echo "Test the API:"
echo "  curl http://localhost:3000/api/validate/rules"
echo ""

echo "Query rules:"
echo "  psql \"\$DATABASE_URL\" -c 'SELECT regel_code, beschrijving FROM ihw.validatie_regel WHERE actief = true;'"
echo ""

# Cleanup
rm -f /tmp/validation_deploy.txt /tmp/validation_seed.txt

exit 0

