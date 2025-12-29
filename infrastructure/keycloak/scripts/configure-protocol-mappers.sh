#!/bin/bash
#
# Configure Protocol Mappers for OIDC Client (Clerk)
# Maps user attributes to OIDC token claims
#
# Usage: ./configure-protocol-mappers.sh
#

set -euo pipefail

KEYCLOAK_URL="${KEYCLOAK_BASE_URL:-http://localhost:8080}"
REALM="${REALM:-nl-huwelijk}"
CLIENT_ID="clerk-huwelijk"
ADMIN_USER="${KC_ADMIN_USER:-admin}"
ADMIN_PASS="${KC_ADMIN_PASS:-admin}"

KCADM="/opt/keycloak/bin/kcadm.sh"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       Configure Protocol Mappers for Clerk OIDC         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if running inside Keycloak container
if [ ! -f "$KCADM" ]; then
    CONTAINER_NAME="keycloak-digid"
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        echo "❌ Keycloak container not running. Start with: docker-compose up -d"
        exit 1
    fi
    KCADM="docker exec -i $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh"
fi

# Login
echo "Logging in to Keycloak..."
$KCADM config credentials \
  --server "$KEYCLOAK_URL" \
  --realm master \
  --user "$ADMIN_USER" \
  --password "$ADMIN_PASS" 2>/dev/null

# Get client UUID
echo "Finding client: $CLIENT_ID..."
CLIENT_UUID=$($KCADM get clients -r "$REALM" --fields id,clientId 2>/dev/null | \
  grep -A1 "\"clientId\" : \"$CLIENT_ID\"" | \
  grep "\"id\"" | \
  sed 's/.*: "\(.*\)".*/\1/' || echo "")

if [ -z "$CLIENT_UUID" ]; then
    echo "❌ Client not found. Run configure-realm.sh first."
    exit 1
fi

echo "✅ Found client: $CLIENT_UUID"
echo ""

echo "Configuring protocol mappers..."

# BSN Claim (only if legally justified and necessary)
echo "  → BSN mapper"
$KCADM create clients/"$CLIENT_UUID"/protocol-mappers/models \
  -r "$REALM" \
  -s name="bsn" \
  -s protocol="openid-connect" \
  -s protocolMapper="oidc-usermodel-attribute-mapper" \
  -s 'config."user.attribute"="bsn"' \
  -s 'config."claim.name"="bsn"' \
  -s 'config."jsonType.label"="String"' \
  -s 'config."id.token.claim"="true"' \
  -s 'config."access.token.claim"="true"' \
  -s 'config."userinfo.token.claim"="true"' \
  --no-config 2>/dev/null || echo "     ℹ️  Already exists"

# Date of Birth
echo "  → Date of Birth mapper"
$KCADM create clients/"$CLIENT_UUID"/protocol-mappers/models \
  -r "$REALM" \
  -s name="date_of_birth" \
  -s protocol="openid-connect" \
  -s protocolMapper="oidc-usermodel-attribute-mapper" \
  -s 'config."user.attribute"="dateOfBirth"' \
  -s 'config."claim.name"="date_of_birth"' \
  -s 'config."jsonType.label"="String"' \
  -s 'config."id.token.claim"="true"' \
  -s 'config."access.token.claim"="true"' \
  -s 'config."userinfo.token.claim"="true"' \
  --no-config 2>/dev/null || echo "     ℹ️  Already exists"

# Level of Assurance (LoA)
echo "  → LoA (Level of Assurance) mapper"
$KCADM create clients/"$CLIENT_UUID"/protocol-mappers/models \
  -r "$REALM" \
  -s name="loa" \
  -s protocol="openid-connect" \
  -s protocolMapper="oidc-usermodel-attribute-mapper" \
  -s 'config."user.attribute"="loa"' \
  -s 'config."claim.name"="loa"' \
  -s 'config."jsonType.label"="String"' \
  -s 'config."id.token.claim"="true"' \
  -s 'config."access.token.claim"="true"' \
  -s 'config."userinfo.token.claim"="true"' \
  --no-config 2>/dev/null || echo "     ℹ️  Already exists"

