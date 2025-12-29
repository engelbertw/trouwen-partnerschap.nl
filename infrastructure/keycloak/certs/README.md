# Certificates for DigiD SAML Integration

This directory contains certificates for SAML communication between Keycloak (Service Provider) and DigiD (Identity Provider).

## Required Certificates

### 1. Signing Certificate (sp-signing.crt + sp-signing.key)

Used to sign SAML AuthnRequests sent to DigiD.

**Requirements:**
- RSA 2048-bit or 4096-bit key
- SHA-256 signature algorithm
- For production: PKIoverheid certificate required
- For development: self-signed acceptable

### 2. Encryption Certificate (sp-encryption.crt)

Used to encrypt SAML assertions received from DigiD (optional but recommended).

**Requirements:**
- RSA 2048-bit or 4096-bit key
- For production: PKIoverheid certificate recommended
- Can be the same as signing certificate

## Development: Generate Self-Signed Certificates

For local development and testing **only** (will NOT work with production DigiD):

### Signing Certificate

```bash
# Generate private key
openssl genrsa -out sp-signing.key 4096

# Generate certificate (valid for 1 year)
openssl req -new -x509 -key sp-signing.key -out sp-signing.crt -days 365 \
  -subj "/C=NL/O=Huwelijk Development/CN=auth.huwelijk.local"

# Verify
openssl x509 -in sp-signing.crt -text -noout
```

### Encryption Certificate

```bash
# Option 1: Use same as signing (simplest)
cp sp-signing.crt sp-encryption.crt
cp sp-signing.key sp-encryption.key

# Option 2: Generate separate certificate
openssl genrsa -out sp-encryption.key 4096
openssl req -new -x509 -key sp-encryption.key -out sp-encryption.crt -days 365 \
  -subj "/C=NL/O=Huwelijk Development/CN=auth.huwelijk.local"
```

## Production: PKIoverheid Certificates

For production DigiD integration, you **MUST** use PKIoverheid certificates.

### Obtaining PKIoverheid Certificates

1. **Choose a Certificate Authority (CA)**:
   - KPN
   - QuoVadis
   - Digidentity
   
2. **Request PKIoverheid Services Certificate**:
   - Type: Server certificate
   - Purpose: SAML authentication
   - Key length: 2048-bit RSA (minimum) or 4096-bit (recommended)

3. **Provide Certificate Signing Request (CSR)**:
   ```bash
   # Generate private key (keep secure!)
   openssl genrsa -out sp-signing.key 4096
   
   # Generate CSR
   openssl req -new -key sp-signing.key -out sp-signing.csr \
     -subj "/C=NL/O=Your Organization/CN=auth.huwelijk.nl"
   ```

4. **Receive signed certificate** from CA

5. **Install certificate**:
   ```bash
   # Place certificate and key in this directory
   chmod 600 sp-signing.key  # Secure private key
   chmod 644 sp-signing.crt
   ```

### Certificate Chain

Ensure you have the complete certificate chain:

```bash
# Certificate chain structure
sp-signing.crt          # Your certificate
ca-intermediate.crt     # Intermediate CA
ca-root.crt            # Root CA (PKIoverheid)
```

Some CAs provide a bundled chain file. If separate:

```bash
# Create bundle
cat sp-signing.crt ca-intermediate.crt ca-root.crt > sp-signing-chain.crt
```

## Certificate Formats

### PEM Format (Required for Keycloak)

Most common format, base64-encoded:

```
-----BEGIN CERTIFICATE-----
MIIFXTCCBEWgAwIBAgISA...
-----END CERTIFICATE-----
```

### Convert from Other Formats

**PKCS#12 (.p12, .pfx) to PEM**:
```bash
# Extract certificate
openssl pkcs12 -in certificate.p12 -out sp-signing.crt -clcerts -nokeys

# Extract private key
openssl pkcs12 -in certificate.p12 -out sp-signing.key -nocerts -nodes
```

