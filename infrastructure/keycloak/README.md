# Keycloak DigiD Integration Infrastructure

This directory contains the infrastructure setup for Keycloak with DigiD SAML authentication and Clerk OIDC integration for the Huwelijk application.

## Architecture

```
User → Clerk (OIDC) → Keycloak (Identity Broker) → DigiD (SAML IdP) → Dutch Government
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Extended SAML IDP plugin for Keycloak
- DigiD preprod access (for testing)
- Clerk Enterprise account

### 1. Initial Setup

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Download Extended SAML IDP plugin
# Place JAR file in providers/ directory
wget https://github.com/First8/Extended-SAML-IDP/releases/download/vX.X.X/keycloak-saml-extended-X.X.X.jar \
  -O providers/keycloak-saml-extended.jar
```

### 2. Start Services

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start Keycloak and PostgreSQL
./scripts/start-dev.sh
```

### 3. Configure Realm and DigiD

```bash
# Run configuration script
./scripts/configure-realm.sh

# Configure protocol mappers
./scripts/configure-protocol-mappers.sh
```

### 4. Test Integration

```bash
# Run integration tests
./scripts/test-integration.sh
```

## Directory Structure

```
infrastructure/keycloak/
├── Dockerfile                 # Keycloak with Extended SAML plugin
├── docker-compose.yml         # Development environment
├── .env.example              # Environment variables template
├── init-db.sql               # PostgreSQL initialization
├── README.md                 # This file
├── providers/                # Keycloak extensions
│   └── keycloak-saml-extended-*.jar
├── certs/                    # PKIoverheid certificates
│   ├── sp-signing.crt
│   ├── sp-signing.key
│   └── sp-encryption.crt
├── themes/                   # Custom Keycloak themes
│   └── huwelijk/
├── realm-export/             # Realm configuration exports
│   └── nl-huwelijk-realm.json
└── scripts/                  # Automation scripts
    ├── start-dev.sh
    ├── configure-realm.sh
    ├── configure-protocol-mappers.sh
    └── test-integration.sh
```

## Configuration

### Environment Variables

Key environment variables (see `.env.example` for full list):

- `KEYCLOAK_BASE_URL`: Base URL for Keycloak (e.g., https://auth.huwelijk.nl)
- `REALM`: Realm name (default: nl-huwelijk)
- `DIGID_IDP_METADATA_URL`: DigiD metadata endpoint
- `DIGID_REQUIRED_LOA`: Required Level of Assurance (basis/midden/substantieel/hoog)
- `CLERK_REDIRECT_URIS`: Clerk callback URLs

### DigiD Levels of Assurance (LoA)

| Level | Description | Use Case |
|-------|-------------|----------|
| **Basis** | Basic authentication | Low-risk services |
| **Midden** | Two-factor authentication | Most government services |
| **Substantieel** | Substantial assurance | Financial services |
| **Hoog** | High assurance | Sensitive transactions |

For wedding RSVPs, **Midden** is typically sufficient.

### Certificates

For production DigiD integration, you need PKIoverheid certificates:

1. **Signing Certificate**: For signing SAML requests
2. **Encryption Certificate**: For encrypting assertions (optional but recommended)

Place certificates in the `certs/` directory:

```bash
certs/
├── sp-signing.crt      # Public certificate
├── sp-signing.key      # Private key (keep secure!)
└── sp-encryption.crt   # Encryption certificate
```

**For development/testing**, you can generate self-signed certificates:

```bash
# Generate signing key and certificate
openssl req -x509 -newkey rsa:4096 -keyout certs/sp-signing.key -out certs/sp-signing.crt \
  -days 365 -nodes -subj "/CN=auth.huwelijk.local/O=Huwelijk Dev/C=NL"

# Generate encryption certificate
openssl req -x509 -newkey rsa:4096 -keyout certs/sp-encryption.key -out certs/sp-encryption.crt \
  -days 365 -nodes -subj "/CN=auth.huwelijk.local/O=Huwelijk Dev/C=NL"
