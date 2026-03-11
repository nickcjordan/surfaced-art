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
frontend_url = "https://dev.surfaced.art"
additional_cors_origins = [
  "https://dev.surfaced.art",
  "https://www.dev.surfaced.art",
]

# S3 CORS
cors_allowed_origins = [
  "https://dev.surfaced.art",
  "http://localhost:3000",
]

# Seed
seed_mode = "demo"

# Cache
cache_disabled = true
