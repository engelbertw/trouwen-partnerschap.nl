FROM quay.io/keycloak/keycloak:26.0

# Metadata
LABEL maintainer="Huwelijk Development Team"
LABEL description="Keycloak with Extended SAML IDP plugin for DigiD integration"
LABEL version="1.0"

# Install Extended SAML IDP plugin
# Download from: https://github.com/First8/Extended-SAML-IDP/releases
# Place the JAR file in providers/ directory before building
COPY providers/keycloak-saml-extended-*.jar /opt/keycloak/providers/ 2>/dev/null || echo "No Extended SAML plugin found - add manually"

# Copy custom Huwelijk theme (optional)
COPY themes/huwelijk /opt/keycloak/themes/huwelijk 2>/dev/null || echo "No custom theme"

# Build Keycloak with providers and optimizations
RUN /opt/keycloak/bin/kc.sh build \
    --db=postgres \
    --features=preview \
    --health-enabled=true \
    --metrics-enabled=true \
    --http-relative-path=/auth

# Security: Run as non-root user
USER 1000

# Expose ports
EXPOSE 8080
EXPOSE 8443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/auth/health/ready || exit 1

# Start Keycloak
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]

