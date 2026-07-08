output "instance_hostname" {
  description = "Public DNS name of the EC2 instance."
  value       = aws_instance.app_server.public_dns
}

output "instance_role" {
  description = "ARN of EC2 instance role for S3 access"
  value       = aws_iam_role.sludge_role.arn
}

output "instance_ipv4" {
  description = "EC2 IPv4 address"
  value       = aws_instance.app_server.public_ip
}

output "instance_ipv6" {
  description = "EC2 IPv6 address"
  value       = aws_instance.app_server.ipv6_addresses[0]
}
