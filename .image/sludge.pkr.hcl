variable "ami_prefix" {
  type    = string
  default = "sludge-server"
}

variable "s3_bucket" {
  type    = string
  description = "The S3 bucket where database backups and app versions are stored."
}

variable "webmaster_email" {
  type    = string
  description = "Webmaster email to be registered against the certbot cert."
}

variable "db_master_username" {
  type    = string
  description = "Username for the user that creates the main DB."
}

variable "db_master_password" {
  type    = string
  description = "Password for the user that creates the main DB."
}

variable "db_app_username" {
  type    = string
  description = "Username for the app DB user."
}

variable "db_app_password" {
  type    = string
  description = "Password for the app DB user."
}

locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}

packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "${var.ami_prefix}-${local.timestamp}"
  instance_type = "t4g.nano"
  iam_instance_profile = "sludge_profile"
  region        = "us-east-1"
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-noble-24.04-arm64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }
  ssh_username = "ubuntu"
}

build {
  name = "sludge-server"
  sources = [
    "source.amazon-ebs.ubuntu"
  ]

  provisioner "shell" {
    inline_shebang = "/bin/bash -e"
    environment_vars = ["NEEDRESTART_SUSPEND=true","DEBIAN_FRONTEND=noninteractive"]
    inline = [
      "echo Install Node",
      "echo 'debconf debconf/frontend select Noninteractive' | sudo debconf-set-selections",
      "sudo apt-get install -y -qq unzip",
      "curl -fsSL https://fnm.vercel.app/install | bash",
      "export PATH=\"/home/ubuntu/.local/share/fnm:$PATH\"",
      "eval \"$(fnm env --use-on-cd --shell bash)\"",
      "fnm install v20.12.2",
      "node --version",
    ]
  }

  provisioner "shell" {
    environment_vars = ["NEEDRESTART_SUSPEND=true","DEBIAN_FRONTEND=noninteractive"]
    inline = [
      "echo Installing AWS CLI",
      "sudo snap install aws-cli --classic",
      "aws configure set credential_source Ec2InstanceMetadata",
      "aws configure set region us-east-1",
      "aws configure set default.s3.use_dualstack_endpoint true",
      "aws s3 ls s3://${var.s3_bucket}/",
    ]
  }

  provisioner "shell" {
    environment_vars = ["NEEDRESTART_SUSPEND=true","DEBIAN_FRONTEND=noninteractive"]
    inline = [
      "echo Install PostgreSQL",
      "echo 'debconf debconf/frontend select Noninteractive' | sudo debconf-set-selections",
      "sudo apt-get install -y -qq postgresql-16",
    ]
  }

  provisioner "file" {
    sources     = ["files/backup_db.sh","files/restore_db.sh"]
    destination = "/home/ubuntu/"
  }

  provisioner "shell" {
    environment_vars = ["NEEDRESTART_SUSPEND=true","DEBIAN_FRONTEND=noninteractive"]
    inline = [
      "echo Restore DB from backup",
      "sudo -u postgres psql -c \"create user ${var.db_master_username} with superuser password '${var.db_master_password}' createdb\"",
      "sudo -u postgres psql -c \"create user ${var.db_app_username} with password '${var.db_app_password}'\"",
      "chmod +x /home/ubuntu/restore_db.sh",
      "export sludge_db_master_username=${var.db_master_username}",
      "export sludge_db_master_password=${var.db_master_username}",
      "export sludge_s3_bucket=${var.s3_bucket}",
      "./restore_db.sh",
    ]
  }

  provisioner "file" {
    content     = replace(<<-EOF
      #!/bin/bash
      if [ ! -d "/etc/letsencrypt/live/sludge.gumbl.es" ]; then
        sudo certbot --nginx -n --agree-tos -d sludge.gumbl.es -m ${var.webmaster_email}
      fi
    EOF
    ,"\r","")
    destination = "/home/ubuntu/setup_cert.sh"
  }

  provisioner "file" {
    content      = replace(<<-EOF
      sludge_db_app_username=${var.db_app_username}
      sludge_db_app_password=${var.db_app_password}
      sludge_s3_bucket=${var.s3_bucket}
      0 13 * * * /home/ubuntu/backup_db.sh
    EOF
    ,"\r","")
    destination = "/tmp/backup_crontab"
  }

  provisioner "shell" {
    environment_vars = ["NEEDRESTART_SUSPEND=true","DEBIAN_FRONTEND=noninteractive"]
    inline = [
      "echo Setup cron jobs",
      "chmod +x /home/ubuntu/setup_cert.sh",
      "chmod +x /home/ubuntu/backup_db.sh",
      "crontab /tmp/backup_crontab",
    ]
  }

  provisioner "file" {
    source      = "files/certbot.service"
    destination = "/tmp/"
  }

  provisioner "file" {
    content     = templatefile("files/sludge.service.pkrtpl.hcl", {
      username = var.db_app_username
      password = var.db_app_password
    })
    destination = "/tmp/sludge.service"
  }

  provisioner "shell" {
    environment_vars = ["NEEDRESTART_SUSPEND=true","DEBIAN_FRONTEND=noninteractive"]
    inline = [
      "echo Deploy and start app",
      "sudo cp /tmp/*.service /etc/systemd/system",
      "aws s3 cp s3://${var.s3_bucket}/sludge.tar.xz /tmp",
      "sudo tar -C /var -xJf /tmp/sludge.tar.xz",
      "sudo systemctl enable sludge certbot",
    ]
  }

  provisioner "file" {
    source      = "files/nginx.conf"
    destination = "/tmp/"
  }

  provisioner "shell" {
    environment_vars = ["NEEDRESTART_SUSPEND=true","DEBIAN_FRONTEND=noninteractive"]
    inline = [
      "echo Install and start nginx",
      "echo 'debconf debconf/frontend select Noninteractive' | sudo debconf-set-selections",
      "sudo apt-get install -y -qq nginx",
      "sudo cp /tmp/nginx.conf /etc/nginx/sites-available/sludge.gumbl.es",
      "sudo ln -s /etc/nginx/sites-available/sludge.gumbl.es /etc/nginx/sites-enabled/",
      "sudo rm -rf /etc/nginx/sites-available/default",
      "sudo rm /etc/nginx/sites-enabled/default",
      "sudo nginx -t",
      "sudo systemctl enable --now nginx",
    ]
  }

  provisioner "shell" {
    environment_vars = ["NEEDRESTART_SUSPEND=true","DEBIAN_FRONTEND=noninteractive"]
    inline = [
      "echo Install certbot",
      "sudo snap install --classic certbot",
    ]
  }
}