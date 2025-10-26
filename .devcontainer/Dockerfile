# Memory Graph Explorer Development Container
FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu-22.04

ARG CONTAINER_USER=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID
ARG NODE_VERSION=20

ENV DEBIAN_FRONTEND=noninteractive
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Core build tools
    build-essential \
    curl \
    wget \
    git \
    # Python development
    python3 \
    python3-pip \
    python3-venv \
    # Node.js and npm (will be updated below)
    # Network tools for debugging
    net-tools \
    iputils-ping \
    netcat \
    # Documentation tools
    graphviz \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js using NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create venv for Python tools to avoid PEP 668 issues
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/python -m pip install --upgrade pip setuptools wheel \
    && /opt/venv/bin/pip install --no-cache-dir \
    pytest \
    black \
    pylint \
    flake8 \
    # Make venv binaries available system-wide
    && echo 'export PATH="/opt/venv/bin:$PATH"' > /etc/profile.d/venv-python.sh \
    && chmod +x /etc/profile.d/venv-python.sh

# Install global npm packages
RUN npm install -g \
    typescript \
    ts-node \
    prettier \
    eslint \
    markdownlint-cli

# Set up user permissions
RUN if [ "$USER_GID" != "1000" ] || [ "$USER_UID" != "1000" ]; then \
    groupmod --gid $USER_GID $CONTAINER_USER \
    && usermod --uid $USER_UID --gid $USER_GID $CONTAINER_USER \
    && chown -R $USER_UID:$USER_GID /home/$CONTAINER_USER; \
    fi \
    && echo "${CONTAINER_USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    # Give vscode user ownership of the venv
    && chown -R $CONTAINER_USER:$CONTAINER_USER /opt/venv

# Configure Docker in Docker (for docker-compose support)
RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    && curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin \
    && usermod -aG docker $CONTAINER_USER \
    && rm -rf /var/lib/apt/lists/*

USER ${CONTAINER_USER}
ENV USER=${CONTAINER_USER}
WORKDIR /workspace

# Add venv to PATH in user's bashrc
RUN echo 'export PATH="/opt/venv/bin:$PATH"' >> ~/.bashrc

CMD ["/bin/bash"]
