# Keycloak + DigiD + Clerk Integration for Huwelijk

Complete authentication architecture for the Huwelijk wedding application using Dutch government DigiD authentication.

## 🎯 Quick Start

### For Developers (Local Setup)

```bash
# 1. Set up Keycloak
cd infrastructure/keycloak
cp .env.template .env
# Edit .env with your settings

# 2. Download Extended SAML IDP plugin
# See: infrastructure/keycloak/providers/README.md

# 3. Generate development certificates
cd certs
openssl genrsa -out sp-signing.key 4096
openssl req -new -x509 -key sp-signing.key -out sp-signing.crt -days 365 \
  -subj "/C=NL/O=Huwelijk Dev/CN=localhost"
cp sp-signing.crt sp-encryption.crt
cd ..

# 4. Start services
./scripts/start-dev.sh

# 5. Configure Keycloak
./scripts/configure-realm.sh
./scripts/configure-protocol-mappers.sh

# 6. Test
./scripts/test-integration.sh
```

**Next**: Follow [Complete Setup Guide](docs/SETUP-GUIDE.md)

### For Production Deployment

See:
- [Production Checklist](docs/production-checklist.md)
- [Certificate Setup Guide](docs/certificate-setup.md)
- [Full Integration Rules](.cursor/rules/keycloak-digid-clerk-integration.mdc)

## 📁 Documentation Structure

```
.
├── .cursor/rules/
│   └── keycloak-digid-clerk-integration.mdc  # Complete reference guide
├── infrastructure/keycloak/
│   ├── Dockerfile                            # Keycloak with Extended SAML plugin
│   ├── docker-compose.yml                    # Development environment
│   ├── README.md                             # Infrastructure documentation
│   ├── scripts/
│   │   ├── start-dev.sh                      # Start development environment
│   │   ├── configure-realm.sh                # Configure Keycloak realm
│   │   ├── configure-protocol-mappers.sh     # Set up OIDC claims
│   │   └── test-integration.sh               # Test all endpoints
│   ├── providers/                            # Keycloak extensions
│   │   └── README.md                         # Plugin installation guide
│   ├── certs/                                # PKIoverheid certificates
│   │   └── README.md                         # Certificate setup guide
│   └── .env.template                         # Environment variables template
└── docs/
    ├── SETUP-GUIDE.md                        # Step-by-step setup guide
    ├── clerk-oidc-setup.md                   # Clerk configuration guide
    ├── certificate-setup.md                  # Certificate management guide
    └── production-checklist.md               # Production deployment checklist
```

## 🏗️ Architecture

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│   User   │─────▶│  Clerk   │─────▶│ Keycloak │─────▶│  DigiD   │
│          │      │  (OIDC)  │      │  (SAML)  │      │  (IdP)   │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
     ▲                                                        │
     │                                                        │
     └────────────────────────────────────────────────────────┘
                    Authentication Flow
```

### Components

1. **DigiD** (Dutch Government Identity Provider)
   - SAML 2.0 Identity Provider
   - Provides citizen authentication with various LoA levels
   - Requires PKIoverheid certificates for production

2. **Keycloak** (Identity Broker)
   - Acts as SAML Service Provider for DigiD
   - Acts as OIDC Provider for Clerk
   - Handles attribute mapping and token issuance
   - Uses Extended SAML IDP plugin for DigiD integration

3. **Clerk** (Session Management)
   - Consumes Keycloak as Custom OIDC provider
   - Manages user sessions in Next.js app
   - Provides React hooks and components
   - Requires Enterprise plan for Custom OIDC

## 📚 Key Documents

### Getting Started
- **[Complete Setup Guide](docs/SETUP-GUIDE.md)** ⭐ Start here
- [Infrastructure README](infrastructure/keycloak/README.md)

### Configuration
- [Clerk OIDC Setup](docs/clerk-oidc-setup.md)
- [Certificate Setup](docs/certificate-setup.md)
- [Environment Variables](infrastructure/keycloak/.env.template)

### Production
- [Production Checklist](docs/production-checklist.md)
- [Full Integration Reference](.cursor/rules/keycloak-digid-clerk-integration.mdc)

### Security & Compliance
- BSN handling guidelines (in all docs)
- AVG/GDPR compliance requirements
- Audit logging implementation
- Data retention policies

## 🔑 Key Features

### DigiD Integration
- ✅ SAML 2.0 authentication
- ✅ Multiple LoA levels (basis/midden/substantieel/hoog)
- ✅ Encrypted assertions
- ✅ Signed AuthnRequests
- ✅ PKIoverheid certificate support

### Keycloak Configuration
- ✅ Automated realm setup
- ✅ DigiD SAML Identity Provider
- ✅ OIDC client for Clerk
- ✅ Attribute mappers (BSN, name, date of birth, LoA)
- ✅ PostgreSQL database with audit logging
- ✅ Docker Compose for local development

### Clerk Integration
- ✅ Custom OIDC provider configuration
- ✅ Attribute mapping to user metadata
- ✅ Next.js components and middleware
- ✅ Session management
- ✅ BSN encryption and audit logging

### Security & Compliance
- ✅ AVG/GDPR compliance guidelines
- ✅ BSN encryption at rest
- ✅ Audit logging for sensitive data access
- ✅ Data retention policies
- ✅ Production security checklist

## 🚀 Quick Commands

### Development

```bash
# Start Keycloak
cd infrastructure/keycloak && ./scripts/start-dev.sh

