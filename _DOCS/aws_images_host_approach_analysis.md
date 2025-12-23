# AWS Image Hosting Approach Analysis

## Executive Summary

This document analyzes the best approach for hosting and serving 100,000+ optimized images (3GB+) from multiple Android devices to a web application, with secure server-to-server communication.

---

## 1. Requirements Summary

| Requirement | Details |
|-------------|---------|
| **Source** | Multiple Android devices taking screenshots |
| **Processing** | Image optimization before upload |
| **Storage** | ~3GB, 100,000+ images (growing) |
| **Access Pattern** | 10 images per load, 50 loads/day = 500 image requests/day |
| **Security** | Server-to-server authentication (private/public key) |
| **Consumer** | Next.js web app (custom-sorting-image-viewer) |

---

## 2. Recommended Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ANDROID DEVICES                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                                   │
│  │ Device 1 │  │ Device 2 │  │ Device N │                                   │
│  │Screenshot│  │Screenshot│  │Screenshot│                                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                                   │
│       │             │             │                                          │
│       └─────────────┼─────────────┘                                          │
│                     ▼                                                        │
│         ┌───────────────────────┐                                            │
│         │  Local Optimization   │  (Sharp/ImageMagick on device or           │
│         │       Script          │   companion server)                        │
│         └───────────┬───────────┘                                            │
└─────────────────────┼───────────────────────────────────────────────────────┘
                      │
                      ▼ HTTPS + Pre-signed URL or IAM Auth
┌─────────────────────────────────────────────────────────────────────────────┐
│                                AWS CLOUD                                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        UPLOAD PATH                                   │    │
│  │                                                                      │    │
│  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐    │    │
│  │   │ API Gateway  │────▶│    Lambda    │────▶│   S3 Bucket      │    │    │
│  │   │ (Upload API) │     │(Validate/Log)│     │  (Raw Images)    │    │    │
│  │   └──────────────┘     └──────────────┘     └────────┬─────────┘    │    │
│  │                                                       │              │    │
│  │                                          S3 Event Trigger            │    │
│  │                                                       ▼              │    │
│  │                                              ┌──────────────────┐    │    │
│  │                                              │    Lambda        │    │    │
│  │                                              │ (Post-process/   │    │    │
│  │                                              │  Thumbnail Gen)  │    │    │
│  │                                              └────────┬─────────┘    │    │
│  │                                                       │              │    │
│  │                                                       ▼              │    │
│  │                                              ┌──────────────────┐    │    │
│  │                                              │   S3 Bucket      │    │    │
│  │                                              │ (Processed)      │    │    │
│  │                                              └────────┬─────────┘    │    │
│  └───────────────────────────────────────────────────────┼──────────────┘    │
│                                                          │                   │
│  ┌───────────────────────────────────────────────────────┼──────────────┐    │
│  │                        SERVING PATH                   │              │    │
│  │                                                       ▼              │    │
│  │   ┌──────────────┐     ┌──────────────────────────────────────┐     │    │
│  │   │  CloudFront  │◀────│  Origin: S3 (Processed Images)       │     │    │
│  │   │    (CDN)     │     │  + Signed URLs/Cookies               │     │    │
│  │   └──────┬───────┘     └──────────────────────────────────────┘     │    │
│  │          │                                                          │    │
│  └──────────┼──────────────────────────────────────────────────────────┘    │
│             │                                                                │
└─────────────┼────────────────────────────────────────────────────────────────┘
              │
              ▼ Signed URLs (Server-to-Server Auth)
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WEB APPLICATION                                    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Next.js App (Vercel/EC2)                         │   │
│   │                                                                      │   │
│   │   API Route:                     Frontend:                          │   │
│   │   /api/images                    React Components                   │   │
│   │   - Generate signed URLs         - Display images                   │   │
│   │   - Validate requests            - Lazy loading                     │   │
│   │   - Rate limiting                - Pagination                       │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. AWS Services Breakdown

### 3.1 Storage: Amazon S3

**Why S3:**
- Highly durable (99.999999999% durability)
- Cost-effective for large media storage
- Native integration with CloudFront
- Supports versioning and lifecycle policies

**Configuration:**
```
Bucket 1: images-raw-uploads
├── Lifecycle: Move to Glacier after 90 days (optional)
└── Access: Private, upload via pre-signed URLs

Bucket 2: images-processed
├── Storage Class: S3 Standard
├── Access: Private, served via CloudFront
└── CORS: Configured for your web app domain
```

### 3.2 CDN: Amazon CloudFront

**Why CloudFront:**
- Global edge caching (reduces S3 data transfer costs)
- Signed URLs/Cookies for secure access
- Lower latency for end users
- Cost savings on repeated requests

