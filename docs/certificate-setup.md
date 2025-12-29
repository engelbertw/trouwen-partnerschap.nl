# Certificate Setup Guide for DigiD Integration

Complete guide for setting up certificates for production and development environments.

## Overview

Keycloak requires X.509 certificates to establish secure SAML communication with DigiD:

1. **Signing Certificate**: Signs SAML AuthnRequests (required)
2. **Encryption Certificate**: Encrypts SAML assertions (recommended)

## Development Environment

For local development and testing with DigiD Preprod (DV):

### Quick Setup

```bash
cd infrastructure/keycloak/certs

# Generate signing certificate (4096-bit RSA)
openssl genrsa -out sp-signing.key 4096

openssl req -new -x509 -key sp-signing.key -out sp-signing.crt -days 365 \
  -subj "/C=NL/ST=Noord-Holland/L=Amsterdam/O=Huwelijk Dev/CN=auth.huwelijk.local"

# Use same certificate for encryption (simplest)
cp sp-signing.crt sp-encryption.crt

# Set permissions
chmod 600 sp-signing.key
chmod 644 sp-signing.crt sp-encryption.crt

echo "✅ Development certificates created"
```

### Verification

```bash
# Check certificate details
openssl x509 -in sp-signing.crt -text -noout | grep -E '(Subject:|Issuer:|Not After)'

# Verify key matches certificate
diff <(openssl x509 -noout -modulus -in sp-signing.crt | openssl md5) \
     <(openssl rsa -noout -modulus -in sp-signing.key | openssl md5)

# Should output nothing if keys match
```

## Production Environment

For production DigiD, you **MUST** use PKIoverheid certificates.

### Step 1: Choose Certificate Authority

Select a PKIoverheid-approved CA:

| CA | Website | Contact |
|----|---------|---------|
| **KPN** | https://certificaat.kpn.com | PKI support |
| **QuoVadis** | https://www.quovadis.nl | Sales team |
| **Digidentity** | https://www.digidentity.eu | Support |

### Step 2: Generate Certificate Signing Request (CSR)

```bash
cd infrastructure/keycloak/certs

# Generate private key (KEEP THIS SECURE!)
openssl genrsa -out sp-signing-prod.key 4096

# Generate CSR
openssl req -new -key sp-signing-prod.key -out sp-signing-prod.csr \
  -subj "/C=NL/O=Your Legal Organization Name/CN=auth.huwelijk.nl"

# Verify CSR
openssl req -in sp-signing-prod.csr -text -noout
```

**Important CSR Fields**:
- **C** (Country): Must be `NL`
- **O** (Organization): Your legal organization name
- **CN** (Common Name): Your auth domain (e.g., `auth.huwelijk.nl`)

### Step 3: Order Certificate from CA

1. Visit your chosen CA's website
2. Select **PKIoverheid Services Certificate**
3. Submit the CSR file (`sp-signing-prod.csr`)
4. Provide organization verification documents:
   - KVK extract (Chamber of Commerce)
   - Organization statutes
   - Authorization letter
5. Complete payment
6. Wait for verification (typically 3-10 business days)

### Step 4: Install Certificate

After receiving the certificate from the CA:

```bash
# CA will provide:
# - sp-signing.crt (your certificate)
# - ca-intermediate.crt (intermediate CA)
# - ca-root.crt (PKIoverheid root)

cd infrastructure/keycloak/certs

# Create certificate bundle
cat sp-signing.crt ca-intermediate.crt ca-root.crt > sp-signing-chain.crt

# Verify chain
openssl verify -CAfile ca-root.crt -untrusted ca-intermediate.crt sp-signing.crt

# Should output: sp-signing.crt: OK
```

### Step 5: Secure Private Key

**CRITICAL**: The private key must be protected!

```bash
# Set restrictive permissions
chmod 600 sp-signing-prod.key

# For production, use a Key Management Service
# - Azure Key Vault
# - AWS Secrets Manager
# - HashiCorp Vault
# - Hardware Security Module (HSM)
```

### Step 6: Configure Keycloak

Update `.env` for production:

```bash
# Production certificates
SP_SIGNING_CERT_PATH=/opt/keycloak/certs/sp-signing-chain.crt
SP_SIGNING_KEY_PATH=/opt/keycloak/certs/sp-signing-prod.key
SP_ENCRYPTION_CERT_PATH=/opt/keycloak/certs/sp-signing-chain.crt

# Use separate encryption certificate (optional)
# SP_ENCRYPTION_CERT_PATH=/opt/keycloak/certs/sp-encryption-prod.crt
```

## Registering Certificates with DigiD

### Preprod (DV) Environment

1. **Export SP Metadata**:
   ```bash
   curl http://localhost:8080/realms/nl-huwelijk/broker/digid/endpoint/descriptor \
     > sp-metadata-preprod.xml
   ```

2. **Extract Certificate from Metadata**:
   ```bash
   # Your signing certificate will be embedded in the XML
   # Look for <ds:X509Certificate>...</ds:X509Certificate>
   ```

3. **Register with DigiD DV**:
   - Contact Logius support: digid@logius.nl
   - Request access to preprod environment
   - Provide SP metadata XML
   - Specify test scenarios

### Production Environment

1. **Complete DigiD Aansluitdocument**:
   - Download from: https://www.logius.nl/aanmelden-digid
   - Fill in all required fields
   - Include your organization details
   - Specify required LoA (midden/substantieel/hoog)
   - Describe your service

