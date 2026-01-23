#!/bin/bash
#
# Build Production Deployment Package for Windows Server
# Run this script on your Mac before deploying to Windows
#

set -e  # Exit on error

echo "=========================================="
echo "Spendly - Windows Production Build Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_DIR}/build-production"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
OUTPUT_FILE="spendly-production-${TIMESTAMP}.tar.gz"

echo "Project Directory: ${PROJECT_DIR}"
echo "Build Directory: ${BUILD_DIR}"
echo ""

# Step 1: Clean previous builds
echo -e "${YELLOW}[1/6]${NC} Cleaning previous builds..."
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# Step 2: Install dependencies
echo -e "${YELLOW}[2/6]${NC} Installing production dependencies..."
cd "${PROJECT_DIR}"
npm install --production=false

# Step 3: Build Next.js application
echo -e "${YELLOW}[3/6]${NC} Building Next.js application..."
npm run build

if [ ! -d ".next" ]; then
    echo -e "${RED}ERROR:${NC} Build failed - .next directory not found"
    exit 1
fi

echo -e "${GREEN}✓${NC} Build successful"

# Step 4: Copy necessary files to build directory
echo -e "${YELLOW}[4/6]${NC} Copying files to build directory..."
cp -r .next "${BUILD_DIR}/"
cp -r public "${BUILD_DIR}/"
cp -r prisma "${BUILD_DIR}/"
cp package.json "${BUILD_DIR}/"
cp package-lock.json "${BUILD_DIR}/"
cp next.config.ts "${BUILD_DIR}/"
cp web.config "${BUILD_DIR}/"
cp ecosystem.config.js "${BUILD_DIR}/"
cp .env.production.template "${BUILD_DIR}/.env.production"
cp DEPLOYMENT_WINDOWS.md "${BUILD_DIR}/"

# Copy node_modules (production only)
echo -e "${YELLOW}[5/6]${NC} Installing production-only node_modules..."
cd "${BUILD_DIR}"
npm install --production --legacy-peer-deps

# Step 5: Create deployment archive
echo -e "${YELLOW}[6/6]${NC} Creating deployment archive..."
cd "${PROJECT_DIR}"
tar -czf "${OUTPUT_FILE}" -C "${BUILD_DIR}" .

FILE_SIZE=$(du -h "${OUTPUT_FILE}" | cut -f1)
echo""
echo -e "${GREEN}=========================================="
echo -e "✓ Production Build Complete!"
echo -e "==========================================${NC}"
echo ""
echo "Deployment Package: ${OUTPUT_FILE}"
echo "Package Size: ${FILE_SIZE}"
echo ""
echo "Next Steps:"
echo "1. Transfer ${OUTPUT_FILE} to Windows Server"
echo "2. Extract to C:\\inetpub\\wwwroot\\spendly"
echo "3. Follow instructions in DEPLOYMENT_WINDOWS.md"
echo ""

# Cleanup
echo "Cleaning up build directory..."
rm -rf "${BUILD_DIR}"

echo -e "${GREEN}Done!${NC}"
