provider "aws" {
  region = "us-east-1"
}

data "aws_ami" "sludge_ami" {
  most_recent = true

  filter {
    name   = "name"
    values = ["sludge-server-*"]
  }

  owners = ["self"]
}

resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key"
  public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCg2kO0JneYZBwdc4xb2nymC+UZ6ltS9KXE09INIMU/IwRmf/KZBd350dgG6hsq/oCdxmOPcqKEzCKntkCv7wc1gSlLj6ZJbyXz4Y7Kf2yFtR7KFC1wxzCjNQBHfaBsd1OUjPIsI9koDMdUrY7H/EqjsMyRv7jOgoAHNkJpuhjRerEzHYcPTJTxOfzh+EMYgtnmJd7obLIPLTpBiAIhY3RBCZU3EaAWUMqV/beV7VNV4cBboBv/3xmkWBhAhB9Em69or/cpMUrGi3DU+C7VBq5pPrLQ3rR5gp4TQH8VjP0ke1GOlzqoKCOusU2xqqqcpyvg8NYEX38QXl7vlR8YlwstauP6fpYnUvXTbL7taOURdHUstAjHf8N1Sq6Uc5b3LXVJKFHQgy/1cNutgQqiHymFGjgg+RlOqOThjDiujvSxq10UyJYp8CR39HgiemL8LxZuRUdldZVAMpvzPeWqUFA6ZoCmrv4lv/1YF7/1FA/VjgThsfOBCDqYQzasrD/wIbs= lukeg@Heavy"
}

resource "aws_instance" "app_server" {
  ami           = data.aws_ami.sludge_ami.id
  instance_type = "t4g.nano"

  iam_instance_profile = aws_iam_instance_profile.sludge_profile.id

  key_name = aws_key_pair.deployer.key_name

  vpc_security_group_ids = [module.vpc.default_security_group_id]
  subnet_id              = module.vpc.public_subnets[0]

  tags = {
    Name = "sludge"
  }
}

resource "aws_cloudwatch_metric_alarm" "instance" {
  count                     = 1
  alarm_name                = "sludge_instance_check_fail"
  alarm_description         = "Instance check has failed"
  alarm_actions             = ["arn:aws:automate:us-east-1:ec2:reboot"]
  metric_name               = "StatusCheckFailed_Instance"
  namespace                 = "AWS/EC2"
  dimensions                = { InstanceId: aws_instance.app_server.id }
  statistic                 = "Maximum"
  period                    = "300"
  evaluation_periods        = "3"
  datapoints_to_alarm       = "3"
  threshold                 = "1"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  tags                      = { "Name": "sludge_instance_check_fail" }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.19.0"

  name = "app-vpc"
  cidr = "10.0.0.0/16"

  azs                                           = ["us-east-1a"]
  private_subnets                               = ["10.0.1.0/24"]
  public_subnets                                = ["10.0.101.0/24"]
  enable_ipv6                                   = true
  map_public_ip_on_launch                       = true
  public_subnet_assign_ipv6_address_on_creation = true
  private_subnet_ipv6_prefixes                  = [0]
  public_subnet_ipv6_prefixes                   = [1]

  enable_dns_hostnames = true
}

#resource "aws_eip" "sludge_eip" {
#  instance = aws_instance.app_server.id
#  domain   = "vpc"
#}

resource "aws_vpc_security_group_ingress_rule" "allow_tls_ipv4" {
  security_group_id = module.vpc.default_security_group_id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
}

resource "aws_vpc_security_group_ingress_rule" "allow_tls_ipv6" {
  security_group_id = module.vpc.default_security_group_id
  cidr_ipv6         = "::/0"
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
}

# resource "aws_vpc_security_group_ingress_rule" "allow_ssh_ipv4" {
#   security_group_id = module.vpc.default_security_group_id
#   cidr_ipv4         = "0.0.0.0/0"
#   from_port         = 22
#   ip_protocol       = "tcp"
#   to_port           = 22
# }

# resource "aws_vpc_security_group_ingress_rule" "allow_ssh_ipv6" {
#   security_group_id = module.vpc.default_security_group_id
#   cidr_ipv6         = "::/0"
#   from_port         = 22
#   ip_protocol       = "tcp"
#   to_port           = 22
# }

resource "aws_vpc_security_group_ingress_rule" "allow_certbot_ipv4" {
  security_group_id = module.vpc.default_security_group_id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "allow_certbot_ipv6" {
  security_group_id = module.vpc.default_security_group_id
  cidr_ipv6         = "::/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
}

resource "aws_vpc_security_group_egress_rule" "allow_all_traffic_ipv4" {
  security_group_id = module.vpc.default_security_group_id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1" # semantically equivalent to all ports
}

resource "aws_vpc_security_group_egress_rule" "allow_all_traffic_ipv6" {
  security_group_id = module.vpc.default_security_group_id
  cidr_ipv6         = "::/0"
  ip_protocol       = "-1" # semantically equivalent to all ports
}

resource "aws_iam_instance_profile" "sludge_profile" {
  name = "sludge_profile"
  role = aws_iam_role.sludge_role.name
}

resource "aws_iam_role" "sludge_role" {
  name = "sludge_role"
  path = "/"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"

      Principal = {
        Service = "ec2.amazonaws.com"
      }

      Action = ["sts:AssumeRole", ]
    }, ]
  })
}

resource "aws_s3_bucket" "sludge_database" {
  bucket_prefix = "sludge-database"
}

resource "aws_iam_role_policy" "sludge_ec2_access" {
  name = "sludge_ec2_access"
  role = aws_iam_role.sludge_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.sludge_database.arn,
          "${aws_s3_bucket.sludge_database.arn}/*",
        ]
      },
    ]
  })
}

resource "aws_route53_record" "sludge_record_ipv4" {
  zone_id = "Z26LI2SYSRVR4H"
  name    = "sludge.gumbl.es"
  type    = "A"
  ttl     = "300"
  records = [aws_instance.app_server.public_ip]
}

resource "aws_route53_record" "sludge_record_ipv6" {
  zone_id = "Z26LI2SYSRVR4H"
  name    = "sludge.gumbl.es"
  type    = "AAAA"
  ttl     = "300"
  records = aws_instance.app_server.ipv6_addresses
}

/* ipv6 attempt
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.19.0"

  name = "example-vpc"

  azs             = ["us-east-1a"]

  enable_ipv6 = true

  public_subnet_ipv6_native = true
  public_subnet_ipv6_prefixes = [0]
  private_subnet_ipv6_native = true
  private_subnet_ipv6_prefixes = [1]

  enable_nat_gateway = true
  single_nat_gateway = true
}
*/