**Security Configuration:**
- **Signed URLs**: Each image request requires a signed URL (valid for 1-24 hours)
- **Origin Access Control (OAC)**: S3 bucket only accessible via CloudFront
- **Custom Headers**: Add secret header for additional validation

### 3.3 Compute: AWS Lambda (Optional)

**Use Cases:**
1. **Image Optimization**: Resize/compress on upload (if not done on device)
2. **URL Signing**: Generate signed URLs via API
3. **Logging/Analytics**: Track image access patterns

### 3.4 API: Amazon API Gateway (Optional)

**For Upload API:**
- RESTful endpoint for Android devices
- IAM authentication or API keys
- Request validation and throttling

---

## 4. Security Architecture

### 4.1 Server-to-Server Authentication Options

#### Option A: CloudFront Signed URLs (Recommended)

```javascript
// Next.js API Route: /api/images/[imageId]/signed-url
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

export async function GET(request, { params }) {
  const { imageId } = params;
  
  const signedUrl = getSignedUrl({
    url: `https://d1234567890.cloudfront.net/images/${imageId}`,
    keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
    privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
    dateLessThan: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
  });
  
  return Response.json({ url: signedUrl });
}
```

**Security Flow:**
1. Web app backend requests signed URL from API route
2. API validates request (session, rate limit)
3. Returns signed URL valid for limited time
4. Frontend uses signed URL to fetch image from CloudFront
5. CloudFront validates signature before serving

#### Option B: S3 Pre-signed URLs

```javascript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'us-east-1' });

async function getPresignedImageUrl(imageKey) {
  const command = new GetObjectCommand({
    Bucket: 'images-processed',
    Key: imageKey,
  });
  
  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}
```

#### Option C: IAM Role-Based (For Server-to-Server Only)

- EC2 instance role with S3 read permissions
- No signed URLs needed if fetching from backend only
- Less flexible but simpler

### 4.2 Upload Security

**Android Device → S3:**
```javascript
// Backend generates pre-signed upload URL
const command = new PutObjectCommand({
  Bucket: 'images-raw-uploads',
  Key: `device-${deviceId}/${timestamp}-${filename}`,
  ContentType: 'image/webp',
});

const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
```

**Device Authentication Options:**
1. **API Key per Device**: Simple, revocable
2. **AWS Cognito**: Full user/device management
3. **Custom JWT**: Your own auth service

---

## 5. Cost Estimation

### 5.1 Current Usage Profile

| Metric | Value |
|--------|-------|
| Total Storage | 3 GB (growing) |
| Total Images | 100,000+ |
| Average Image Size | ~30 KB (optimized) |
| Daily Loads | 50 |
| Images per Load | 10 |
| Daily Image Requests | 500 |
| Monthly Image Requests | 15,000 |

### 5.2 AWS Cost Breakdown (US East Region)

#### S3 Storage

| Item | Calculation | Monthly Cost |
|------|-------------|--------------|
| Storage (Standard) | 3 GB × $0.023/GB | **$0.07** |
| PUT Requests (uploads) | 1,000 × $0.005/1000 | **$0.005** |
| GET Requests (via CloudFront) | 0 (served by CF) | **$0.00** |
| **S3 Total** | | **~$0.08** |

#### CloudFront

| Item | Calculation | Monthly Cost |
|------|-------------|--------------|
| Data Transfer Out | 15,000 × 30 KB = 450 MB × $0.085/GB | **$0.04** |
| HTTP Requests | 15,000 × $0.0075/10,000 | **$0.01** |
| **CloudFront Total** | | **~$0.05** |

#### Lambda (Optional, for URL signing)

| Item | Calculation | Monthly Cost |
|------|-------------|--------------|
| Invocations | 15,000 × $0.0000002 | **$0.003** |
| Duration (128MB, 100ms) | 15,000 × 100ms × $0.0000000021 | **$0.003** |
| **Lambda Total** | | **~$0.01** |

### 5.3 Total Monthly Cost Summary

| Service | Cost |
|---------|------|
| S3 | $0.08 |
| CloudFront | $0.05 |
| Lambda | $0.01 |
| **Total** | **~$0.14/month** |

**Note:** AWS Free Tier (first 12 months) includes:
- 5 GB S3 storage
- 50 GB CloudFront data transfer
- 1 million Lambda invocations

**Your usage would be 100% FREE under Free Tier.**

### 5.4 Cost at Scale (Future Projections)

| Scale | Storage | Monthly Requests | Est. Cost |
|-------|---------|-----------------|-----------|
| Current | 3 GB | 15,000 | $0.14 |
| 10 GB | 10 GB | 50,000 | $0.50 |
| 50 GB | 50 GB | 200,000 | $2.50 |
| 100 GB | 100 GB | 500,000 | $6.00 |

---

## 6. Implementation Approach

### Phase 1: S3 + CloudFront Setup (Day 1)

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-app-images-processed --region us-east-1
   ```

