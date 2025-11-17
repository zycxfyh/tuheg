terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket         = "creation-ring-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "creation-ring-terraform-locks"
  }

  required_version = ">= 1.5.0"
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Creation Ring"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config"
  }
}

# VPC配置
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  private_subnets    = var.private_subnets
  public_subnets     = var.public_subnets
  database_subnets   = var.database_subnets
}

# EKS集群
module "eks" {
  source = "./modules/eks"

  environment       = var.environment
  cluster_name      = var.cluster_name
  vpc_id           = module.vpc.vpc_id
  private_subnets  = module.vpc.private_subnets
  node_groups      = var.node_groups

  depends_on = [module.vpc]
}

# RDS PostgreSQL数据库
module "rds" {
  source = "./modules/rds"

  environment         = var.environment
  vpc_id             = module.vpc.vpc_id
  database_subnets   = module.vpc.database_subnets
  allowed_cidr_blocks = [module.vpc.vpc_cidr_block]

  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password

  depends_on = [module.vpc]
}

# ElastiCache Redis
module "elasticache" {
  source = "./modules/elasticache"

  environment         = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnets    = module.vpc.private_subnets
  allowed_cidr_blocks = [module.vpc.vpc_cidr_block]

  depends_on = [module.vpc]
}

# S3存储桶
module "s3" {
  source = "./modules/s3"

  environment = var.environment
  bucket_name = var.s3_bucket_name
}

# CloudFront CDN
module "cloudfront" {
  source = "./modules/cloudfront"

  environment = var.environment
  bucket_name = module.s3.bucket_name
  bucket_arn  = module.s3.bucket_arn
}

# Route 53 DNS
module "route53" {
  source = "./modules/route53"

  environment = var.environment
  domain_name = var.domain_name
  cloudfront_distribution_id = module.cloudfront.distribution_id
}

# WAF防护
module "waf" {
  source = "./modules/waf"

  environment = var.environment
  cloudfront_distribution_id = module.cloudfront.distribution_id
}

# 监控和日志
module "monitoring" {
  source = "./modules/monitoring"

  environment = var.environment
  cluster_name = module.eks.cluster_name
  vpc_id      = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets

  depends_on = [module.eks, module.vpc]
}

# 输出
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.database_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.redis_endpoint
  sensitive   = true
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}
