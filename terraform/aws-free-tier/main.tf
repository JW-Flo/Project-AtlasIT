module "stackgen_1aba032c-1f54-4119-beb7-f3b71618949c" {
  source              = "./modules/aws_cloudwatch_event_rule_schedule"
  rule_name           = "some_rule_name"
  schedule_expression = "rate(5 minutes)"
  tags                = {}
}

module "stackgen_1c4dba3b-0557-4429-aa10-84ec18828aba" {
  source                                   = "./modules/aws_sns_topic"
  application_failure_feedback_role_arn    = "arn:aws:iam::123456789012:role/sns-application-failure-role"
  application_success_feedback_role_arn    = "arn:aws:iam::123456789012:role/sns-application-success-role"
  application_success_feedback_sample_rate = 100
  content_based_deduplication              = true
  delivery_policy                          = "{\"http\": {\"defaultHealthyRetryPolicy\": {\"minDelayTarget\": 20,\"maxDelayTarget\": 20,\"numRetries\": 3,\"numMaxRetries\": 3,\"backoffFunction\": \"linear\"}}}"
  display_name                             = "MySNSTopic"
  fifo_topic                               = false
  firehose_failure_feedback_role_arn       = "arn:aws:iam::123456789012:role/sns-firehose-failure-role"
  firehose_success_feedback_role_arn       = "arn:aws:iam::123456789012:role/sns-firehose-success-role"
  firehose_success_feedback_sample_rate    = 100
  http_failure_feedback_role_arn           = "arn:aws:iam::123456789012:role/sns-http-failure-role"
  http_success_feedback_role_arn           = "arn:aws:iam::123456789012:role/sns-http-success-role"
  http_success_feedback_sample_rate        = 100
  kms_master_key_id                        = "alias/aws/sns"
  lambda_failure_feedback_role_arn         = "arn:aws:iam::123456789012:role/sns-lambda-failure-role"
  lambda_success_feedback_role_arn         = "arn:aws:iam::123456789012:role/sns-lambda-success-role"
  lambda_success_feedback_sample_rate      = 100
  name                                     = "my-sns-topic"
  signature_version                        = 2
  sqs_failure_feedback_role_arn            = "arn:aws:iam::123456789012:role/sns-sqs-failure-role"
  sqs_success_feedback_role_arn            = "arn:aws:iam::123456789012:role/sns-sqs-success-role"
  sqs_success_feedback_sample_rate         = 100
  tags = {
    Environment = "production"
    Project     = "MyProject"
  }
  tracing_config = "Active"
}

module "stackgen_1dae7281-c729-4c2a-8672-f20f7c9a4aaf" {
  source            = "./modules/aws_cloudwatch_log_group"
  name              = "string"
  retention_in_days = 7
  tags              = {}
}

module "stackgen_2a20b075-d3ab-47be-b123-7db89b7f125f" {
  source            = "./modules/aws_cloudwatch_log_group"
  name              = "string"
  retention_in_days = 7
  tags              = {}
}

module "stackgen_30cc1788-4aa4-5ee4-8884-99df720b96d5" {
  source                = "./modules/aws_lambda"
  environment_variables = {}
  function_name         = "stackgen_a9a728-function"
  handler               = "main.lambda_handler"
  role                  = module.stackgen_c9bc319b-dce3-54b7-bc27-813339c08fa1.arn
  runtime               = "python3.8"
  tags                  = null
}

module "stackgen_33466795-fa17-4983-aff1-efd9c481115f" {
  source              = "./modules/aws_cloudwatch_event_rule_schedule"
  rule_name           = "some_rule_name"
  schedule_expression = "rate(5 minutes)"
  tags                = {}
}

module "stackgen_3c62a4e0-86f1-4999-a4ea-3462cdfc028c" {
  source              = "./modules/aws_kms"
  alias               = "alias/my-key"
  description         = "My KMS key"
  enable_key_rotation = false
  tags                = {}
}

module "stackgen_48163e41-6589-40ab-927c-ae2b070b83c2" {
  source                       = "./modules/aws_s3"
  block_public_access          = true
  bucket_name                  = "example-bucket"
  enable_versioning            = true
  enable_website_configuration = true
  sse_algorithm                = "aws:kms"
  tags                         = {}
  website_error_document       = "error.html"
  website_index_document       = "index.html"
}

module "stackgen_4fa42bd7-68e7-509c-be33-74b02f9bf514" {
  source            = "./modules/aws_cloudwatch_log_group"
  retention_in_days = "1"
  tags              = {}
}

