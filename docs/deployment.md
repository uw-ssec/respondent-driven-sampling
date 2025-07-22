# Deployment
There are two main workflows for deploying this codebase to Azure. In both cases the end result is having the codebase loaded onto an Azure Web App where it will install packages, build the client code and then run the Node.js server app (in `server/`). The two workflows of deploying the website are through GitHub Actions or manually through Azure's VSCode extension.

## GitHub Actions (Continuous Deployment)
To deploy your Node.js server app (in `server/`) to Azure App Service using GitHub Actions, you need a GitHub Actions workflow file. This workflow will:

1. Trigger on pushes to your main branch.
2. Set up Node.js, install dependencies, run tests (optional), and build (if needed).
3. Deploy to Azure App Service using the Azure Web App Publish action.

**Assumptions:**
- Your Azure App Service is already created.
- You have a publish profile for your Azure Web App (downloadable from the Azure Portal).
- Your GitHub repo is connected to your local project.



### 1. Prepare Azure Credentials

- In the Azure Portal, go to your App Service > "Downloan publish profile" and download it.
- In your GitHub repo, go to **Settings > Secrets and variables > Actions > New repository secret**.
- Add a new secret named `AZURE_WEBAPP_PUBLISH_PROFILE` and paste the contents of the downloaded publish profile XML.



### 2. Create the GitHub Actions Workflow

Create a file at `.github/workflows/azure-webapp-deploy.yml` in your repo root with the following content:

```yaml
name: Deploy Node.js server to Azure Web App

on:
  push:
    branches:
      - main  # or your default branch

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18' # or your required version

      - name: Install dependencies
        run: |
          cd server
          npm ci

      # Optional: Run tests
      # - name: Run tests
      #   run: |
      #     cd server
      #     npm test

      # Optional: Build step if you have a build process
      # - name: Build
      #   run: |
      #     cd server
      #     npm run build

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: <YOUR_AZURE_WEBAPP_NAME>
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./server
```

**Replace `<YOUR_AZURE_WEBAPP_NAME>` with your actual Azure Web App name.**

### 3. Commit and Push

- Commit this workflow file and push to your main branch.
- On push, the workflow will run and deploy your server app to Azure.

## VSCode Extension (Manual)
If you are looking to test a deployment without having to push to the main branch this workflow will be useful. This workflow will:

1. Only trigger on manual deployments via VSCode.
2. Set up Node.js, install dependencies, run tests (optional), and build (if needed).
3. Deploy to Azure App Service using the Azure Web App Publish action.

### 1. Preliminary
1. Install Azure App Services extension in VSCode.
2. Navigate to the Azure tab (left side panel) and sign into your Azure account with subscription.
3. In the Azure tab expand the subscription (rob5 main)  and then App Services
### 2. (Optional) Create a new App Service 
If you don't have a App Service to deploy to or want to create a new one follow this step.
  1. Right clicking App Service and selecting “Create New Web App…”
  2. Select “West US” location
  3. Give a name for the App Service
  4. Select Node 22 LTS as Runstack
  5. Select Pricing Tier
### 3. Deploy and Visit Web App

1. Delete any `node_module/` folders.
    - These folders take up a lot of space and will already be reinstalled on the server so this will save time when deploying
2. In App Services right click the App Service to deploy to, and click “Deploy to Web App”
    - An output will open that shows the steps being taken to deploy the app (zip codebase and building the app)
3. Visit your Web App
    - Once the deployment finished a pop-up should appear in VSCode that will link you to your Web App. Otherwise you can log onto the Azure website and navigate to the App Service to find the Web App's link.