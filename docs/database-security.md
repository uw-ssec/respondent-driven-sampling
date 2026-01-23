# Database Security

This document describes how to configure network security for the Azure Cosmos DB for MongoDB database to restrict access to authorized sources only.

## Overview

By default, anyone with the database connection string can access the database from anywhere. To improve security, we use Azure Cosmos DB's built-in firewall to restrict access to:

1. **Azure App Service** — The production application
2. **Whitelisted IP addresses** — Developers who need to run local scripts

## Configuring the Cosmos DB Firewall

### 1. Open Networking Settings

1. Log in to the [Azure Portal](https://portal.azure.com)
2. Navigate to your Cosmos DB account (e.g., `rds-db-kc`)
3. In the left sidebar, go to **Settings** → **Networking**

### 2. Configure Public Network Access

1. Under **Public network access**, select **Selected networks**
2. This disables open access and enables the firewall

### 3. Allow Azure Services

1. Check the box for **"Accept connections from within public Azure datacenters"**
2. This allows your Azure App Service to connect to the database
3. Note: This allows any Azure service to connect, not just yours. For stricter security, see [Private Endpoints](#advanced-private-endpoints) below.

### 4. Add Developer IP Addresses

For each developer who needs to run local scripts (e.g., `npm run super-admin`, `npm run locations`):

1. Under **Firewall**, click **"Add my current IP"** or manually enter the IP address
2. Click **Save**

To find your public IP address:

```bash
curl ifconfig.me
```

### 5. Save Changes

Click **Save** at the top of the page. Changes may take a few minutes to propagate.

## Running Local Scripts

Scripts in `server/src/scripts/` require database access:

- `superAdminCRUD.ts` — Manage super admin users
- `locationCRUD.ts` — Manage locations
- `generateSeeds.ts` — Generate seed data
- `generateCoupons.ts` — Generate coupon codes

Before running these scripts locally, ensure your IP address is whitelisted in the Cosmos DB firewall (see step 4 above).

### Troubleshooting Connection Issues

If you see connection timeout errors when running scripts:

1. **Verify your IP is whitelisted:**
   - Run `curl ifconfig.me` to get your current public IP
   - Check that this IP is listed in the Cosmos DB firewall settings

2. **IP address changed:**
   - Home/office IPs can change periodically
   - If you're on a new network (coffee shop, VPN, etc.), your IP will be different
   - Add the new IP to the firewall

3. **Firewall propagation delay:**
   - After adding an IP, wait 1-2 minutes before retrying

## Security Considerations

### What This Protects Against

- **Leaked connection strings** — Even if the `MONGO_URI` is exposed, attackers cannot connect without an allowed IP
- **Unauthorized access** — Only explicitly whitelisted sources can reach the database

### What This Does NOT Protect Against

- **Compromised Azure services** — The "Accept Azure datacenters" option allows any Azure service to connect
- **Compromised developer machines** — If a whitelisted machine is compromised, the attacker has database access

### Best Practices

1. **Minimize whitelisted IPs** — Only add IPs for developers who actively need script access
2. **Review periodically** — Remove IPs for developers who no longer need access
3. **Use environment-specific databases** — Use separate databases for development, staging, and production
4. **Rotate credentials** — Periodically regenerate the Cosmos DB connection string and update the App Service configuration

## Advanced: Private Endpoints

For stricter security requirements (e.g., HIPAA compliance), consider using Azure Private Endpoints:

1. **Private Endpoint** — Creates a private IP for Cosmos DB within your Virtual Network
2. **VNet Integration** — Connect your App Service to the same Virtual Network
3. **Azure VPN** — Developers connect via VPN to access the database

This approach ensures the database is never exposed to the public internet. However, it requires additional Azure resources and configuration complexity.

## Quick Reference

| Task | Action |
|------|--------|
| Allow App Service | Enable "Accept connections from within public Azure datacenters" |
| Allow developer | Add their public IP to the firewall |
| Find your IP | Run `curl ifconfig.me` |
| Remove access | Delete the IP from the firewall |