# Email (DigiD doesn't provide email, so we'll use a placeholder or BSN-derived)
echo "  → Email mapper (placeholder)"
$KCADM create clients/"$CLIENT_UUID"/protocol-mappers/models \
  -r "$REALM" \
  -s name="email_digid" \
  -s protocol="openid-connect" \
  -s protocolMapper="oidc-usermodel-attribute-mapper" \
  -s 'config."user.attribute"="email"' \
  -s 'config."claim.name"="email"' \
  -s 'config."jsonType.label"="String"' \
  -s 'config."id.token.claim"="true"' \
  -s 'config."access.token.claim"="false"' \
  -s 'config."userinfo.token.claim"="true"' \
  --no-config 2>/dev/null || echo "     ℹ️  Already exists"

# Email Verified (set to true for DigiD users)
echo "  → Email Verified mapper"
$KCADM create clients/"$CLIENT_UUID"/protocol-mappers/models \
  -r "$REALM" \
  -s name="email_verified" \
  -s protocol="openid-connect" \
  -s protocolMapper="oidc-hardcoded-claim-mapper" \
  -s 'config."claim.name"="email_verified"' \
  -s 'config."claim.value"="false"' \
  -s 'config."jsonType.label"="boolean"' \
  -s 'config."id.token.claim"="true"' \
  -s 'config."access.token.claim"="false"' \
  --no-config 2>/dev/null || echo "     ℹ️  Already exists"

# Authentication Method Reference
echo "  → AMR (Authentication Method Reference) mapper"
$KCADM create clients/"$CLIENT_UUID"/protocol-mappers/models \
  -r "$REALM" \
  -s name="amr" \
  -s protocol="openid-connect" \
  -s protocolMapper="oidc-hardcoded-claim-mapper" \
  -s 'config."claim.name"="amr"' \
  -s 'config."claim.value"="digid"' \
  -s 'config."jsonType.label"="String"' \
  -s 'config."id.token.claim"="true"' \
  -s 'config."access.token.claim"="true"' \
  --no-config 2>/dev/null || echo "     ℹ️  Already exists"

# Identity Provider (for tracking)
echo "  → Identity Provider mapper"
$KCADM create clients/"$CLIENT_UUID"/protocol-mappers/models \
  -r "$REALM" \
  -s name="identity_provider" \
  -s protocol="openid-connect" \
  -s protocolMapper="oidc-usersessionmodel-note-mapper" \
  -s 'config."user.session.note"="identity_provider"' \
  -s 'config."claim.name"="idp"' \
  -s 'config."jsonType.label"="String"' \
  -s 'config."id.token.claim"="true"' \
  -s 'config."access.token.claim"="true"' \
  --no-config 2>/dev/null || echo "     ℹ️  Already exists"

echo ""
echo "✅ Protocol mappers configured successfully"
echo ""
echo "📋 Configured Claims:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  • bsn              - Burgerservicenummer (if legally justified)"
echo "  • date_of_birth    - Date of birth from DigiD"
echo "  • loa              - Level of Assurance (basis/midden/substantieel/hoog)"
echo "  • email            - Email address (placeholder or user-provided)"
echo "  • email_verified   - Email verification status"
echo "  • amr              - Authentication method (digid)"
echo "  • idp              - Identity provider used (digid)"
echo ""
echo "⚠️  BSN Handling:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BSN is 'bijzonder persoonsgegeven' under AVG/GDPR."
echo "Only include BSN in tokens if:"
echo "  1. You have explicit legal justification"
echo "  2. Users have consented"
echo "  3. You implement proper security measures"
echo "  4. You have audit logging in place"
echo ""
echo "Consider removing BSN mapper if not needed!"
echo ""

