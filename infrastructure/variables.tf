variable "aws_region" {
  type        = string
  default     = "eu-west-1"
  description = "AWS region for deployment (e.g. eu-west-1 or af-south-1)"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment (production, staging)"
}

variable "domain_name" {
  type        = string
  default     = "app.pingtopay.com"
  description = "Domain name for SSL certificate and ALB"
}

variable "ecr_repository_url" {
  type        = string
  default     = "123456789012.dkr.ecr.eu-west-1.amazonaws.com/pingtopay"
  description = "ECR Docker repository URL"
}