```

⚠️ **Note**: Self-signed certificates will NOT work with production DigiD.

## Endpoints

### Keycloak Admin

- Console: http://localhost:8080/admin
- Realm: http://localhost:8080/realms/nl-huwelijk

### OIDC Discovery (for Clerk)

```
http://localhost:8080/realms/nl-huwelijk/.well-known/openid-configuration
```

### SAML SP Metadata (for DigiD registration)

```
http://localhost:8080/realms/nl-huwelijk/broker/digid/endpoint/descriptor
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker logs
docker logs keycloak-digid
docker logs keycloak-postgres

# Restart services
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker exec keycloak-postgres pg_isready -U keycloak

# Reset database
docker-compose down -v
docker-compose up -d
```

### Plugin Not Loading

```bash
# Verify plugin is in container
docker exec keycloak-digid ls -l /opt/keycloak/providers/

# Rebuild Keycloak
docker-compose build --no-cache keycloak
docker-compose up -d
```

### DigiD SAML Errors

1. Verify metadata URL is accessible
2. Check certificate validity
3. Ensure clock synchronization (NTP)
4. Review Keycloak logs for SAML-specific errors

## Security Notes

### Development vs Production

This setup is configured for **development**. For production:

1. **Change all default passwords**
2. **Use proper SSL/TLS certificates**
3. **Enable HTTPS only** (`KC_HOSTNAME_STRICT_HTTPS=true`)
4. **Use production DigiD endpoints**
5. **Implement database backups**
6. **Enable audit logging**
7. **Use secrets manager** (Azure Key Vault, HashiCorp Vault)
8. **Review security checklist** in `docs/production-checklist.md`

### BSN (Burgerservicenummer) Handling

BSN is "bijzonder persoonsgegeven" (special category personal data) under AVG/GDPR:

- ✅ Only request if legally justified
- ✅ Encrypt at rest
- ✅ Implement access controls and audit logging
- ✅ Define retention policies
- ❌ Never log BSN in application logs
- ❌ Never display BSN unnecessarily in UI

See `init-db.sql` for BSN audit table setup.

## Testing

### Manual Testing Flow

1. **Start services**: `./scripts/start-dev.sh`
2. **Configure realm**: `./scripts/configure-realm.sh`
3. **Open Keycloak Admin**: http://localhost:8080/admin
4. **Test OIDC discovery**: 
   ```bash
   curl http://localhost:8080/realms/nl-huwelijk/.well-known/openid-configuration | jq
   ```
5. **Download SP metadata**: 
   ```bash
   curl http://localhost:8080/realms/nl-huwelijk/broker/digid/endpoint/descriptor
   ```
6. **Register with DigiD preprod** (manual process via Logius)
7. **Test authentication flow** through your app

### Automated Tests

```bash
./scripts/test-integration.sh
```

## Production Deployment

See comprehensive production checklist: `docs/production-checklist.md`

Key steps:

1. Apply for DigiD connection at Logius
2. Obtain PKIoverheid certificates
3. Test in DigiD Preprod (DV)
4. Complete security assessment
5. Deploy to production infrastructure
6. Register SP metadata with DigiD production
7. Configure Clerk with production Keycloak
8. Monitor and maintain

## Resources

### Official Documentation

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [DigiD Koppelvlakspecificatie](https://www.logius.nl/onze-dienstverlening/toegang/digid/documentatie)
- [Extended SAML IDP Plugin](https://github.com/First8/Extended-SAML-IDP)
- [Clerk Custom OIDC](https://clerk.com/docs/guides/configure/auth-strategies/enterprise-connections/oidc/custom-provider)

### Support

- Keycloak: https://keycloak.discourse.group
- DigiD: https://www.logius.nl/contact
- Clerk: https://clerk.com/support

## License

This infrastructure setup is part of the Huwelijk project and follows the project's license terms.

## Maintainers

Huwelijk Development Team

---

**Last Updated**: December 26, 2025

