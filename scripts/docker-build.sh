#!/bin/bash
# ============================
# DJ Helper - Docker Build Script
# ============================
# This script builds the Docker image and prevents dangling images accumulation
# Compatible with Synology/UGOS NAS

set -e

IMAGE_NAME="dj-helper"
IMAGE_TAG="latest"

echo "=== DJ Helper Docker Build ==="
echo ""

# Step 1: Remove old image to prevent dangling images
echo "=== Step 1: Removing old image (if exists) ==="
if docker image inspect "${IMAGE_NAME}:${IMAGE_TAG}" > /dev/null 2>&1; then
    # Stop container if running
    docker stop dj-rotation 2>/dev/null || true
    docker rm dj-rotation 2>/dev/null || true
    # Remove old image
    docker rmi "${IMAGE_NAME}:${IMAGE_TAG}" 2>/dev/null || true
    echo "Old image removed"
else
    echo "No old image found"
fi

# Step 2: Clean up any existing dangling images BEFORE build
echo ""
echo "=== Step 2: Cleaning up existing dangling images ==="
docker image prune -f

# Step 3: Build new image
echo ""
echo "=== Step 3: Building new image: ${IMAGE_NAME}:${IMAGE_TAG} ==="
docker compose build --pull --no-cache

# Step 4: Clean up build cache and any new dangling images
echo ""
echo "=== Step 4: Final cleanup ==="
docker image prune -f
docker builder prune -f 2>/dev/null || true

# Show the built image
echo ""
echo "=== Build complete! ==="
docker images | grep -E "REPOSITORY|${IMAGE_NAME}"

echo ""
echo "To run: docker compose up -d"
echo ""
echo "NOTE: This script removes old images before building to prevent"
echo "      accumulation of dangling <none> images on your NAS."
