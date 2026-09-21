#!/usr/bin/env bash

# ============================================================
# Student Brain — Local Network Share Info
# Displays local IP addresses and connection URLs for other devices
# ============================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  🌐 Student Brain — Local Network Access URLs       ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Detect active IP addresses
IPS=$(hostname -I 2>/dev/null || ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1')

if [ -z "$IPS" ]; then
    echo -e "${YELLOW}Could not automatically determine IP address. Check with: ip addr show${NC}"
else
    echo -e "${GREEN}Your machine's Local IP(s):${NC}"
    for ip in $IPS; do
        echo -e "  📌 ${CYAN}http://${ip}:5173${NC} (Development Port)"
        echo -e "  📌 ${CYAN}http://${ip}${NC}      (Production Nginx Port 80)"
        echo -e "  📌 ${CYAN}http://${ip}/api/${NC} (Backend API)"
    done
fi

echo -e "\n${YELLOW}💡 Note: Make sure the other device is on the same Wi-Fi / LAN.${NC}"
echo -e "If you have UFW firewall enabled, run:"
echo -e "  ${GREEN}sudo ufw allow 80/tcp && sudo ufw allow 5173/tcp && sudo ufw allow 8000/tcp${NC}\n"
