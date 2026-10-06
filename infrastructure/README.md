# PingTopay AWS Infrastructure with Terraform

This folder contains the complete Terraform configuration for deploying PingTopay to AWS.

## Architecture
- **VPC**: 2 Public Subnets, 2 Private Subnets, Internet Gateway, NAT Gateway.
- **Compute**: AWS ECS Fargate running multi-tenant Docker container on Port 3000.
- **Traffic**: AWS Application Load Balancer with SSL/TLS termination on Port 443.
- **Secrets Management**: AWS Secrets Manager storing `GEMINI_API_KEY`, Paystack keys, Meta WhatsApp tokens, and Telegram tokens.
- **Monitoring**: AWS CloudWatch Log Groups and Container Insights.

## Deployment Steps
1. Authenticate with AWS CLI:
   ```bash
   aws configure
   ```
2. Build & push Docker container to Amazon ECR:
   ```bash
   aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin <ECR_URL>
   docker build -t pingtopay:latest .
   docker tag pingtopay:latest <ECR_URL>:latest
   docker push <ECR_URL>:latest
   ```
3. Initialize Terraform:
   ```bash
   terraform init
   ```
4. Review & Apply:
   ```bash
   terraform plan -var="ecr_repository_url=<ECR_URL>"
   terraform apply -var="ecr_repository_url=<ECR_URL>"
   ```
5. Store secrets in AWS Secrets Manager:
   ```bash
   aws secretsmanager put-secret-value --secret-id "pingtopay/production/app-secrets" --secret-string '{"GEMINI_API_KEY":"..."}'
   ```
