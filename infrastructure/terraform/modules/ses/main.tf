# SES Domain Identity
resource "aws_ses_domain_identity" "main" {
  domain = var.domain
}

# SES Domain DKIM
resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# SES Domain Mail From
resource "aws_ses_domain_mail_from" "main" {
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = "mail.${var.domain}"
}

# Configuration set for tracking
resource "aws_ses_configuration_set" "main" {
  name = "${var.project_name}-${var.environment}"

  reputation_metrics_enabled = true
  sending_enabled            = true

  delivery_options {
    tls_policy = "Require"
  }
}

# Email template for transactional emails (example - order confirmation)
resource "aws_ses_template" "order_confirmation" {
  name    = "${var.project_name}-${var.environment}-order-confirmation"
  subject = "Order Confirmation - {{orderNumber}}"
  html    = <<EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #111;">Thank you for your order</h1>
    <p>Order #{{orderNumber}} has been confirmed.</p>
    <p>We'll send you another email when your order ships.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #666; font-size: 14px;">Surfaced Art</p>
  </div>
</body>
</html>
EOF
  text    = <<EOF
Thank you for your order

Order #{{orderNumber}} has been confirmed.

We'll send you another email when your order ships.

---
Surfaced Art
EOF
}
