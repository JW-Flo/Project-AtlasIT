# OIDC trust and role to be assumed by Cloudflare Workers (or external OIDC identities)

resource "aws_iam_role" "atlasit_hybrid_role" {
  name = "atlasit-hybrid-${var.env}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Federated = var.oidc_provider_arn },
      Action = "sts:AssumeRoleWithWebIdentity",
      Condition = {
        StringEquals = {
          # aud claim usually sts.amazonaws.com; customize if needed
          # "<issuer>:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          # Subject scoping by convention
          # "<issuer>:sub" = var.oidc_subject_pattern
        }
      }
    }]
  })
}
