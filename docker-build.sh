#!/bin/bash
# ============================
# DJ Helper - Docker Build Script
# ============================
# This script builds the Docker image and cleans up dangling images

set -e

IMAGE_NAME="dj-helper"
IMAGE_TAG="latest"

echo "=== Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG} ==="

# Build with docker compose (ensures proper tagging)
docker compose build --pull

# Clean up dangling images (images with <none> tag)
echo ""
echo "=== Cleaning up dangling images ==="
docker image prune -f

# Show the built image
echo ""
echo "=== Build complete! ==="
docker images | grep -E "REPOSITORY|${IMAGE_NAME}"

echo ""
echo "To run: docker compose up -d"
