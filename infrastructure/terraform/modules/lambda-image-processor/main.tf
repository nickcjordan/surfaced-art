# Lambda function for image processing (container image).
# Triggered by S3 PutObject events on the media bucket. Generates WebP
# variants at 400/800/1200px widths for uploaded JPEG/PNG images.
#
# NOT in a VPC — this Lambda only needs S3 access (no database).

resource "aws_lambda_function" "image_processor" {
  function_name = "${var.project_name}-${var.environment}-image-processor"
  role          = var.lambda_role_arn
  package_type  = "Image"
  memory_size   = var.memory_size
  timeout       = var.timeout

  # Placeholder for initial Terraform apply before the ECR image exists.
  # CI/CD manages actual image deployments via aws lambda update-function-code.
  image_uri = var.placeholder_image_uri

  environment {
    variables = {
      NODE_ENV = var.environment
    }
  }

  # CI/CD manages image deployments; Terraform manages all other configuration.
  lifecycle {
    ignore_changes = [image_uri]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-image-processor"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "image_processor" {
  name              = "/aws/lambda/${aws_lambda_function.image_processor.function_name}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-${var.environment}-image-processor-logs"
  }
}

# Allow S3 to invoke this Lambda function
resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.s3_bucket_arn
}

# S3 bucket notification — trigger Lambda on PutObject for image files
# in the uploads/ prefix. Only .jpg, .jpeg, .png suffixes trigger the
# function; .webp output files do NOT match, preventing infinite loops.
resource "aws_s3_bucket_notification" "image_upload" {
  bucket = var.s3_bucket_name

  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".jpg"
  }

  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".jpeg"
  }

  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".png"
  }

  depends_on = [aws_lambda_permission.s3_invoke]
}
