# OpenCode Desktop (Web-Accessible GUI)
FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Set locale
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Install base dependencies + desktop environment + VNC
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release \
    sudo \
    locales \
    vim \
    nano \
    jq \
    ripgrep \
    fd-find \
    bat \
    xfce4 \
    xfce4-goodies \
    tigervnc-standalone-server \
    tigervnc-common \
    novnc \
    websockify \
    dbus-x11 \
    x11-utils \
    && locale-gen en_US.UTF-8 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Fix npm if needed and upgrade
RUN npm cache clean --force || true \
    && npm install -g npm@latest || (npm install -g npm@10 && npm install -g npm@latest)

# Install Python 3.12
RUN apt-get update && apt-get install -y \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y \
    python3.12 \
    python3.12-venv \
    python3.12-dev \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1 \
    && python3.12 -m ensurepip --upgrade \
    && python3 -m pip install --upgrade pip setuptools wheel \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install security tools
RUN ARCH=$(dpkg --print-architecture) && \
    echo "Detected architecture: $ARCH" && \
    if [ "$ARCH" = "arm64" ]; then \
        GITLEAKS_ARCH="arm64"; \
    elif [ "$ARCH" = "amd64" ]; then \
        GITLEAKS_ARCH="x64"; \
    else \
        echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    echo "Downloading gitleaks for: linux_${GITLEAKS_ARCH}" && \
    wget -O /tmp/gitleaks.tar.gz "https://github.com/gitleaks/gitleaks/releases/download/v8.18.1/gitleaks_8.18.1_linux_${GITLEAKS_ARCH}.tar.gz" && \
    tar xzf /tmp/gitleaks.tar.gz -C /usr/local/bin && \
    rm /tmp/gitleaks.tar.gz && \
    chmod +x /usr/local/bin/gitleaks && \
    echo "Installing semgrep via pip" && \
    pip3 install --no-cache-dir semgrep

# Install OpenCode CLI tools
RUN npm install -g \
    ecc-universal \
    @claude-flow/cli \
    snyk \
    eslint \
    typescript \
    && npm cache clean --force

# Download and install OpenCode Desktop (.deb) from GitHub releases
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "arm64" ]; then \
        DEB_URL="https://github.com/anomalyco/opencode/releases/download/v1.14.19/opencode-desktop-linux-arm64.deb"; \
    else \
        DEB_URL="https://github.com/anomalyco/opencode/releases/download/v1.14.19/opencode-desktop-linux-amd64.deb"; \
    fi && \
    echo "Downloading OpenCode Desktop from GitHub (${ARCH})" && \
    wget -O /tmp/opencode-desktop.deb "${DEB_URL}" && \
    apt-get update && \
    apt-get install -y /tmp/opencode-desktop.deb && \
    rm /tmp/opencode-desktop.deb && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
ARG USERNAME=developer
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME -s /bin/bash \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Set up workspace
WORKDIR /workspace
RUN chown -R $USERNAME:$USERNAME /workspace

# Copy workspace configuration
COPY --chown=$USERNAME:$USERNAME . /workspace/

# Install Python dependencies if requirements.txt exists
RUN if [ -f requirements.txt ]; then \
    pip3 install --no-cache-dir -r requirements.txt; \
    fi

# Switch to non-root user
USER $USERNAME

# Configure Git
RUN git config --global init.defaultBranch main \
    && git config --global pull.rebase false \
    && git config --global core.editor "vim"

# Set up OpenCode plugins and skills
RUN mkdir -p ~/.claude/skills ~/.opencode ~/.cache/opencode ~/.vnc

# Set VNC password (change 'opencode' to your preferred password)
RUN mkdir -p ~/.vnc && \
    echo "opencode" | vncpasswd -f > ~/.vnc/passwd && \
    chmod 600 ~/.vnc/passwd

# Create VNC startup script
RUN echo '#!/bin/bash\n\
xrdb $HOME/.Xresources\n\
startxfce4 &' > ~/.vnc/xstartup && \
    chmod +x ~/.vnc/xstartup

# Install pre-commit hooks
RUN if [ -f scripts/security/setup.sh ]; then \
    bash scripts/security/setup.sh || true; \
    fi

# Set up environment
ENV OPENCODE_WORKSPACE=/workspace
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV DISPLAY=:1

# Expose VNC (5901) and noVNC (6080) ports
EXPOSE 5901 6080

# Create startup script
USER root
RUN echo '#!/bin/bash\n\
su - developer -c "vncserver :1 -geometry 1920x1080 -depth 24"\n\
websockify -D --web=/usr/share/novnc/ 6080 localhost:5901\n\
tail -f /dev/null' > /usr/local/bin/start-desktop.sh && \
    chmod +x /usr/local/bin/start-desktop.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:6080/ || exit 1

# Switch back to user
USER $USERNAME

# Default command
CMD ["/bin/bash", "-c", "sudo /usr/local/bin/start-desktop.sh"]
