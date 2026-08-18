#!/usr/bin/env node
// Cross-platform deploy script: S3 (private) + CloudFront with Origin Access Control.
// Bucket stays fully private — no public bucket policy needed.
// Prerequisites: AWS CLI configured, .env populated, bucket already created in console.
// Usage: node scripts/deploy.mjs [bucket-name]
import { execSync } from 'child_process';

const REGION = process.env.AWS_DEFAULT_REGION || 'us-east-1';
const BUCKET = process.argv[2] || process.env.BUCKET_NAME || 'kc-evergreen-nursing-notes-demo';
const PROFILE = process.env.AWS_PROFILE || 'default';

const profileFlag = `--profile ${PROFILE}`;

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', shell: true });
}

function capture(cmd) {
  return execSync(cmd, { shell: true }).toString().trim();
}

// ── 1. Build ─────────────────────────────────────────────────────────────────
console.log('\n[1/5] Building application...');
run('npm run build');
console.log('      Build complete — dist/ ready');

// ── 2. Upload to S3 (private bucket — IAM credentials handle write access) ──
console.log(`\n[2/5] Uploading to private S3 bucket: ${BUCKET}`);

run(`aws s3 sync dist/ s3://${BUCKET} \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable" \
  ${profileFlag}`);

run(`aws s3 cp dist/index.html s3://${BUCKET}/index.html \
  --cache-control "no-cache,no-store,must-revalidate" \
  ${profileFlag}`);

console.log('      Upload complete');

// ── 3. Create CloudFront Origin Access Control ────────────────────────────────
console.log('\n[3/5] Setting up CloudFront Origin Access Control...');

const oacConfig = JSON.stringify({
  Name: `${BUCKET}-oac`,
  Description: 'OAC for Evergreen Nursing Notes demo',
  SigningProtocol: 'sigv4',
  SigningBehavior: 'always',
  OriginAccessControlOriginType: 's3',
});

const oacId = capture(
  `aws cloudfront create-origin-access-control \
    --origin-access-control-config "${oacConfig.replace(/"/g, '\\"')}" \
    --query "OriginAccessControl.Id" \
    --output text \
    ${profileFlag}`
);
console.log(`      OAC created: ${oacId}`);

// ── 4. Create CloudFront distribution ────────────────────────────────────────
console.log('\n[4/5] Creating CloudFront distribution...');

// Use S3 REST endpoint (not website endpoint) — required for OAC
const s3RestOrigin = `${BUCKET}.s3.${REGION}.amazonaws.com`;

const cfConfig = {
  CallerReference: `evergreen-${Date.now()}`,
  DefaultRootObject: 'index.html',
  Origins: {
    Quantity: 1,
    Items: [{
      Id: 'S3Origin',
      DomainName: s3RestOrigin,
      S3OriginConfig: { OriginAccessIdentity: '' }, // empty = use OAC, not legacy OAI
      OriginAccessControlId: oacId,
    }],
  },
  DefaultCacheBehavior: {
    TargetOriginId: 'S3Origin',
    ViewerProtocolPolicy: 'redirect-to-https',
    AllowedMethods: {
      Quantity: 2,
      Items: ['GET', 'HEAD'],
      CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] },
    },
    ForwardedValues: {
      QueryString: false,
      Cookies: { Forward: 'none' },
      Headers: { Quantity: 0 },
      QueryStringCacheKeys: { Quantity: 0 },
    },
    MinTTL: 0,
    DefaultTTL: 86400,
    MaxTTL: 31536000,
    Compress: true,
    TrustedSigners: { Enabled: false, Quantity: 0 },
  },
  CustomErrorResponses: {
    Quantity: 1,
    Items: [{
      ErrorCode: 403,
      ResponsePagePath: '/index.html',
      ResponseCode: '200',
      ErrorCachingMinTTL: 0,
    }],
  },
  Comment: 'Evergreen Nursing Notes Demo',
  Enabled: true,
  PriceClass: 'PriceClass_100',
};

const cfResult = capture(
  `aws cloudfront create-distribution \
    --distribution-config "${JSON.stringify(cfConfig).replace(/"/g, '\\"')}" \
    --query "[Distribution.DomainName, Distribution.Id]" \
    --output text \
    ${profileFlag}`
);

const [cfDomain, cfId] = cfResult.split('\t');

// ── 5. Grant CloudFront read access via private bucket policy ────────────────
console.log('\n[5/5] Granting CloudFront read access to bucket...');

const accountId = capture(
  `aws sts get-caller-identity --query Account --output text ${profileFlag}`
);

const distributionArn = `arn:aws:cloudfront::${accountId}:distribution/${cfId}`;

const bucketPolicy = JSON.stringify({
  Version: '2012-10-17',
  Statement: [{
    Sid: 'AllowCloudFrontOAC',
    Effect: 'Allow',
    Principal: { Service: 'cloudfront.amazonaws.com' },
    Action: 's3:GetObject',
    Resource: `arn:aws:s3:::${BUCKET}/*`,
    Condition: {
      StringEquals: { 'AWS:SourceArn': distributionArn },
    },
  }],
});

run(
  `aws s3api put-bucket-policy \
    --bucket ${BUCKET} \
    --policy "${bucketPolicy.replace(/"/g, '\\"')}" \
    ${profileFlag}`
);

// ── Done ─────────────────────────────────────────────────────────────────────
console.log('\nDeployment complete!\n');
console.log(`  CloudFront (HTTPS):  https://${cfDomain}`);
console.log(`  Distribution ID:     ${cfId}`);
console.log('\n  Takes 5-15 minutes to propagate globally.');
console.log('  To redeploy after changes: npm run deploy:update');
console.log(`  To invalidate cache:  aws cloudfront create-invalidation --distribution-id ${cfId} --paths "/*" ${profileFlag}`);
