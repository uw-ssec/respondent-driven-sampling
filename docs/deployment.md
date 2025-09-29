# Deployment

There are two main workflows for deploying this codebase to Azure. In both cases
the end result is having the codebase loaded onto an Azure Web App where it will
install packages, build the client code and then run the Node.js server app (in
`server/`). The two workflows of deploying the website are through GitHub
Actions or manually through Azure's VSCode extension.

## GitHub Actions (Continuous Deployment)

To set up a monolithic deployment of your React (client) and Node/Express
(server) app on Azure using GitHub Actions, you want a workflow that:

- Trigger on pushes to your `main` branch.
- Builds the React app inside the client folder.
- Copies the React `dist` output into the server folder (assuming you serve
  React static files from Node).
- Installs server dependencies.
- Deploys the entire server folder (including the React dist) to Azure App
  Service as a single app.

Here’s an example GitHub Actions workflow YAML that you can adapt. This assumes
your repo has the `client` and `server` folders at the root, and the server
serves the React build from `server/dist`. Create a file at
`.github/workflows/azure-webapp-deploy.yml` in your repo root with the following
content:

```yaml
name: Build and Deploy Monolithic React + Node app to Azure

on:
  push:
    branches:
      - main # or your deployment branch

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      # Checkout the repo
      - uses: actions/checkout@v3

      # Setup Node.js (adjust version as needed)
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "22"

      # Install client dependencies and build React app
      - name: Build React client
        run: |
          cd client
          npm install
          npm run build

      # Copy React dist into server folder
      - name: Copy React dist to server build folder
        run: |
          rm -rf server/dist
          cp -r client/dist server/dist

      # Install server dependencies
      - name: Install server dependencies
        run: |
          cd server
          npm install

      # Deploy to Azure App Service using Azure/webapps-deploy action
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: <YOUR_AZURE_WEBAPP_NAME> # Replace with your Azure App Service name
          slot-name: "Production"
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
          package: ./server
```

### Prepare Azure Credentials

- Replace <YOUR_AZURE_WEBAPP_NAME> with the exact name of your Azure App
  Service.
- In the Azure Portal, go to your App Service > "Downloan publish profile" and
  download it.
- In your GitHub repo, go to **Settings > Secrets and variables > Actions > New
  repository secret**.
- Add a new secret named `AZURE_WEBAPP_PUBLISH_PROFILE` and paste the contents
  of the downloaded publish profile XML.

This automation builds your React client, integrates it into the Node backend,
and deploys the entire monolithic app to Azure seamlessly on every code push to
the `main` branch.

### 3. Commit and Push

- Commit this workflow file and push to your main branch.
- On push, the workflow will run and deploy your server app to Azure.

## Manual Test Deployment through VSCode

If you are looking to test a deployment without having to push to the main
branch this workflow will be useful. This workflow will:

1. Only trigger on manual deployments via VSCode.
2. Set up Node.js, install dependencies, run tests (optional), and build (if
   needed).
3. Deploy to Azure App Service using the Azure Web App Publish action.

### 1. Preliminary

1. Install Azure App Services extension in VSCode.
2. Navigate to the Azure tab (left side panel) and sign into your Azure account
   with subscription.
3. In the Azure tab expand the subscription (rob5 main) and then App Services

### 2. (Optional) Create a new App Service

If you don't have a App Service to deploy to or want to create a new one follow
this step.

1. Right clicking App Service and selecting “Create New Web App…”
2. Select “West US” location
3. Give a name for the App Service
4. Select Node 22 LTS as Runstack
5. Select Pricing Tier

### 3. Deploying your App

1. Delete the `node_modules` folder in `server`.
   - These folders take up a lot of space and will already be reinstalled on the
     server so this will save time when deploying
2. From the parent directory, run:

   ```
   npm run build

   ```

   This will generate a `dist` folder in the `client` folder. Copy and paste
   this folder into the `server` folder.

3. In App Services right click the App Service to deploy to, and click “Deploy
   to Web App”
   - An output will open that shows the steps being taken to deploy the app (zip
     codebase and building the app)
   - This will deploy the `server` code to the Azure App Service. Check out
     `.vscode/settings.json` to understand how VSCode knows which folder to
     deploy.
4. Visit your Web App
   - Once the deployment finished a pop-up should appear in VSCode that will
     link you to your Web App. Otherwise you can log onto the Azure website and
     navigate to the App Service to find the Web App's link.
