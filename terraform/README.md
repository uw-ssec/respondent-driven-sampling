# Azure App Service Terraform Configuration

This directory contains Terraform configurations to deploy the Respondent-Driven Sampling application to Azure App Service.

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) installed (version 1.0.0 or later)
2. [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
3. Azure subscription

## Setup

1. Login to Azure:
```bash
az login
```

2. Initialize Terraform:
```bash
terraform init
```

3. Set up environment variables:
   - Copy `terraform.tfvars.example` to `terraform.tfvars`
   - Fill in your actual values in `terraform.tfvars`
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```
   - Edit `terraform.tfvars` with your actual values:
     - MongoDB connection string
     - Twilio credentials
     - Other configuration values

4. Review the planned changes:
```bash
terraform plan -out="tfplan"
```

5. Apply the configuration:
```bash
terraform apply "tfplan"
```

## Configuration

The following variables can be customized in `variables.tf`:

- `resource_group_name`: Name of the Azure resource group
- `location`: Azure region for deployment
- `app_service_plan_name`: Name of the App Service Plan
- `app_service_name`: Name of the App Service
- `node_version`: Node.js version to use
- `sku_name`: SKU name for the App Service Plan

### Environment Variables

The following sensitive environment variables must be set in `terraform.tfvars`:

- `twilio_account_sid`: Twilio Account SID
- `twilio_auth_token`: Twilio Auth Token
- `twilio_verify_sid`: Twilio Verify Service SID

These values will be securely stored in Azure App Service configuration and will not be visible in the Terraform state file.

## Deployment

After applying the Terraform configuration, you can deploy your application using Azure CLI or Azure DevOps pipelines. The App Service URL will be output after successful deployment.

## Cleanup

To destroy all created resources:
```bash
terraform destroy
```

## Security Notes

1. Never commit `terraform.tfvars` to version control
2. Consider using Azure Key Vault for production secrets
3. Consider using Azure DevOps pipeline variables for CI/CD
