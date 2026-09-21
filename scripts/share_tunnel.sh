#!/usr/bin/env bash

# ============================================================
# Student Brain — Public Internet Access Tunnel
# Uses Cloudflare quick tunnel (free, instant HTTPS, no signup required)
# ============================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  🌍 Student Brain — Public Cloudflare Tunnel        ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check or download cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}cloudflared not found. Downloading standalone binary...${NC}"
    mkdir -p bin
    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o bin/cloudflared
    chmod +x bin/cloudflared
    CLOUDFLARED_CMD="./bin/cloudflared"
else
    CLOUDFLARED_CMD="cloudflared"
fi

# Detect target port: 80 if nginx is running, else 5173
TARGET_PORT=80
if ! nc -z localhost 80 2>/dev/null; then
    TARGET_PORT=5173
fi

echo -e "${GREEN}Starting secure public tunnel to http://localhost:${TARGET_PORT}...${NC}"
echo -e "${CYAN}Share the generated 'trycloudflare.com' HTTPS link with anyone!${NC}\n"

$CLOUDFLARED_CMD tunnel --url "http://localhost:${TARGET_PORT}"