2. **Export Production SP Metadata**:
   ```bash
   curl https://auth.huwelijk.nl/realms/nl-huwelijk/broker/digid/endpoint/descriptor \
     > sp-metadata-production.xml
   ```

3. **Submit to Logius**:
   - Email: digid@logius.nl
   - Include: aansluitdocument + SP metadata + PKIoverheid certificate
   - Wait for security assessment
   - Schedule integration testing

4. **Security Assessment**:
   - Logius will review your implementation
   - May require penetration testing results
   - Verify AVG/GDPR compliance
   - Check security measures for BSN handling

5. **Integration Testing**:
   - Logius provides test accounts
   - Test all LoA levels
   - Verify error handling
   - Test logout flows

6. **Production Approval**:
   - After successful testing
   - Sign service agreement
   - Receive production credentials

## Certificate Rotation

### Monitoring Expiry

```bash
# Check certificate expiry
openssl x509 -in sp-signing.crt -noout -enddate

# Alert if expiring in 30 days
openssl x509 -in sp-signing.crt -noout -checkend $((30*24*60*60)) || \
  echo "⚠️  Certificate expires within 30 days!"
```

### Automated Monitoring

Add to your monitoring system (Prometheus, Grafana, etc.):

```yaml
# Example: cert-exporter for Kubernetes
apiVersion: v1
kind: ConfigMap
metadata:
  name: certificate-alerts
data:
  alert.rules: |
    - alert: CertificateExpiringSoon
      expr: (cert_exporter_not_after - time()) < (30 * 24 * 3600)
      annotations:
        summary: "Certificate {{ $labels.filename }} expires in 30 days"
```

### Renewal Process

**Timeline**: Start 60 days before expiry

1. **Generate new CSR** (Day 60):
   ```bash
   openssl genrsa -out sp-signing-new.key 4096
   openssl req -new -key sp-signing-new.key -out sp-signing-new.csr \
     -subj "/C=NL/O=Your Organization/CN=auth.huwelijk.nl"
   ```

2. **Order new certificate from CA** (Day 60)

3. **Receive new certificate** (Day 50-55)

4. **Test in preprod** (Day 50):
   ```bash
   # Update preprod with new certificate
   # Test authentication flow
   # Verify no issues
   ```

5. **Notify Logius** (Day 45):
   - Inform of upcoming certificate change
   - Provide new SP metadata
   - Schedule production update

6. **Update production** (Day 30):
   ```bash
   # Blue-green deployment recommended
   # Update certificate
   # Monitor for 24 hours
   ```

7. **Verify** (Day 29):
   ```bash
   # Test production authentication
   # Check logs for errors
   # Verify metrics
   ```

## Troubleshooting

### Certificate Verification Failed

**Error**: "unable to get local issuer certificate"

**Solution**:
```bash
# Ensure complete certificate chain
cat sp-signing.crt ca-intermediate.crt ca-root.crt > sp-signing-chain.crt

# Verify chain
openssl verify -CAfile ca-root.crt -untrusted ca-intermediate.crt sp-signing.crt
```

### Private Key Mismatch

**Error**: "key values mismatch"

**Solution**:
```bash
# Verify key matches certificate
openssl x509 -noout -modulus -in sp-signing.crt | openssl md5
openssl rsa -noout -modulus -in sp-signing.key | openssl md5
# These MD5 hashes should match
```

### Permission Denied

**Error**: "Permission denied reading key"

**Solution**:
```bash
# Fix permissions
chmod 600 sp-signing.key
chown keycloak:keycloak sp-signing.key  # or appropriate user

# For Docker
docker exec keycloak-digid ls -l /opt/keycloak/certs/
```

### Certificate Expired

**Error**: "certificate has expired"

**Solution**:
```bash
# Check expiry
openssl x509 -in sp-signing.crt -noout -dates

# Follow renewal process immediately
# Use backup certificate if available
```

## Security Checklist

- [ ] Private keys stored securely (600 permissions, encrypted at rest)
- [ ] Private keys never committed to version control
- [ ] Certificate expiry monitoring enabled
- [ ] Automated alerts set up (90, 60, 30 days before expiry)
- [ ] Backup certificates stored in secure location
- [ ] Certificate rotation procedure documented and tested
- [ ] Access to certificates limited to authorized personnel only
- [ ] Key management system (KMS/HSM) used in production
- [ ] Audit logging enabled for certificate access
- [ ] Disaster recovery plan includes certificate restoration

## Additional Resources

### PKIoverheid

- Website: https://www.logius.nl/diensten/pkioverheid
- Documentation: https://www.logius.nl/sites/default/files/public/bestanden/diensten/PKIoverheid/Programma-van-Eisen-deel-3g.pdf
- Support: pkioverheid@logius.nl

### DigiD

- Documentation: https://www.logius.nl/onze-dienstverlening/toegang/digid/documentatie
- Support: digid@logius.nl
- Forum: https://forum.logius.nl

### Certificate Authorities

- **KPN PKIoverheid**: https://certificaat.kpn.com/aanvragen/pkioverheid
- **QuoVadis**: https://www.quovadis.nl/producten/pkioverheid-certificaten
- **Digidentity**: https://www.digidentity.eu/nl/pkioverheid

### Tools

- **OpenSSL**: https://www.openssl.org
- **XCA** (GUI certificate management): https://hohnstaedt.de/xca/
- **cert-manager** (Kubernetes): https://cert-manager.io

---

**Last Updated**: December 26, 2025  
**Maintained By**: Huwelijk Development Team