# Configure realm
./scripts/configure-realm.sh

# Test integration
./scripts/test-integration.sh

# View logs
docker logs -f keycloak-digid

# Stop services
docker-compose down
```

### Testing

```bash
# Test OIDC discovery
curl http://localhost:8080/realms/nl-huwelijk/.well-known/openid-configuration | jq

# Download SP metadata
curl http://localhost:8080/realms/nl-huwelijk/broker/digid/endpoint/descriptor > sp-metadata.xml

# Check health
curl http://localhost:8080/health/ready
```

## 📋 Prerequisites

### Software
- Docker & Docker Compose
- Node.js 18+
- OpenSSL
- curl or Postman

### Accounts & Access
- Clerk Enterprise account
- DigiD preprod/production access (via Logius)
- PKIoverheid certificates (for production)

## 🔐 Security Considerations

### BSN (Burgerservicenummer)

**CRITICAL**: BSN is "bijzonder persoonsgegeven" under AVG/GDPR.

**Requirements**:
- ✅ Explicit legal justification for processing
- ✅ User consent where required
- ✅ Encryption at rest
- ✅ Access controls and audit logging
- ✅ Data retention policies
- ❌ Never log BSN in application logs
- ❌ Never display unnecessarily in UI

### Production Security

- Use PKIoverheid certificates
- Enable HTTPS with HSTS
- Implement rate limiting
- Set up WAF (Web Application Firewall)
- Configure monitoring and alerting
- Regular security audits
- Penetration testing

## 🧪 Testing

### Local Testing
1. Start Keycloak: `./scripts/start-dev.sh`
2. Configure realm: `./scripts/configure-realm.sh`
3. Run tests: `./scripts/test-integration.sh`
4. Test in browser: http://localhost:8080/realms/nl-huwelijk/account

### DigiD Preprod Testing
1. Apply for DigiD DV access at Logius
2. Register SP metadata
3. Use test accounts provided by Logius
4. Test authentication flow

### End-to-End Testing
1. Configure Clerk with Keycloak
2. Deploy Next.js app
3. Test complete authentication flow
4. Verify attribute mapping
5. Test logout flow

## 📞 Support

### Official Support
- **Keycloak**: https://keycloak.discourse.group
- **DigiD/Logius**: digid@logius.nl
- **Clerk**: https://clerk.com/support

### Project Documentation
- Full reference: `.cursor/rules/keycloak-digid-clerk-integration.mdc`
- Setup guide: `docs/SETUP-GUIDE.md`
- Troubleshooting: See individual documentation files

## 📝 License

This integration setup is part of the Huwelijk project and follows the project's license terms.

## 👥 Contributors

Huwelijk Development Team

---

**Version**: 1.0  
**Last Updated**: December 26, 2025  
**Status**: Ready for development and testing

## 🎯 Next Steps

1. **For Development**:
   - [ ] Follow [Complete Setup Guide](docs/SETUP-GUIDE.md)
   - [ ] Set up local Keycloak environment
   - [ ] Apply for DigiD preprod access
   - [ ] Configure Clerk Custom OIDC
   - [ ] Integrate with Next.js app

2. **For Production**:
   - [ ] Complete [Production Checklist](docs/production-checklist.md)
   - [ ] Obtain PKIoverheid certificates
   - [ ] Register with DigiD production
   - [ ] Complete DPIA for BSN processing
   - [ ] Deploy to production infrastructure
   - [ ] Set up monitoring and alerting

3. **For Security**:
   - [ ] Review security guidelines in all documentation
   - [ ] Implement BSN encryption and audit logging
   - [ ] Complete AVG/GDPR compliance assessment
   - [ ] Schedule penetration testing
   - [ ] Train staff on data protection procedures

---

**Need help?** See [Complete Setup Guide](docs/SETUP-GUIDE.md) or contact the development team.

