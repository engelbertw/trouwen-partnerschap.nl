#!/bin/bash
#
# Configure Keycloak Realm with DigiD SAML Identity Provider and Clerk OIDC Client
# This script automates the setup of the nl-huwelijk realm
#
# Usage: ./configure-realm.sh
#

set -euo pipefail

# Configuration
KEYCLOAK_URL="${KEYCLOAK_BASE_URL:-http://localhost:8080}"
REALM="${REALM:-nl-huwelijk}"
ADMIN_USER="${KC_ADMIN_USER:-admin}"
ADMIN_PASS="${KC_ADMIN_PASS:-admin}"

KCADM="/opt/keycloak/bin/kcadm.sh"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║    Keycloak DigiD Configuration Script                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm: $REALM"
echo ""

# Check if running inside Keycloak container
if [ -f "$KCADM" ]; then
    echo "✅ Running inside Keycloak container"
else
    echo "⚠️  Running outside container, using docker exec..."
    CONTAINER_NAME="keycloak-digid"
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        echo "❌ Keycloak container not running. Start with: docker-compose up -d"
        exit 1
    fi
    # Wrap kcadm commands with docker exec
    KCADM="docker exec -i $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh"
fi

# Login to Keycloak admin
echo "Logging in to Keycloak..."
$KCADM config credentials \
  --server "$KEYCLOAK_URL" \
  --realm master \
  --user "$ADMIN_USER" \
  --password "$ADMIN_PASS" 2>/dev/null || {
    echo "❌ Failed to login. Check credentials and Keycloak availability."
    exit 1
  }

echo "✅ Logged in successfully"
echo ""

# Create realm if not exists
echo "Creating realm: $REALM"
$KCADM create realms \
  -s realm="$REALM" \
  -s enabled=true \
  -s displayName="Huwelijk NL" \
  -s displayNameHtml="<b>Huwelijk</b> NL - DigiD Authenticatie" \
  -s registrationAllowed=false \
  -s resetPasswordAllowed=false \
  -s rememberMe=true \
  -s loginWithEmailAllowed=false \
  -s duplicateEmailsAllowed=true \
  -s sslRequired=EXTERNAL \
  -s internationalizationEnabled=true \
  -s 'supportedLocales=["nl","en"]' \
  -s defaultLocale=nl \
  --no-config 2>/dev/null || echo "  ℹ️  Realm already exists"

# Configure realm settings
echo "Configuring realm settings..."
$KCADM update realms/"$REALM" \
  -s accessTokenLifespan=300 \
  -s accessCodeLifespan=60 \
  -s accessCodeLifespanLogin=1800 \
  -s ssoSessionIdleTimeout=1800 \
  -s ssoSessionMaxLifespan=36000 \
  -s offlineSessionIdleTimeout=2592000 \
  -s bruteForceProtected=true \
  -s failureFactor=5 \
  -s permanentLockout=false \
  --no-config

echo "✅ Realm configured"
echo ""

# Create DigiD Identity Provider (SAML)
echo "Creating DigiD SAML Identity Provider..."

DIGID_IDP_ALIAS="digid"
DIGID_METADATA_URL="${DIGID_IDP_METADATA_URL:-https://was-preprod1.digid.nl/saml/idp/metadata}"
DIGID_LOA="${DIGID_REQUIRED_LOA:-midden}"

# Map DigiD LoA to SAML AuthnContextClassRef
case $DIGID_LOA in
  basis)
    AUTHN_CONTEXT="urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport"
    ;;
  midden)
    AUTHN_CONTEXT="urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract"
    ;;
  substantieel)
    AUTHN_CONTEXT="urn:oasis:names:tc:SAML:2.0:ac:classes:Smartcard"
    ;;
  hoog)
    AUTHN_CONTEXT="urn:oasis:names:tc:SAML:2.0:ac:classes:SmartcardPKI"
    ;;
  *)
    AUTHN_CONTEXT="urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract"
    ;;
esac

echo "  Using LoA: $DIGID_LOA ($AUTHN_CONTEXT)"

