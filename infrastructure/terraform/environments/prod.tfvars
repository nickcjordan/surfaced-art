environment    = "prod"
project_name   = "surfaced-art"
aws_region     = "us-east-1"

# Database - can upgrade later
db_instance_class = "db.t3.micro"

# Lambda
lambda_memory_size = 256
lambda_timeout     = 30

# Seed
seed_mode = "real"

# URLs
frontend_url = "https://surfacedart.com"
additional_cors_origins = [
  "https://surfaced.art",
  "https://www.surfaced.art",
]

# S3 CORS
cors_allowed_origins = [
  "https://surfacedart.com",
  "https://www.surfacedart.com",
  "https://surfaced.art",
  "https://www.surfaced.art",
  "http://localhost:3000",
]