module "stackgen_5147aefd-2a76-4ee5-883b-c0fa4aba75ce" {
  source                                 = "./modules/aws_secretsmanager"
  policy_actions                         = ["CONFIG_MAP"]
  policy_principal_types                 = "CONFIG_MAP"
  region                                 = var.region
  secret_encryption_use_custom_kms_key   = true
  secretsmanager_recovery_window_in_days = 30
  secretsmanager_secret_name             = "CONFIG_MAP"
  secretsmanager_secret_string           = "CONFIG_MAP"
  secretsmanager_version_stages          = ["CONFIG_MAP"]
  tags                                   = {}
}

module "stackgen_520a74c0-0b20-4ff5-8b48-3b1209f4e3b1" {
  source              = "./modules/aws_cloudwatch_event_rule_schedule"
  rule_name           = "some_rule_name"
  schedule_expression = "rate(5 minutes)"
  tags                = {}
}

module "stackgen_65fd881c-c986-468b-bf15-e010f266a093" {
  source = "./modules/aws_iam_access_key"
  user   = module.stackgen_872f7643-1b97-498d-9d99-6918a6cc366e.name
}

module "stackgen_66340313-cb7e-47f8-b0c6-1ab1bb8bfb2a" {
  source                       = "./modules/aws_s3"
  block_public_access          = true
  bucket_name                  = "BUCKET_NAME"
  enable_versioning            = true
  enable_website_configuration = true
  sse_algorithm                = "aws:kms"
  tags                         = null
  website_error_document       = "ERROR.html"
  website_index_document       = "index.html"
}

module "stackgen_83bfc2ac-0bb5-4eb5-bddc-d9d393e688a4" {
  source                    = "./modules/data_aws_iam_policy_document"
  override_json             = null
  override_policy_documents = null
  policy_id                 = null
  source_json               = null
  source_policy_documents   = null
  statement                 = []
}

module "stackgen_87070787-c6a4-5a88-a7b0-60b77a205a99" {
  source                = "./modules/aws_lambda"
  architecture          = "x86_64"
  authorization_type    = "NONE"
  cors                  = []
  create_function_url   = false
  description           = null
  environment_variables = {}
  event_source_arn      = null
  event_source_mapping  = []
  filename              = null
  function_name         = "stackgen_eeae5a-function"
  handler               = "main.lambda_handler"
  image_uri             = null
  log_format            = null
  log_group_name        = module.stackgen_a1ab2b56-df3f-5bce-bc79-4f2516031961.name
  memory_size           = 128
  role                  = module.stackgen_93411321-9fc0-56a1-9337-50db1b5fbc08.arn
  runtime               = "python3.8"
  s3_bucket             = null
  s3_key                = null
  s3_object_version     = null
  system_log_level      = null
  tags                  = null
  timeout               = 3
}

module "stackgen_872f7643-1b97-498d-9d99-6918a6cc366e" {
  source = "./modules/aws_iam_user"
  name   = "user_name"
  tags   = {}
}

module "stackgen_8caeaa4b-ffbf-4b71-b5a5-4bd1ca5e4e15" {
  source             = "./modules/aws_iam_role"
  assume_role_policy = "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":\"arn:aws:iam::123456789012:root\"},\"Action\":\"sts:AssumeRole\"}]}"
  tags               = {}
}

module "stackgen_93411321-9fc0-56a1-9337-50db1b5fbc08" {
  source                = "./modules/aws_iam_role"
  assume_role_policy    = "{\n\t\t\"Version\": \"2012-10-17\",\n\t\t\"Statement\":{\n\t\t\t\t\"Action\": \"sts:AssumeRole\",\n\t\t\t\t\"Effect\": \"Allow\",\n\t\t\t\t\"Principal\": {\n\t\t\t\t\t\"Service\": \"lambda.amazonaws.com\"\n\t\t\t\t}\n\t\t\t}\n\t}"
  description           = null
  force_detach_policies = true
  inline_policy         = []
  max_session_duration  = null
  name                  = "stackgen_eeae5a-role"
  path                  = null
  permissions_boundary  = null
  tags                  = null
}

module "stackgen_a1ab2b56-df3f-5bce-bc79-4f2516031961" {
  source            = "./modules/aws_cloudwatch_log_group"
  name              = "/aws/lambda/stackgen_eeae5a-function"
  retention_in_days = "7"
  tags              = {}
}

