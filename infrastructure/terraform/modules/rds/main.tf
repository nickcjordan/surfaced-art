# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  # Allow PostgreSQL from Lambda security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.lambda_sg_id]
    description     = "PostgreSQL from Lambda"
  }

  # No egress rules - RDS never initiates outbound connections
  # AWS SGs default to deny all when no egress rules are defined in Terraform

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-sg"
  }
}

# DB subnet group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet"
  }
}

# RDS PostgreSQL instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}-db"

  # Engine configuration
  engine               = "postgres"
  engine_version       = "16.3"
  instance_class       = var.instance_class
  allocated_storage    = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  storage_encrypted    = true

  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # trivy:ignore:AVD-AWS-0176 - IAM DB auth requires app-level changes, deferred to Phase 3
  # trivy:ignore:AVD-AWS-0177 - Deletion protection is conditionally enabled for prod (line below)
  iam_database_authentication_enabled = false

  # Backup and maintenance
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Performance Insights (free tier)
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  # Other settings
  skip_final_snapshot     = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-${var.environment}-final-snapshot" : null
  deletion_protection     = var.environment == "prod" #trivy:ignore:AVD-AWS-0177 - enabled conditionally for prod
  copy_tags_to_snapshot   = true
  auto_minor_version_upgrade = true

  tags = {
    Name = "${var.project_name}-${var.environment}-db"
  }
}
