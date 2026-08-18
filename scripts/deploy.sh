#!/usr/bin/env bash
# Builds the app and deploys to S3 + CloudFront.
# Prerequisites: AWS CLI configured, .env file populated, npm installed.
# Usage: bash scripts/deploy.sh [bucket-name]
set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-us-east-1}"
BUCKET="${1:-${BUCKET_NAME:-kc-evergreen-nursing-notes-demo}}"
PROFILE="${AWS_PROFILE:-default}"

# ── 1. Build ──────────────────────────────────────────────────────────────────
echo "[1/5] Building application..."
npm run build
echo "      Build complete — dist/ ready"

# ── 2. Create / configure bucket ──────────────────────────────────────────────
echo "[2/5] Configuring S3 bucket: $BUCKET"

aws s3 mb "s3://$BUCKET" --region "$REGION" --profile "$PROFILE" 2>/dev/null || \
  echo "      Bucket already exists, continuing..."

aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    'BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false' \
  --profile "$PROFILE"

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${BUCKET}/*\"
    }]
  }" \
  --profile "$PROFILE"

aws s3 website "s3://$BUCKET" \
  --index-document index.html \
  --error-document index.html \
  --profile "$PROFILE"

# ── 3. Upload ──────────────────────────────────────────────────────────────────
echo "[3/5] Uploading assets (long-lived cache)..."
aws s3 sync dist/ "s3://$BUCKET" \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable" \
  --profile "$PROFILE"

echo "      Uploading index.html (no-cache)..."
aws s3 cp dist/index.html "s3://$BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --profile "$PROFILE"

S3_URL="http://$BUCKET.s3-website-$REGION.amazonaws.com"
echo "      S3 website: $S3_URL"

# ── 4. CloudFront ──────────────────────────────────────────────────────────────
echo "[4/5] Creating CloudFront distribution (HTTPS)..."

CF_CONFIG=$(cat <<EOF
{
  "CallerReference": "evergreen-$(date +%Y%m%d%H%M%S)",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3Origin",
      "DomainName": "${BUCKET}.s3-website-${REGION}.amazonaws.com",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only"
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" },
      "Headers": { "Quantity": 0 },
      "QueryStringCacheKeys": { "Quantity": 0 }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true,
    "TrustedSigners": { "Enabled": false, "Quantity": 0 }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 403,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 0
    }]
  },
  "Comment": "Evergreen Nursing Notes Demo",
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
EOF
)

CF_DOMAIN=$(aws cloudfront create-distribution \
  --distribution-config "$CF_CONFIG" \
  --query 'Distribution.DomainName' \
  --output text \
  --profile "$PROFILE")

# ── 5. Done ───────────────────────────────────────────────────────────────────
echo "[5/5] Deployment complete!"
echo ""
echo "  S3 (HTTP):         $S3_URL"
echo "  CloudFront (HTTPS): https://$CF_DOMAIN"
echo ""
echo "  CloudFront may take 5-15 minutes to propagate globally."
echo "  To redeploy, run: aws s3 sync dist/ s3://$BUCKET --delete"
echo "  Then invalidate: aws cloudfront create-invalidation --distribution-id <ID> --paths '/*'"