# Create DigiD IdP configuration
cat > /tmp/digid-idp.json <<EOF
{
  "alias": "$DIGID_IDP_ALIAS",
  "displayName": "DigiD",
  "providerId": "saml",
  "enabled": true,
  "updateProfileFirstLoginMode": "on",
  "trustEmail": true,
  "storeToken": false,
  "addReadTokenRoleOnCreate": false,
  "authenticateByDefault": false,
  "linkOnly": false,
  "firstBrokerLoginFlowAlias": "first broker login",
  "config": {
    "nameIDPolicyFormat": "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
    "principalType": "SUBJECT",
    "signatureAlgorithm": "RSA_SHA256",
    "xmlSigKeyInfoKeyNameTransformer": "KEY_ID",
    "validateSignature": "true",
    "wantAuthnRequestsSigned": "true",
    "wantAssertionsSigned": "true",
    "wantAssertionsEncrypted": "true",
    "forceAuthn": "true",
    "postBindingResponse": "true",
    "postBindingAuthnRequest": "true",
    "postBindingLogout": "true",
    "singleSignOnServiceUrl": "$DIGID_METADATA_URL",
    "authnContextClassRefs": "$AUTHN_CONTEXT",
    "authnContextComparisonType": "minimum",
    "backchannelSupported": "false",
    "guiOrder": "1"
  }
}
EOF

$KCADM create identity-provider/instances \
  -r "$REALM" \
  -f /tmp/digid-idp.json \
  --no-config 2>/dev/null || echo "  ℹ️  DigiD IdP already exists"

echo "✅ DigiD Identity Provider configured"
echo ""

# Create attribute mappers for DigiD
echo "Creating DigiD attribute mappers..."

# BSN (Burgerservicenummer) - Sensitive!
$KCADM create identity-provider/instances/"$DIGID_IDP_ALIAS"/mappers \
  -r "$REALM" \
  -s name="bsn-mapper" \
  -s identityProviderAlias="$DIGID_IDP_ALIAS" \
  -s identityProviderMapper="saml-user-attribute-idp-mapper" \
  -s 'config."attribute.name"="urn:nl:bvn:bsn"' \
  -s 'config."user.attribute"="bsn"' \
  -s 'config."attribute.friendly.name"="bsn"' \
  --no-config 2>/dev/null || echo "  ℹ️  BSN mapper exists"

# Given Name
$KCADM create identity-provider/instances/"$DIGID_IDP_ALIAS"/mappers \
  -r "$REALM" \
  -s name="firstName-mapper" \
  -s identityProviderAlias="$DIGID_IDP_ALIAS" \
  -s identityProviderMapper="saml-user-attribute-idp-mapper" \
  -s 'config."attribute.name"="urn:nl:bvn:givenName"' \
  -s 'config."user.attribute"="firstName"' \
  --no-config 2>/dev/null || echo "  ℹ️  First name mapper exists"

# Family Name
$KCADM create identity-provider/instances/"$DIGID_IDP_ALIAS"/mappers \
  -r "$REALM" \
  -s name="lastName-mapper" \
  -s identityProviderAlias="$DIGID_IDP_ALIAS" \
  -s identityProviderMapper="saml-user-attribute-idp-mapper" \
  -s 'config."attribute.name"="urn:nl:bvn:familyName"' \
  -s 'config."user.attribute"="lastName"' \
  --no-config 2>/dev/null || echo "  ℹ️  Last name mapper exists"

# Date of Birth
$KCADM create identity-provider/instances/"$DIGID_IDP_ALIAS"/mappers \
  -r "$REALM" \
  -s name="dateOfBirth-mapper" \
  -s identityProviderAlias="$DIGID_IDP_ALIAS" \
  -s identityProviderMapper="saml-user-attribute-idp-mapper" \
  -s 'config."attribute.name"="urn:nl:bvn:dateOfBirth"' \
  -s 'config."user.attribute"="dateOfBirth"' \
  --no-config 2>/dev/null || echo "  ℹ️  Date of birth mapper exists"

