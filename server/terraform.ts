export const BUILDER_OUTPUT_CONTRACT = {
  applicationName: 'PingTopay',
  version: '1.0.0-production',
  platformType: 'Multi-Tenant AI Sales Automation SaaS for African SMEs',
  primaryMarket: 'Nigeria (NGN ₦) with multi-currency architecture (USD, GHS, KES)',
  mvpScope: {
    tenancy: 'Strict multi-tenant workspace isolation by businessId across all models and routes',
    messagingChannels: [
      'Official Meta WhatsApp Business Cloud API (webhook verification, incoming events, outbound message sending)',
      'Official Telegram Bot API (webhook ingestion, getMe authentication verification, outbound HTML messages)',
      'Omnichannel Real-Time Simulator for instant zero-friction agent testing and live demonstration',
    ],
    aiEngine: {
      provider: '@google/genai TypeScript SDK on server-side',
      model: 'gemini-3.8-flash',
      grounding: 'Strict source-of-truth grounding in active product catalogue and business knowledge base',
      safety: 'Zero hallucinations on products/prices/discounts; automatic polite escalation when info is unavailable',
      paymentSecurity: 'Never trusts unverified customer payment claims; enforces server-verified Paystack transactions',
    },
    commerceAndPayments: {
      paymentGateway: 'Paystack Payment Gateway (Card, Bank Transfer, USSD)',
      paymentWall: 'Hosted checkout page at /pay/:orderId with real-time order status and Paystack checkout',
      webhookVerification: 'HMAC SHA-512 cryptographic signature check on x-paystack-signature',
      orderStatusLifecycle: ['pending', 'payment_pending', 'paid', 'processing', 'completed', 'cancelled'],
    },
    crmAndAutomations: {
      pipelineStages: ['new', 'engaged', 'qualified', 'proposal', 'payment_pending', 'won', 'lost', 'follow_up'],
      followUpEngine: 'Configurable triggers (unpaid enquiries, abandoned carts, post-purchase check-ins)',
      humanTakeover: 'Instant human takeover toggle with AI silence mode and staff internal notes',
    },
  },
  awsArchitecture: {
    compute: 'AWS ECS Fargate with Application Load Balancer (ALB) and Auto-Scaling (min 2, max 10 tasks)',
    database: 'Amazon Aurora PostgreSQL Serverless v2 with multi-AZ replication',
    secrets: 'AWS Secrets Manager for Paystack Secret Keys, Meta Tokens, and Telegram Bot credentials',
    networking: 'VPC with 2 Public Subnets, 2 Private App Subnets, and 2 Isolated Database Subnets + NAT Gateway',
    dnsAndSSL: 'Route 53 + AWS Certificate Manager (ACM) for HTTPS termination on port 443',
    monitoring: 'Amazon CloudWatch Logs, Metric Alarms, and Container Insights',
  },
};

export const TERRAFORM_MAIN_TF = `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Application = "PingTopay"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# --- VPC & Networking ---
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "pingtopay-\${var.environment}-vpc" }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
}

# Public Subnets (ALB)
resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "\${var.aws_region}a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "\${var.aws_region}b"
  map_public_ip_on_launch = true
}

# Private Subnets (Fargate Tasks)
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "\${var.aws_region}a"
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "\${var.aws_region}b"
}

# NAT Gateway for outgoing outbound calls (Meta WhatsApp API, Telegram API, Paystack API)
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1.id
}

# --- Application Load Balancer ---
resource "aws_lb" "alb" {
  name               = "pingtopay-\${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

resource "aws_lb_target_group" "app_tg" {
  name        = "pingtopay-\${var.environment}-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# --- ECS Cluster & Fargate Service ---
resource "aws_ecs_cluster" "cluster" {
  name = "pingtopay-\${var.environment}-cluster"
}

resource "aws_ecs_task_definition" "app_task" {
  family                   = "pingtopay-server"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "pingtopay"
      image     = "\${var.ecr_repository_url}:latest"
      essential = true
      portMappings = [
        { containerPort = 3000, hostPort = 3000 }
      ]
      secrets = [
        { name = "GEMINI_API_KEY", valueFrom = "\${aws_secretsmanager_secret.pingtopay_secrets.arn}:GEMINI_API_KEY::" }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "APP_URL", value = "https://\${var.domain_name}" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/pingtopay-\${var.environment}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "app"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "app_service" {
  name            = "pingtopay-\${var.environment}-service"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.app_task.arn
  launch_type     = "FARGATE"
  desired_count   = 2

  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.app_sg.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app_tg.arn
    container_name   = "pingtopay"
    container_port   = 3000
  }
}

# --- AWS Secrets Manager ---
resource "aws_secretsmanager_secret" "pingtopay_secrets" {
  name = "pingtopay/\${var.environment}/app-secrets"
}

# Security Groups
resource "aws_security_group" "alb_sg" {
  name   = "pingtopay-\${var.environment}-alb-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app_sg" {
  name   = "pingtopay-\${var.environment}-app-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
`;

export const TERRAFORM_VARIABLES_TF = `variable "aws_region" {
  type        = string
  default     = "eu-west-1" # Ireland or af-south-1 (Cape Town)
  description = "AWS region to deploy PingTopay"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Environment identifier (staging, production)"
}

variable "domain_name" {
  type        = string
  default     = "app.pingtopay.com"
  description = "Fully qualified domain name for PingTopay SaaS"
}

variable "ecr_repository_url" {
  type        = string
  description = "ECR image repository URL for PingTopay container"
}
`;
