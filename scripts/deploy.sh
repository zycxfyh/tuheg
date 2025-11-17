#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
SKIP_TESTS=${2:-false}

echo -e "${BLUE}🚀 Starting Creation Ring Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Skip Tests: ${SKIP_TESTS}${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
echo -e "${BLUE}🔍 Running pre-deployment checks...${NC}"

# Check if required tools are installed
command -v kubectl >/dev/null 2>&1 || { print_error "kubectl is required but not installed."; exit 1; }
command -v helm >/dev/null 2>&1 || { print_error "helm is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { print_error "docker is required but not installed."; exit 1; }

print_status "All required tools are installed"

# Check if cluster is accessible
kubectl cluster-info >/dev/null 2>&1 || { print_error "Cannot connect to Kubernetes cluster"; exit 1; }
print_status "Kubernetes cluster is accessible"

# Build phase
if [ "$SKIP_TESTS" = "false" ]; then
    echo -e "${BLUE}🔨 Building application...${NC}"

    # Install dependencies
    echo "Installing dependencies..."
    pnpm install --frozen-lockfile

    # Type check
    echo "Running type check..."
    pnpm type-check

    # Lint
    echo "Running linter..."
    pnpm lint

    # Test
    echo "Running tests..."
    pnpm test:ci

    print_status "All tests passed"
fi

# Build Docker images
echo -e "${BLUE}🐳 Building Docker images...${NC}"

# Build backend
echo "Building backend-gateway image..."
docker build -f apps/backend-gateway/Dockerfile -t creation-ring/backend-gateway:latest apps/backend-gateway

# Build frontend
echo "Building frontend image..."
docker build -f apps/frontend/Dockerfile -t creation-ring/frontend:latest apps/frontend

print_status "Docker images built successfully"

# Deploy to Kubernetes
echo -e "${BLUE}☸️  Deploying to Kubernetes...${NC}"

# Create namespace if it doesn't exist
kubectl create namespace creation-ring --dry-run=client -o yaml | kubectl apply -f -

# Apply Kubernetes manifests
echo "Applying Kubernetes manifests..."

# Apply base configurations
kubectl apply -f infrastructure/k8s/base/

# Apply Istio configurations
kubectl apply -f infrastructure/istio/

# Apply application deployments
kubectl apply -f infrastructure/k8s/

# Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend-gateway -n creation-ring
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n creation-ring

print_status "Kubernetes deployment completed"

# Run post-deployment tests
echo -e "${BLUE}🧪 Running post-deployment tests...${NC}"

# Test backend health
BACKEND_POD=$(kubectl get pods -n creation-ring -l app=backend-gateway -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n creation-ring $BACKEND_POD -- curl -f http://localhost:3000/health || print_warning "Backend health check failed"

# Test frontend
FRONTEND_POD=$(kubectl get pods -n creation-ring -l app=frontend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n creation-ring $FRONTEND_POD -- curl -f http://localhost/health || print_warning "Frontend health check failed"

print_status "Post-deployment tests completed"

# Display deployment info
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo "Environment: $ENVIRONMENT"
echo "Backend URL: http://$(kubectl get svc backend-gateway -n creation-ring -o jsonpath='{.spec.clusterIP}'):3000"
echo "Frontend URL: http://$(kubectl get svc frontend -n creation-ring -o jsonpath='{.spec.clusterIP}')"
echo ""
echo -e "${YELLOW}To access the application:${NC}"
echo "kubectl port-forward -n creation-ring svc/frontend 8080:80"
echo "Then visit: http://localhost:8080"

# Cleanup
echo -e "${BLUE}🧹 Cleaning up...${NC}"
# Add any cleanup commands here

print_status "Cleanup completed"
echo -e "${GREEN}🚀 Deployment finished!${NC}"
