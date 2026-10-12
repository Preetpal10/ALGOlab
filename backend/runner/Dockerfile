# =============================================================================
# ALGOLAB - Minimal Sandboxed Java JDI Runner
# Based on eclipse-temurin:25-jdk
# =============================================================================

FROM eclipse-temurin:25-jdk

# Create non-root execution user and group (UID/GID 1001)
RUN groupadd -g 1001 runner && \
    useradd -u 1001 -g runner -m -s /bin/bash runner

# Prepare tracer application directory and sandbox build workspace
RUN mkdir -p /app/tracer /sandbox/build && \
    chown -R runner:runner /app /sandbox && \
    chmod 755 /app /app/tracer && \
    chmod 777 /sandbox/build

# Copy the JDI Tracer source code (no frontend, tests, or student code)
COPY tracer/Tracer.java /app/tracer/Tracer.java

# Compile Tracer during image build into /app/tracer
# Uses standard JDK 25 compiler with required jdk.jdi and jdk.compiler modules
RUN javac -d /app/tracer /app/tracer/Tracer.java && \
    chmod -R 755 /app/tracer

# Create flexible entrypoint script
RUN echo '#!/bin/sh\nset -e\nif [ "$#" -eq 0 ] || [ "${1#-}" != "$1" ]; then\n  exec java -cp /app/tracer tracer.Tracer "$@"\nfi\nexec "$@"' > /entrypoint.sh && \
    chmod 755 /entrypoint.sh

# Switch to unprivileged runner user
USER 1001:1001

# Working directory for execution
WORKDIR /sandbox/build

ENTRYPOINT ["/entrypoint.sh"]
CMD ["--help"]
