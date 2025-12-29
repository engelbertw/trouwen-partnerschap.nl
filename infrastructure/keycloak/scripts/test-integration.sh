#!/bin/bash
#
# Test Keycloak/DigiD Integration
# Verifies all endpoints and configuration
#
# Usage: ./test-integration.sh
#

set -euo pipefail

KEYCLOAK_URL="${KEYCLOAK_BASE_URL:-http://localhost:8080}"
REALM="${REALM:-nl-huwelijk}"
DIGID_IDP_ALIAS="digid"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Keycloak/DigiD Integration Test Suite               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Testing: $KEYCLOAK_URL"
echo "Realm: $REALM"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run tests
run_test() {
    local test_name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "Test: $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        if [ -n "$expected" ]; then
            result=$(eval "$command" 2>/dev/null)
            if echo "$result" | grep -q "$expected"; then
                echo "✅ PASSED"
                TESTS_PASSED=$((TESTS_PASSED + 1))
                return 0
            else
                echo "❌ FAILED (expected: $expected)"
                TESTS_FAILED=$((TESTS_FAILED + 1))
                return 1
            fi
        else
            echo "✅ PASSED"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        fi
    else
        echo "❌ FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Keycloak Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Infrastructure Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
run_test "Keycloak availability" \
    "curl -sf $KEYCLOAK_URL/health/ready" \
    ""

run_test "Keycloak admin console" \
    "curl -sf $KEYCLOAK_URL/admin/" \
    ""

# Test 2: Realm Configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Realm Configuration Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
run_test "Realm exists" \
    "curl -sf $KEYCLOAK_URL/realms/$REALM" \
    "realm"

run_test "Realm account console" \
    "curl -sf $KEYCLOAK_URL/realms/$REALM/account/" \
    ""

# Test 3: OIDC Endpoints
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. OIDC Endpoint Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DISCOVERY_URL="$KEYCLOAK_URL/realms/$REALM/.well-known/openid-configuration"

run_test "OIDC discovery endpoint" \
    "curl -sf $DISCOVERY_URL" \
    "authorization_endpoint"

if curl -sf "$DISCOVERY_URL" > /tmp/discovery.json 2>&1; then
    AUTH_ENDPOINT=$(jq -r '.authorization_endpoint' /tmp/discovery.json 2>/dev/null || echo "")
    TOKEN_ENDPOINT=$(jq -r '.token_endpoint' /tmp/discovery.json 2>/dev/null || echo "")
    USERINFO_ENDPOINT=$(jq -r '.userinfo_endpoint' /tmp/discovery.json 2>/dev/null || echo "")
    JWKS_URI=$(jq -r '.jwks_uri' /tmp/discovery.json 2>/dev/null || echo "")
    
    if [ -n "$AUTH_ENDPOINT" ]; then
        echo "  → Authorization endpoint: $AUTH_ENDPOINT"
    fi
    if [ -n "$TOKEN_ENDPOINT" ]; then
        echo "  → Token endpoint: $TOKEN_ENDPOINT"
    fi
    if [ -n "$USERINFO_ENDPOINT" ]; then
        echo "  → UserInfo endpoint: $USERINFO_ENDPOINT"
    fi
    if [ -n "$JWKS_URI" ]; then
        echo "  → JWKS URI: $JWKS_URI"
    fi
fi

run_test "JWKS endpoint" \
    "curl -sf $KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/certs" \
    "keys"

# Test 4: SAML/DigiD Configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. SAML/DigiD Configuration Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SP_METADATA_URL="$KEYCLOAK_URL/realms/$REALM/broker/$DIGID_IDP_ALIAS/endpoint/descriptor"

run_test "SP metadata endpoint" \
    "curl -sf $SP_METADATA_URL" \
    "EntityDescriptor"

run_test "SP metadata contains signing certificate" \
    "curl -sf $SP_METADATA_URL" \
    "X509Certificate"

# Save SP metadata for review
if curl -sf "$SP_METADATA_URL" > /tmp/sp-metadata.xml 2>&1; then
    echo "  → SP metadata saved to: /tmp/sp-metadata.xml"
    
    # Extract entity ID
    ENTITY_ID=$(grep -o 'entityID="[^"]*"' /tmp/sp-metadata.xml | sed 's/entityID="\(.*\)"/\1/' || echo "")
    if [ -n "$ENTITY_ID" ]; then
        echo "  → Entity ID: $ENTITY_ID"
    fi
fi

# Test 5: Authentication Flow (manual check required)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Authentication Flow (Manual Verification Required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Manual steps required:"
echo ""
echo "1. Register SP metadata with DigiD:"
echo "   curl $SP_METADATA_URL > sp-metadata.xml"
echo "   → Submit to Logius DigiD portal"
echo ""
echo "2. Test authentication flow:"
echo "   a) Open: $KEYCLOAK_URL/realms/$REALM/account/"
echo "   b) Click on 'DigiD' login"
echo "   c) Complete DigiD authentication"
echo "   d) Verify you are redirected back to Keycloak"
echo ""
echo "3. Test OIDC flow with Clerk:"
echo "   → Configure Clerk Custom OIDC provider"
echo "   → Test sign-in through your application"
echo ""

# Test Summary
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                   Test Summary                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✅ All automated tests passed!"
    echo ""
    echo "Next steps:"
    echo "1. Download SP metadata: curl $SP_METADATA_URL > sp-metadata.xml"
    echo "2. Register with DigiD at: https://www.logius.nl"
    echo "3. Configure Clerk OIDC connection"
    echo "4. Test end-to-end authentication"
    exit 0
else
    echo "❌ Some tests failed. Please review the output above."
    echo ""
    echo "Common issues:"
    echo "  • Keycloak not running: docker-compose up -d"
    echo "  • Realm not configured: ./scripts/configure-realm.sh"
    echo "  • Network issues: Check firewall/proxy settings"
    exit 1
fi

# Cleanup
rm -f /tmp/discovery.json /tmp/sp-metadata.xml