2. **Configure Bucket Policy for CloudFront OAC**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Service": "cloudfront.amazonaws.com"
         },
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-app-images-processed/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
           }
         }
       }
     ]
   }
   ```

3. **Create CloudFront Distribution**
   - Origin: S3 bucket
   - Origin Access: Origin Access Control (OAC)
   - Viewer Protocol Policy: HTTPS only
   - Signed URLs: Enable

4. **Generate CloudFront Key Pair**
   - Create key pair in CloudFront console
   - Store private key securely (AWS Secrets Manager or env var)

### Phase 2: Next.js Integration (Day 2)

1. **Install AWS SDK**
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/cloudfront-signer
   ```

2. **Create API Route for Signed URLs**
   ```typescript
   // app/api/images/signed-url/route.ts
   import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
   import { NextRequest, NextResponse } from 'next/server';

   export async function GET(request: NextRequest) {
     const imageKey = request.nextUrl.searchParams.get('key');
     
     if (!imageKey) {
       return NextResponse.json({ error: 'Missing key' }, { status: 400 });
     }

     const signedUrl = getSignedUrl({
       url: `${process.env.CLOUDFRONT_DOMAIN}/${imageKey}`,
       keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
       privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
       dateLessThan: new Date(Date.now() + 3600 * 1000).toISOString(),
     });

     return NextResponse.json({ url: signedUrl });
   }
   ```

3. **Update Image Component**
   ```typescript
   // components/SecureImage.tsx
   'use client';
   import { useState, useEffect } from 'react';
   import Image from 'next/image';

   export function SecureImage({ imageKey }: { imageKey: string }) {
     const [signedUrl, setSignedUrl] = useState<string | null>(null);

     useEffect(() => {
       fetch(`/api/images/signed-url?key=${encodeURIComponent(imageKey)}`)
         .then(res => res.json())
         .then(data => setSignedUrl(data.url));
     }, [imageKey]);

     if (!signedUrl) return <div>Loading...</div>;

     return (
       <Image
         src={signedUrl}
         alt=""
         width={800}
         height={600}
         unoptimized // CloudFront handles optimization
       />
     );
   }
   ```

### Phase 3: Android Upload Pipeline (Day 3-5)

1. **Create Upload API**
   - API Gateway + Lambda for generating pre-signed upload URLs
   - Or direct S3 pre-signed URL generation from your backend

2. **Android Service**
   ```kotlin
   // Pseudo-code for Android upload service
   class ImageUploadService {
       suspend fun uploadOptimizedImage(file: File) {
           // 1. Optimize image locally
           val optimized = ImageOptimizer.optimize(file)
           
           // 2. Get pre-signed upload URL from your API
           val uploadUrl = api.getUploadUrl(file.name)
           
           // 3. Upload to S3
           httpClient.put(uploadUrl, optimized.bytes())
       }
   }
   ```

### Phase 4: Image Optimization Pipeline (Optional)

If optimizing on AWS instead of device:

```javascript
// Lambda function triggered by S3 upload
import sharp from 'sharp';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

export const handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  
  // Get original image
  const original = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  
  // Optimize
  const optimized = await sharp(await original.Body.transformToByteArray())
    .webp({ quality: 80 })
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .toBuffer();
  
  // Save to processed bucket
  await s3.send(new PutObjectCommand({
    Bucket: 'images-processed',
    Key: key.replace('raw/', 'processed/'),
    Body: optimized,
    ContentType: 'image/webp',
  }));
};
```

---

## 7. Alternative Approaches Comparison

| Approach | Pros | Cons | Monthly Cost (3GB) |
|----------|------|------|-------------------|
| **S3 + CloudFront (Recommended)** | Industry standard, scalable, secure | More complex setup | $0.14 |
| **S3 Direct** | Simpler | Higher latency, no caching, higher data costs | $0.25 |
| **EC2 + Nginx** | Full control | Maintenance burden, less scalable | $10+ |
| **Cloudflare R2** | No egress fees | Less AWS integration | $0.015/GB = $0.05 |
| **DigitalOcean Spaces** | Simpler, cheaper | Less features | $5 flat |

---

## 8. Migration Strategy for Existing App

### Current State
- Images in `/public` folder
- Direct file system access
- No authentication

### Target State
- Images in S3
- CloudFront CDN serving
- Signed URL authentication

### Migration Steps

1. **Parallel Operation**
   - Keep existing `/public` images
   - Add new image fetching logic with fallback

