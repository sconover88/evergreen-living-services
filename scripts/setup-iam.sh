#!/usr/bin/env bash
# Creates a dedicated IAM user with the minimum permissions needed for the demo.
# Run once before deploying. Outputs the access key to add to .env
set -euo pipefail

USER_NAME="${IAM_USER:-evergreen-transcribe-demo}"
POLICY_NAME="EvergreenTranscribeMedicalPolicy"
PROFILE="${AWS_PROFILE:-default}"

echo "Creating IAM user: $USER_NAME"
aws iam create-user --user-name "$USER_NAME" --profile "$PROFILE" 2>/dev/null || \
  echo "User already exists, continuing..."

echo "Attaching inline policy: $POLICY_NAME"
aws iam put-user-policy \
  --user-name "$USER_NAME" \
  --policy-name "$POLICY_NAME" \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "transcribe:StartMedicalStreamTranscription",
          "transcribemedical:StartMedicalStreamTranscription"
        ],
        "Resource": "*"
      }
    ]
  }' \
  --profile "$PROFILE"

echo "Creating access key..."
KEY_OUTPUT=$(aws iam create-access-key --user-name "$USER_NAME" --profile "$PROFILE")

ACCESS_KEY_ID=$(echo "$KEY_OUTPUT" | grep -o '"AccessKeyId": "[^"]*"' | cut -d'"' -f4)
SECRET_ACCESS_KEY=$(echo "$KEY_OUTPUT" | grep -o '"SecretAccessKey": "[^"]*"' | cut -d'"' -f4)

echo ""
echo "Add these to your .env file:"
echo "VITE_AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID"
echo "VITE_AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY"