**DER to PEM**:
```bash
openssl x509 -inform DER -in certificate.der -out sp-signing.crt
```

## Security Best Practices

### 🔒 Private Key Protection

**CRITICAL**: The private key (`sp-signing.key`) must be kept secure!

```bash
# Set restrictive permissions
chmod 600 sp-signing.key
chown root:root sp-signing.key

# For Docker, the file will be mounted read-only
# See docker-compose.yml: ./certs:/opt/keycloak/certs:ro
```

### Production Key Management

For production, use a Hardware Security Module (HSM) or Key Management Service:

- **Azure Key Vault**: Store certificates and keys
- **AWS Certificate Manager**: Managed certificates
- **HashiCorp Vault**: Secret management
- **Hardware HSM**: Physical security module

### Certificate Rotation

- **Monitor expiry dates**: Set alerts for 90, 60, 30 days before expiry
- **Test renewals**: Practice certificate rotation in preprod
- **Automate where possible**: Use ACME or CA APIs
- **Keep backups**: Store old certificates securely

## Verification

### Check Certificate Details

```bash
# View certificate
openssl x509 -in sp-signing.crt -text -noout

# Check key matches certificate
openssl x509 -noout -modulus -in sp-signing.crt | openssl md5
openssl rsa -noout -modulus -in sp-signing.key | openssl md5
# ^ These should match
```

### Check Certificate Chain

```bash
# Verify certificate chain
openssl verify -CAfile ca-root.crt -untrusted ca-intermediate.crt sp-signing.crt
```

### Check Expiry

```bash
# Show expiry date
openssl x509 -in sp-signing.crt -noout -enddate

# Check if expired
openssl x509 -in sp-signing.crt -noout -checkend 0
```

## Registering with DigiD

After generating/obtaining certificates:

1. **Export SP metadata from Keycloak**:
   ```
   https://auth.huwelijk.nl/realms/nl-huwelijk/broker/digid/endpoint/descriptor
   ```

2. **Register with Logius**:
   - Login to Logius portal: https://www.logius.nl
   - Submit SP metadata XML
   - Include your signing certificate
   - Specify requested LoA (midden/substantieel/hoog)
   - Complete aansluitdocument

3. **Test in Preprod**:
   - Use DigiD DV (development) environment
   - Verify SAML handshake
   - Test authentication flow

4. **Request Production Access**:
   - After successful preprod testing
   - Security assessment by Logius
   - Production approval

## File Checklist

Place these files in this directory:

- [ ] `sp-signing.crt` - Public signing certificate
- [ ] `sp-signing.key` - Private signing key (KEEP SECURE!)
- [ ] `sp-encryption.crt` - Encryption certificate
- [ ] `ca-intermediate.crt` - Intermediate CA certificate (production)
- [ ] `ca-root.crt` - Root CA certificate (production)

## Troubleshooting

### "Certificate not trusted" Error

- Ensure complete certificate chain is provided
- Verify root CA is in trust store
- Check certificate is not expired
- Verify certificate signature algorithm (SHA-256)

### "Signature validation failed" Error

- Verify private key matches certificate
- Check key permissions (should be readable by Keycloak)
- Ensure key is not encrypted (or provide password)
- Verify signature algorithm is supported

### DigiD Registration Rejected

- Ensure certificate is PKIoverheid (for production)
- Check certificate is not expired
- Verify organization details match aansluitdocument
- Ensure key length meets requirements (min 2048-bit)

## Resources

- [PKIoverheid](https://www.logius.nl/diensten/pkioverheid)
- [DigiD Koppelvlakspecificatie](https://www.logius.nl/onze-dienstverlening/toegang/digid/documentatie)
- [OpenSSL Documentation](https://www.openssl.org/docs/)

---

**⚠️ IMPORTANT**: Never commit private keys (`.key` files) to version control!

Add to `.gitignore`:
```
*.key
*.p12
*.pfx
```

