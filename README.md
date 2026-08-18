# Evergreen Living Services

Evergreen Living Services is a HIPAA-compliant clinical note-taking solution designed for senior living facilities. The platform enables nurses to dictate notes on mobile devices, which are transcribed, AI-structured, reviewed, and submitted to the patient's EHR system via FHIR standards.

## Overview

This solution provides a secure, auditable workflow for capturing clinical documentation in real-time, with built-in AI assistance and multilevel approvals to ensure accuracy and compliance with healthcare regulations.

## Architecture

### High-Level Solution Flow

The solution operates in two main phases: **mobile capture** and **backend processing**.

#### Phase 1: Mobile & Edge Security

- **Mobile App**: React Native tablet application supporting offline-first capture
- **Encryption**: All data encrypted locally on device
- **Edge Security**: API Gateway and WAF provide the secure front door
  - Multi-factor authentication (MFA) via Cognito
  - Request inspection and rate limiting
  - DDoS protection

#### Phase 2: Private VPC Processing

Behind the AWS HIPAA/BAA boundary, a private VPC orchestrates the core workflow:

1. **Audio Capture & Storage**
   - Lambda ingests audio with idempotent writes
   - Audio stored in S3 with server-side encryption (SSE-KMS)
   - Versioning enabled for audit trails

2. **Transcription & AI Processing**
   - AWS Transcribe Medical converts speech to text using clinical vocabulary
   - Amazon Bedrock (Claude) structures the raw transcript into EPIC-compatible fields
   - Results stored in DynamoDB drafts table with full edit history

3. **Review & Approval Workflow**
   - **Manager Review**: Supervisor reviews AI-drafted note, flags unclear items, and makes edits
   - **Sign-off Gate**: Manager re-authenticates before approving
   - **Immutable Audit Trail**: Every draft creation, edit, view, and sign-off is logged
   - **Separate Dev/QA Accounts**: Synthetic data only; no PHI in non-production environments

4. **Final Submission**
   - Lambda submit function executes only after approval (post-approval only)
   - FHIR-compliant data written to EPIC via FHIR R4 API
   - HL7/SMART authorization enforced
   - CloudTrail logs all interactions

### Infrastructure & Security Features

#### Encryption & Data Protection

- **In Transit**: All data encrypted; Private VPC endpoints eliminate internet exposure
- **At Rest**: KMS-managed keys for S3, DynamoDB, and secrets
- **Field-Level Audit**: Every edit tracked by field, user, and timestamp

#### Governance & Compliance

- **HIPAA Boundary**: AWS HIPAA/BAA boundary contains all PHI processing
- **Immutable Audit Trail**: Tamper-proof storage retained per regulatory policy
- **No Unapproved Exits**: Notes cannot reach EPIC without human sign-off
- **Cross-cutting Services**:
  - AWS KMS for key management
  - CloudTrail for immutable event logging
  - AWS Secrets Manager for credential rotation
  - Step Functions for workflow orchestration

#### Separate Environments

- **Development & QA**: Isolated accounts with synthetic data only
- **Production**: Strict segregation with PHI only in production
- **One Approved Exit**: EPIC FHIR API is the single approved data egress point

### Workflow Walkthrough

1. **Nurse Dictates**: Tablet app records audio, works offline
2. **Speech to Text**: AWS Transcribe Medical transcribes audio with clinical accuracy
3. **AI Drafting**: Bedrock structures transcription into EPIC-compatible format
4. **Manager Reviews**: Supervisor reviews, flags ambiguous items, makes edits
5. **Sign-off Gate**: Manager re-authenticates to approve
6. **Audit Logged**: All steps recorded immutably
7. **EPIC Submit**: Approved note submitted to EPIC via FHIR R4 API
8. **Locked**: Note locked in system; history retained per policy

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native, offline-first, encrypted storage |
| **Edge Security** | API Gateway, WAF, Cognito MFA |
| **Core Services** | Lambda, S3, DynamoDB, Bedrock |
| **Transcription** | AWS Transcribe Medical |
| **EHR Integration** | FHIR R4 API (HL7/SMART) |
| **Workflow** | AWS Step Functions |
| **Logging & Audit** | CloudTrail, Secrets Manager, KMS |
| **VPC** | Private endpoints, no internet-facing data |

## Key Design Principles

- **Audit-First**: Every action is immutably logged
- **Approval-Gated**: No data flows without human sign-off
- **Offline-Ready**: Mobile app works without connectivity
- **Secure-by-Default**: Encryption, authentication, and authorization built in
- **HIPAA-Compliant**: Business Associate Agreement in place; PHI isolated to production