# Authentication Level (LoA)
$KCADM create identity-provider/instances/"$DIGID_IDP_ALIAS"/mappers \
  -r "$REALM" \
  -s name="loa-mapper" \
  -s identityProviderAlias="$DIGID_IDP_ALIAS" \
  -s identityProviderMapper="saml-user-attribute-idp-mapper" \
  -s 'config."attribute.name"="urn:nl:bvn:assuranceLevel"' \
  -s 'config."user.attribute"="loa"' \
  --no-config 2>/dev/null || echo "  ℹ️  LoA mapper exists"

echo "✅ Attribute mappers configured"
echo ""

# Create OIDC Client for Clerk
echo "Creating OIDC client for Clerk..."

CLIENT_ID="clerk-huwelijk"
CLERK_REDIRECT_URI="${CLERK_REDIRECT_URIS:-http://localhost:3000/sso-callback}"

cat > /tmp/clerk-client.json <<EOF
{
  "clientId": "$CLIENT_ID",
  "name": "Clerk Huwelijk App",
  "description": "OIDC client for Clerk authentication",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "redirectUris": ["$CLERK_REDIRECT_URI", "https://*.clerk.accounts.dev/*"],
  "webOrigins": ["+"],
  "protocol": "openid-connect",
  "publicClient": false,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "serviceAccountsEnabled": false,
  "attributes": {
    "pkce.code.challenge.method": "S256"
  },
  "defaultClientScopes": ["profile", "email", "roles"],
  "optionalClientScopes": ["address", "phone"]
}
EOF

$KCADM create clients \
  -r "$REALM" \
  -f /tmp/clerk-client.json \
  --no-config 2>/dev/null || echo "  ℹ️  Clerk client already exists"

# Get client secret
echo "Retrieving client credentials..."
CLIENT_UUID=$($KCADM get clients -r "$REALM" --fields id,clientId 2>/dev/null | grep -A1 "\"clientId\" : \"$CLIENT_ID\"" | grep "\"id\"" | sed 's/.*: "\(.*\)".*/\1/' || echo "")

if [ -n "$CLIENT_UUID" ]; then
    CLIENT_SECRET=$($KCADM get clients/"$CLIENT_UUID"/client-secret -r "$REALM" 2>/dev/null | grep '"value"' | sed 's/.*: "\(.*\)".*/\1/' || echo "")
    echo "✅ OIDC client configured"
else
    echo "⚠️  Could not retrieve client UUID (client may already exist)"
    CLIENT_SECRET="<retrieve from Keycloak admin console>"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Configuration Complete!                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Keycloak OIDC Endpoints:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Discovery:     $KEYCLOAK_URL/realms/$REALM/.well-known/openid-configuration"
echo "Authorization: $KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/auth"
echo "Token:         $KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token"
echo "UserInfo:      $KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/userinfo"
echo "JWKS:          $KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/certs"
echo ""
echo "🔑 Clerk OIDC Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Client ID:     $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"
echo "Discovery URL: $KEYCLOAK_URL/realms/$REALM/.well-known/openid-configuration"
echo "Scopes:        openid profile email"
echo ""
echo "🔗 DigiD Service Provider Metadata:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SP Metadata:   $KEYCLOAK_URL/realms/$REALM/broker/$DIGID_IDP_ALIAS/endpoint/descriptor"
echo ""
echo "⚠️  NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Download SP metadata and register with DigiD (Logius):"
echo "   curl $KEYCLOAK_URL/realms/$REALM/broker/$DIGID_IDP_ALIAS/endpoint/descriptor > sp-metadata.xml"
echo ""
echo "2. Configure protocol mappers for additional claims:"
echo "   ./scripts/configure-protocol-mappers.sh"
echo ""
echo "3. Configure Clerk Custom OIDC connection:"
echo "   - Discovery URL: $KEYCLOAK_URL/realms/$REALM/.well-known/openid-configuration"
echo "   - Client ID: $CLIENT_ID"
echo "   - Client Secret: $CLIENT_SECRET"
echo ""
echo "4. Test the integration:"
echo "   ./scripts/test-integration.sh"
echo ""

# Cleanup
rm -f /tmp/digid-idp.json /tmp/clerk-client.json

