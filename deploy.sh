#!/bin/bash

# Algerian Markets Platform - Deployment Script
# This script helps deploy the application using Docker

set -e

# Configuration
PROJECT_NAME="algerian-markets"
REGISTRY="ghcr.io"
IMAGE_NAME="${REGISTRY}/$(echo $GITHUB_REPOSITORY | tr '[:upper:]' '[:lower:]')"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Parse command line arguments
ENVIRONMENT=${1:-development}
ACTION=${2:-up}

log_info "Deploying Algerian Markets Platform in ${ENVIRONMENT} environment..."
log_info "Action: ${ACTION}"

# Create necessary directories
log_info "Creating necessary directories..."
mkdir -p db
mkdir -p ssl

# Copy environment file if it doesn't exist
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    log_warn "Environment file .env.${ENVIRONMENT} not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example ".env.${ENVIRONMENT}"
        log_info "Created .env.${ENVIRONMENT} from template. Please update it with your configuration."
    else
        log_error "No .env.example found. Please create .env.${ENVIRONMENT} manually."
        exit 1
    fi
fi

# Build and deploy based on environment
case $ENVIRONMENT in
    "development")
        log_info "Starting development environment..."
        
        # Stop existing containers
        docker-compose down
        
        # Build and start services
        docker-compose --profile development up --build -d
        
        log_info "Development environment started successfully!"
        log_info "Application is available at: http://localhost:3000"
        log_info "To view logs: docker-compose logs -f"
        log_info "To stop: docker-compose down"
        ;;
        
    "production")
        log_info "Starting production environment..."
        
        # Check if SSL certificates exist
        if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
            log_warn "SSL certificates not found. Generating self-signed certificates..."
            mkdir -p ssl
            openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=DZ/ST=Algiers/L=Algiers/O=Algerian Markets/CN=localhost"
            log_info "Self-signed certificates generated. Replace with valid certificates for production."
        fi
        
        # Stop existing containers
        docker-compose --profile production down
        
        # Build and start services
        docker-compose --profile production up --build -d
        
        log_info "Production environment started successfully!"
        log_info "Application is available at: https://localhost"
        log_info "To view logs: docker-compose --profile production logs -f"
        log_info "To stop: docker-compose --profile production down"
        ;;
        
    *)
        log_error "Unknown environment: ${ENVIRONMENT}"
        log_info "Available environments: development, production"
        exit 1
        ;;
esac

# Health check
log_info "Performing health check..."
sleep 10

if [ "$ENVIRONMENT" = "production" ]; then
    HEALTH_URL="https://localhost/health"
else
    HEALTH_URL="http://localhost:3000/api/health"
fi

if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    log_info "Health check passed!"
else
    log_warn "Health check failed. Check the logs for more information."
fi

log_info "Deployment completed successfully!"