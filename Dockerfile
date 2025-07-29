FROM node:22-bookworm

# Install Python 3.11 and minimal system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    build-essential \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create symlinks for python3 to point to python3.11
RUN ln -sf /usr/bin/python3.11 /usr/bin/python3

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY python_backend/requirements.txt ./python_backend/

# Set environment variables
ENV NODE_ENV=development
ENV PYTHON_VERSION=3.11

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app

USER appuser

# Expose ports
EXPOSE 5000 8000

# Default command (overridden by docker-compose)
CMD ["npm", "run", "dev"]
