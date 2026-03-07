environment    = "dev"
project_name   = "surfaced-art"
aws_region     = "us-east-1"

# Database
db_instance_class = "db.t3.micro"

# Lambda
lambda_memory_size         = 256
lambda_timeout             = 30
api_reserved_concurrency   = 10

# URLs
frontend_url = "https://dev.surfacedart.com"

# Seed
seed_mode = "demo"

# Cache
cache_disabled = true