module "stackgen_a81fe4b3-1b4e-4369-8e54-424711385054" {
  source    = "./modules/aws_iam_role_policy"
  name      = "Writer-stackgen_599f35"
  policy    = "{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"CloudwatchLogGroup4fa42bd768e7509cbe3374b02f9bf5140\",\n      \"Action\": [\n        \"logs:CreateLogGroup\"\n      ],\n      \"Effect\": \"Allow\",\n      \"Resource\": [\n        \"${module.stackgen_4fa42bd7-68e7-509c-be33-74b02f9bf514.arn}\"\n      ]\n    },\n    {\n      \"Sid\": \"CloudwatchLogGroup4fa42bd768e7509cbe3374b02f9bf5141\",\n      \"Action\": [\n        \"logs:CreateLogStream\",\n        \"logs:PutLogEvents\"\n      ],\n      \"Effect\": \"Allow\",\n      \"Resource\": [\n        \"${module.stackgen_4fa42bd7-68e7-509c-be33-74b02f9bf514.arn}:*\"\n      ]\n    }\n  ]\n}"
  role      = module.stackgen_c9bc319b-dce3-54b7-bc27-813339c08fa1.name
  role_type = "Writer"
}

module "stackgen_aadad7fa-415d-47d5-a6d5-779972a0f468" {
  source    = "./modules/aws_sns_topic_subscription"
  endpoint  = "CONFIG_MAP"
  protocol  = "sqs"
  topic_arn = module.stackgen_1c4dba3b-0557-4429-aa10-84ec18828aba.arn
}

module "stackgen_c9bc319b-dce3-54b7-bc27-813339c08fa1" {
  source                = "./modules/aws_iam_role"
  assume_role_policy    = "{\n\t\t\"Version\": \"2012-10-17\",\n\t\t\"Statement\":[{\n\t\t\t\t\"Action\": \"sts:AssumeRole\",\n\t\t\t\t\"Effect\": \"Allow\",\n\t\t\t\t\"Principal\": {\n\t\t\t\t\t\"Service\": \"lambda.amazonaws.com\"\n\t\t\t\t}\n\t\t\t}]\n\t}"
  description           = null
  force_detach_policies = true
  inline_policy         = []
  max_session_duration  = null
  name                  = "stackgen_a9a728-role"
  path                  = null
  permissions_boundary  = null
  tags                  = null
}

module "stackgen_d3204feb-a396-4eae-9cfd-abec5b2b4787" {
  source = "./modules/aws_dynamodb"
  attribute = [{
    name = "string"
    type = "string"
  }]
  billing_mode                   = "PROVISIONED"
  hash_key                       = "string"
  point_in_time_recovery_enabled = true
  server_side_encryption_enabled = true
  table_name                     = "string"
  tags                           = null
}

module "stackgen_d6cedecf-c394-4bd8-bb53-2796c4d39467" {
  source    = "./modules/aws_iam_role_policy"
  name      = "Writer-stackgen_ba2088"
  policy    = "{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"CloudwatchLogGroupa1ab2b56df3f5bcebc794f25160319610\",\n      \"Action\": [\n        \"logs:CreateLogGroup\"\n      ],\n      \"Effect\": \"Allow\",\n      \"Resource\": [\n        \"${module.stackgen_a1ab2b56-df3f-5bce-bc79-4f2516031961.arn}\"\n      ]\n    },\n    {\n      \"Sid\": \"CloudwatchLogGroupa1ab2b56df3f5bcebc794f25160319611\",\n      \"Action\": [\n        \"logs:CreateLogStream\",\n        \"logs:PutLogEvents\"\n      ],\n      \"Effect\": \"Allow\",\n      \"Resource\": [\n        \"${module.stackgen_a1ab2b56-df3f-5bce-bc79-4f2516031961.arn}:*\"\n      ]\n    }\n  ]\n}"
  role      = module.stackgen_93411321-9fc0-56a1-9337-50db1b5fbc08.name
  role_type = "Writer"
}

module "stackgen_dbe041f9-f336-4bfb-9b31-2a796befdb18" {
  source                                 = "./modules/aws_secretsmanager"
  policy_actions                         = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
  policy_principal_types                 = "arn:aws:iam::123456789012:user/example-user"
  region                                 = var.region
  secret_encryption_use_custom_kms_key   = true
  secretsmanager_recovery_window_in_days = 30
  secretsmanager_secret_name             = "my-secret"
  secretsmanager_secret_string           = "{\"username\": \"myuser\", \"password\": \"mypassword\"}"
  secretsmanager_version_stages          = ["AWSCURRENT"]
  tags                                   = {}
}

module "stackgen_ea4b24a2-c63c-404e-bfa1-66ba662448ec" {
  source             = "./modules/aws_iam_role"
  assume_role_policy = "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":\"arn:aws:iam::123456789012:root\"},\"Action\":\"sts:AssumeRole\"}]}"
  tags               = {}
}

