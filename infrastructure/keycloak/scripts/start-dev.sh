#!/bin/bash
#
# Start Keycloak Development Environment with DigiD Integration
# Usage: ./start-dev.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Keycloak DigiD Integration - Development Environment   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    echo "✅ Created .env file. Please review and update with your settings."
    echo ""
fi

# Load environment variables
set -a
source "$PROJECT_ROOT/.env"
set +a

# Check for Extended SAML IDP plugin
if ! ls "$PROJECT_ROOT/providers"/keycloak-saml-extended-*.jar 1> /dev/null 2>&1; then
    echo "⚠️  Extended SAML IDP plugin not found!"
    echo ""
    echo "Please download the plugin from:"
    echo "  https://github.com/First8/Extended-SAML-IDP/releases"
    echo ""
    echo "Place the JAR file in: $PROJECT_ROOT/providers/"
    echo ""
    read -p "Continue without plugin? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Start services
echo "Starting services..."
echo ""

cd "$PROJECT_ROOT"

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

$DOCKER_COMPOSE up -d

echo ""
echo "Waiting for services to be ready..."
echo ""

# Wait for PostgreSQL
echo -n "Waiting for PostgreSQL... "
until docker exec keycloak-postgres pg_isready -U "$KC_DB_USERNAME" > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " ✅"

# Wait for Keycloak
echo -n "Waiting for Keycloak... "
MAX_RETRIES=60
RETRY_COUNT=0
until curl -sf http://localhost:${KEYCLOAK_PORT}/auth/health/ready > /dev/null 2>&1; do
    echo -n "."
    sleep 3
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo " ❌"
        echo "Keycloak did not start within expected time. Check logs:"
        echo "  docker logs keycloak-digid"
        exit 1
    fi
done
echo " ✅"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                   Services Ready!                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Keycloak Admin Console:"
echo "   http://localhost:${KEYCLOAK_PORT}/admin"
echo "   Username: $KC_ADMIN_USER"
echo "   Password: $KC_ADMIN_PASS"
echo ""
echo "🔗 Keycloak Base URL:"
echo "   http://localhost:${KEYCLOAK_PORT}"
echo ""
echo "🗄️  PostgreSQL:"
echo "   Host: localhost:${POSTGRES_PORT}"
echo "   Database: $KC_DB_NAME"
echo "   Username: $KC_DB_USERNAME"
echo ""
echo "📋 Next steps:"
echo "   1. Run configuration script:"
echo "      ./scripts/configure-realm.sh"
echo ""
echo "   2. Download DigiD metadata (preprod):"
echo "      curl $DIGID_IDP_METADATA_URL > digid-metadata.xml"
echo ""
echo "   3. Configure certificates for DigiD (see docs/certificate-setup.md)"
echo ""
echo "   4. Test integration:"
echo "      ./scripts/test-integration.sh"
echo ""
echo "View logs:"
echo "  docker logs -f keycloak-digid"
echo ""
echo "Stop services:"
echo "  docker-compose down"
echo ""