2. **Image Upload Script**
   ```bash
   aws s3 sync ./public/images s3://your-bucket/images --exclude "*.DS_Store"
   ```

3. **Gradual Rollout**
   ```typescript
   function getImageUrl(imageKey: string) {
     if (process.env.USE_S3 === 'true') {
       return getSignedUrl(imageKey);
     }
     return `/images/${imageKey}`;
   }
   ```

4. **Full Migration**
   - Remove `/public` images
   - Update all image references

---

## 9. Environment Variables Required

```bash
# .env.local

# AWS Configuration
# NOTE: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are NOT required
# if AWS CLI is configured (~/.aws/credentials). The SDK uses the
# default credential provider chain automatically.
AWS_REGION=us-east-1

# S3
S3_BUCKET_RAW=custom-sorting-images-raw
S3_BUCKET_PROCESSED=custom-sorting-images-processed

# CloudFront
CLOUDFRONT_DOMAIN=https://d105g9g8xzllmy.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=K3PLZDT1T5TS9R
CLOUDFRONT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

**Credential Provider Chain Priority:**
1. `~/.aws/credentials` file (from `aws configure`)
2. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
3. IAM instance role (for EC2/Lambda)

---

## 10. Recommendations

### Immediate Actions

1. **Start with S3 + CloudFront** - Most cost-effective and scalable
2. **Use CloudFront Signed URLs** - Proper server-to-server auth
3. **Optimize images on device** before upload - Saves Lambda costs
4. **Use WebP format** - 30% smaller than JPEG

### Future Optimizations

1. **S3 Intelligent Tiering** - Auto-moves infrequently accessed images
2. **CloudFront Functions** - Edge-side URL signing (lower latency)
3. **Image CDN** (Cloudinary/Imgix) - If you need on-the-fly transformations

### Cost Saving Tips

1. Use **S3 Lifecycle Policies** to move old images to Glacier
2. Enable **CloudFront caching** aggressively (cache-control headers)
3. Use **reserved capacity** if usage becomes predictable
4. Consider **Cloudflare R2** for zero egress fees at scale

---

## 11. Conclusion

For your use case (3GB, 100k+ images, 500 requests/day), the **S3 + CloudFront with Signed URLs** approach is optimal:

- **Cost**: ~$0.14/month (FREE under AWS Free Tier)
- **Security**: Server-to-server authentication via signed URLs
- **Performance**: Global CDN with edge caching
- **Scalability**: Handles millions of images without architecture changes

The implementation can be completed in 3-5 days with the phased approach outlined above.

---

*Report generated: December 23, 2024*

---

## 12. Implementation Status

### ✅ Completed (Phase 1 & 2)

| Component | Status | Details |
|-----------|--------|---------|
| **S3 Bucket (Raw)** | ✅ Created | `custom-sorting-images-raw` |
| **S3 Bucket (Processed)** | ✅ Created | `custom-sorting-images-processed` |
| **CloudFront Distribution** | ✅ Created | `E16TTNPZPU9T8Z` |
| **CloudFront Domain** | ✅ Active | `https://d105g9g8xzllmy.cloudfront.net` |
| **Origin Access Control** | ✅ Configured | `E1BOMWU9FBLPBK` |
| **Signed URL Key Pair** | ✅ Generated | `K3PLZDT1T5TS9R` |
| **S3 Bucket Policy** | ✅ Applied | CloudFront OAC only |
| **API Route: Signed URL** | ✅ Created | `/api/cloudfront/signed-url` |
| **API Route: Upload URL** | ✅ Created | `/api/cloudfront/upload-url` |
| **SecureImage Component** | ✅ Created | `app/components/SecureImage.tsx` |
| **AWS SDK Installed** | ✅ Done | `@aws-sdk/client-s3`, `@aws-sdk/cloudfront-signer` |

### ⏳ Pending (Phase 3+)

| Task | Description |
|------|-------------|
| **App Refactor** | Migrate existing app from `/public` folder to CloudFront |
| **Image Migration** | Sync existing images to S3 |
| **Android Upload Pipeline** | Create upload service for Android devices |
| **Image Optimization Lambda** | Optional: Server-side optimization |

### Files Created

```
app/
├── api/cloudfront/
│   ├── signed-url/route.ts    # GET/POST signed URLs
│   └── upload-url/route.ts    # Upload pre-signed URLs
├── components/
│   └── SecureImage.tsx        # React component for secure images
└── services/
    ├── cloudfront.ts          # Signed URL generation
    └── s3.ts                  # S3 operations

aws/                           # AWS config files (gitignored keys)
├── cloudfront-distribution-config.json
├── s3-bucket-policy.json
└── keys/                      # Private keys (gitignored)

_DOCS/
└── AWS_SETUP.md               # Setup documentation
```
