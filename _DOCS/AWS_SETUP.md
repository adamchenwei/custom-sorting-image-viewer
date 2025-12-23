# AWS S3 + CloudFront Setup

This document describes the AWS infrastructure setup for serving images securely.

## Infrastructure Created

| Resource | ID/Name | Description |
|----------|---------|-------------|
| **S3 Bucket (Raw)** | `custom-sorting-images-raw` | Stores raw uploaded images |
| **S3 Bucket (Processed)** | `custom-sorting-images-processed` | Stores optimized images for serving |
| **CloudFront Distribution** | `E16TTNPZPU9T8Z` | CDN for serving images |
| **CloudFront Domain** | `d105g9g8xzllmy.cloudfront.net` | Public URL for images |
| **Origin Access Control** | `E1BOMWU9FBLPBK` | Restricts S3 access to CloudFront |
| **Public Key** | `K3PLZDT1T5TS9R` | For signing URLs |
| **Key Group** | `d2657f72-816b-4dd5-be27-ce2b86be43e8` | Contains public key for signed URLs |

## Security

- **S3 Bucket**: Private, only accessible via CloudFront OAC
- **CloudFront**: Requires signed URLs for all requests
- **Signed URLs**: Generated server-side with 1-hour expiration (configurable)

## Environment Variables

Add to `.env`:

```bash
# AWS Configuration (uses ~/.aws/credentials from CLI by default)
AWS_REGION=us-east-1

# S3 Buckets
S3_BUCKET_RAW=custom-sorting-images-raw
S3_BUCKET_PROCESSED=custom-sorting-images-processed

# CloudFront Configuration
CLOUDFRONT_DOMAIN=https://d105g9g8xzllmy.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=K3PLZDT1T5TS9R
CLOUDFRONT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

## API Endpoints

### GET /api/cloudfront/signed-url
Generate a signed URL for a single image.

**Query Parameters:**
- `key` (required): Image key in S3
- `expiresIn` (optional): Seconds until expiration (default: 3600)

**Response:**
```json
{
  "url": "https://d105g9g8xzllmy.cloudfront.net/...",
  "key": "path/to/image.jpg"
}
```

### POST /api/cloudfront/signed-url
Generate signed URLs for multiple images.

**Body:**
```json
{
  "keys": ["image1.jpg", "image2.jpg"],
  "expiresIn": 3600
}
```

**Response:**
```json
{
  "urls": {
    "image1.jpg": "https://...",
    "image2.jpg": "https://..."
  }
}
```

### POST /api/cloudfront/upload-url
Generate a pre-signed URL for uploading to S3.

**Body:**
```json
{
  "filename": "screenshot.png",
  "contentType": "image/png",
  "deviceId": "device-1"
}
```

## React Component

Use the `SecureImage` component to display images:

```tsx
import { SecureImage } from '@/components/SecureImage';

<SecureImage
  imageKey="path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
/>
```

## Files Created

- `app/services/cloudfront.ts` - CloudFront signed URL generation
- `app/services/s3.ts` - S3 operations (upload, list, delete)
- `app/api/cloudfront/signed-url/route.ts` - Signed URL API
- `app/api/cloudfront/upload-url/route.ts` - Upload URL API
- `app/components/SecureImage.tsx` - React component for secure images
- `aws/` - AWS configuration files and keys (gitignored)

## Cost Estimate

Based on current usage (3GB storage, 500 requests/day):
- **Monthly cost**: ~$0.14 (FREE under AWS Free Tier first 12 months)

See `_DOCS/aws_images_host_approach_analysis.md` for detailed cost analysis.
