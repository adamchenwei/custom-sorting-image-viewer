#!/bin/bash

# Sync images from /public/images_optimized to S3
# Usage: ./scripts/sync-images-to-s3.sh

set -e

S3_BUCKET="custom-sorting-images-processed"
SOURCE_DIR="./public/images_optimized"

echo "=== S3 Image Sync Script ==="
echo "Source: $SOURCE_DIR"
echo "Destination: s3://$S3_BUCKET/images_optimized/"
echo ""

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Source directory $SOURCE_DIR does not exist"
    exit 1
fi

# Count files
FILE_COUNT=$(find "$SOURCE_DIR" -type f | wc -l | tr -d ' ')
echo "Found $FILE_COUNT files to sync"
echo ""

# Confirm before proceeding
read -p "Do you want to proceed with the sync? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Sync cancelled"
    exit 0
fi

echo ""
echo "Starting sync..."
echo ""

# Sync to S3 with progress
aws s3 sync "$SOURCE_DIR" "s3://$S3_BUCKET/images_optimized/" \
    --exclude "*.DS_Store" \
    --exclude ".gitkeep" \
    --content-type "image/webp" \
    --no-progress

echo ""
echo "=== Sync Complete ==="

# Verify by listing a few files
echo ""
echo "Verifying upload (first 5 files):"
aws s3 ls "s3://$S3_BUCKET/images_optimized/" --summarize | head -10

echo ""
echo "To enable CloudFront images, update .env:"
echo "  NEXT_PUBLIC_USE_CLOUDFRONT_IMAGES=true"
