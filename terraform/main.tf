# Configuration Blocks
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm" # Azure Resource Manager provider source
      version = "~> 4.33.0" # Provider version constraint
    }
  }
}

provider "azurerm" {
  features {} # Required empty features block for the Azure provider
  subscription_id = var.subscription_id
}

# Resource Group
## Creates a logical container for all Azure resources in this deployment.
resource "azurerm_resource_group" "rds_resource_group" {
  name     = var.resource_group_name # Name from variables
  location = var.location # Azure region from variables
}

# Cosmos DB Account
## Creates a Cosmos DB account with MongoDB API
resource "azurerm_cosmosdb_account" "rds_cosmos_db" {
  name                = var.cosmos_db_account_name
  location            = azurerm_resource_group.rds_resource_group.location
  resource_group_name = azurerm_resource_group.rds_resource_group.name
  offer_type          = var.cosmos_db_offer_type
  kind                = "MongoDB"

  capabilities {
    name = "EnableMongo"
  }

  consistency_policy {
    consistency_level = var.cosmos_db_consistency_level
  }

  geo_location {
    location          = azurerm_resource_group.rds_resource_group.location
    failover_priority = 0
  }
}

# Cosmos DB MongoDB Database
## Creates a database within the Cosmos DB account
resource "azurerm_cosmosdb_mongo_database" "rds_mongo_db" {
  name                = var.cosmos_db_database_name
  resource_group_name = azurerm_cosmosdb_account.rds_cosmos_db.resource_group_name
  account_name        = azurerm_cosmosdb_account.rds_cosmos_db.name
}

# App Service Plan
## Defines the compute resources for running the application.
resource "azurerm_service_plan" "rds_service_plan" {
  # Defines the hosting plan for the web application
  # Uses Linux as the operating system
  # Pricing tier specified by sku_name variable
  name                = var.app_service_plan_name
  resource_group_name = azurerm_resource_group.rds_resource_group.name
  location           = azurerm_resource_group.rds_resource_group.location
  os_type            = "Linux"
  sku_name           = var.sku_name
}

# App Service for Web Application
## Deploys the Node.js application to Azure App Service with secure references to secrets.
resource "azurerm_linux_web_app" "rds_web_app" {
  name                = var.app_service_name
  resource_group_name = azurerm_resource_group.rds_resource_group.name
  location           = azurerm_resource_group.rds_resource_group.location
  service_plan_id    = azurerm_service_plan.rds_service_plan.id

  # Configures Node version, always-on setting
  site_config {
    application_stack {
      node_version = var.node_version
    }
    always_on = true
  }

  # App settings include:
  # - Node.js configuration
  # - References to environment variables
  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION" = var.node_version
    "NODE_ENV"                     = var.node_env
    "PORT"                         = "8080"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
    
    # Environment Variables
    "MONGO_URI"                   = azurerm_cosmosdb_account.rds_cosmos_db.primary_mongodb_connection_string
    "TWILIO_ACCOUNT_SID"          = var.twilio_account_sid
    "TWILIO_AUTH_TOKEN"           = var.twilio_auth_token
    "TWILIO_VERIFY_SID"           = var.twilio_verify_sid
  }
}

# Output the App Service URL
output "app_service_url" {
  value = "https://${azurerm_linux_web_app.rds_web_app.default_hostname}"
}

# Output the Cosmos DB connection string
output "cosmos_db_connection_string" {
  value     = azurerm_cosmosdb_account.rds_cosmos_db.primary_mongodb_connection_string
  sensitive = true
} 