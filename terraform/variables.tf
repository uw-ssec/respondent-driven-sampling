variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region where resources will be created"
  type        = string
}

variable "app_service_plan_name" {
  description = "Name of the App Service Plan"
  type        = string
}

variable "app_service_name" {
  description = "Name of the App Service"
  type        = string
}

variable "node_version" {
  description = "Node.js version to use"
  type        = string
}

variable "sku_name" {
  description = "SKU name for the App Service Plan"
  type        = string
}

variable "node_env" {
  description = "Node environment"
  type        = string
}

# Cosmos DB Configuration
variable "cosmos_db_account_name" {
  description = "Name of the Cosmos DB account"
  type        = string
}

variable "cosmos_db_database_name" {
  description = "Name of the Cosmos DB database"
  type        = string
}

variable "cosmos_db_consistency_level" {
  description = "Consistency level for Cosmos DB"
  type        = string
}

variable "cosmos_db_offer_type" {
  description = "Offer type for Cosmos DB"
  type        = string
}

variable "twilio_account_sid" {
  description = "Twilio Account SID"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token"
  type        = string
  sensitive   = true
}

variable "twilio_verify_sid" {
  description = "Twilio Verify Service SID"
  type        = string
  sensitive   = true
}
