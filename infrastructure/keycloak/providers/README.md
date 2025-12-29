# Keycloak Providers

Place Keycloak extension JAR files in this directory.

## Required: Extended SAML IDP Plugin

For DigiD integration, you need the Extended SAML IDP plugin:

### Download

1. Visit: https://github.com/First8/Extended-SAML-IDP/releases
2. Download the latest version compatible with Keycloak 21+
3. Place the JAR file here: `keycloak-saml-extended-{version}.jar`

### Example

```bash
cd providers/
wget https://github.com/First8/Extended-SAML-IDP/releases/download/v2.0.0/keycloak-saml-extended-2.0.0.jar
```

### Verification

After placing the JAR and building the Docker image:

```bash
docker build -t keycloak-digid ..
docker run --rm keycloak-digid ls -l /opt/keycloak/providers/
```

You should see the JAR file listed.

## Other Providers

You can add other Keycloak extensions here as needed:

- Custom authenticators
- Custom protocol mappers
- Theme resources
- Event listeners

## Building

The Dockerfile will automatically copy all `*.jar` files from this directory:

```dockerfile
COPY providers/keycloak-saml-extended-*.jar /opt/keycloak/providers/
```

After adding/updating providers, rebuild the image:

```bash
cd infrastructure/keycloak
docker-compose build --no-cache keycloak
docker-compose up -d
```

## More Information

- [Keycloak Extensions](https://www.keycloak.org/extensions)
- [Keycloak Service Provider Interfaces](https://www.keycloak.org/docs/latest/server_development/)
- [Extended SAML IDP Documentation](https://github.com/First8/Extended-SAML-IDP)

