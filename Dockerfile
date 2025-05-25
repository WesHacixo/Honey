# Honey Benchmark Swarm Docker Image
FROM denoland/deno:1.40.5

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Cache dependencies
RUN deno cache bench/index.ts

# Create non-root user for security
RUN groupadd -r honey && useradd -r -g honey honey
RUN chown -R honey:honey /app
USER honey

# Set default command
CMD ["deno", "run", "--allow-all", "bench/index.ts", "--list"]

# Add labels for metadata
LABEL org.opencontainers.image.title="Honey Benchmark Swarm"
LABEL org.opencontainers.image.description="A benchmark system for evaluating different runtime environments"
LABEL org.opencontainers.image.source="https://github.com/WesHacixo/Honey"
LABEL org.opencontainers.image.licenses="MIT"

