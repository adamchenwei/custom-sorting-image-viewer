import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || 'https://d105g9g8xzllmy.cloudfront.net';
const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID || 'K3PLZDT1T5TS9R';
const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY || '';

export interface SignedUrlOptions {
  imageKey: string;
  expiresInSeconds?: number;
}

export function generateSignedUrl({ imageKey, expiresInSeconds = 3600 }: SignedUrlOptions): string {
  if (!CLOUDFRONT_PRIVATE_KEY) {
    throw new Error('CLOUDFRONT_PRIVATE_KEY environment variable is not set');
  }

  const url = `${CLOUDFRONT_DOMAIN}/${imageKey}`;
  const dateLessThan = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return getSignedUrl({
    url,
    keyPairId: CLOUDFRONT_KEY_PAIR_ID,
    privateKey: CLOUDFRONT_PRIVATE_KEY,
    dateLessThan,
  });
}

export function generateMultipleSignedUrls(imageKeys: string[], expiresInSeconds = 3600): Record<string, string> {
  const signedUrls: Record<string, string> = {};
  
  for (const key of imageKeys) {
    signedUrls[key] = generateSignedUrl({ imageKey: key, expiresInSeconds });
  }
  
  return signedUrls;
}
