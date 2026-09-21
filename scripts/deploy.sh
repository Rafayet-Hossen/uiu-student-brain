#!/usr/bin/env bash
set -e

# ============================================================
# Student Brain — Automated Production Deployment Script
# Targeted for Debian 13 (Trixie) & Modern Linux Environments
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  🚀 Starting Student Brain Production Deployment   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is available.${NC}"

# 2. Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Copying .env.example to .env...${NC}"
    cp .env.example .env
fi

# 3. Create media and static directories
mkdir -p backend/media backend/staticfiles

# 4. Pull/Build Docker images
echo -e "${YELLOW}⏳ Building and launching production containers...${NC}"
docker compose -f docker-compose.prod.yml up -d --build

# 5. Wait for backend to be ready and apply migrations
echo -e "${YELLOW}⏳ Applying database migrations in container...${NC}"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput

# 6. Collect static files
echo -e "${YELLOW}⏳ Collecting Django static files...${NC}"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

# 7. Print status
echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  🎉 Student Brain deployed successfully!             ${NC}"
echo -e "${GREEN}======================================================${NC}"
docker compose -f docker-compose.prod.yml ps

echo -e "\n${BLUE}Endpoints:${NC}"
echo -e "  • Web Application:  ${GREEN}http://localhost/${NC} (or your server IP)"
echo -e "  • Backend API:      ${GREEN}http://localhost/api/${NC}"
echo -e "  • Django Admin:     ${GREEN}http://localhost/admin/${NC}"
echo -e "\nTo create an admin superuser, run:"
echo -e "  ${YELLOW}docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser${NC}\n"
