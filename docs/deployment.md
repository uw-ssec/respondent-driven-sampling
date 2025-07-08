To deploy your Node.js server app (in `server/`) to Azure App Service using GitHub Actions, you need a GitHub Actions workflow file. This workflow will:

1. Trigger on pushes to your main branch.
2. Set up Node.js, install dependencies, run tests (optional), and build (if needed).
3. Deploy to Azure App Service using the Azure Web App Publish action.

**Assumptions:**
- Your Azure App Service is already created.
- You have a publish profile for your Azure Web App (downloadable from the Azure Portal).
- Your GitHub repo is connected to your local project.

---

### 1. Prepare Azure Credentials

- In the Azure Portal, go to your App Service > "Downloan publish profile" and download it.
- In your GitHub repo, go to **Settings > Secrets and variables > Actions > New repository secret**.
- Add a new secret named `AZURE_WEBAPP_PUBLISH_PROFILE` and paste the contents of the downloaded publish profile XML.

---

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

---

### 3. Commit and Push

- Commit this workflow file and push to your main branch.
- On push, the workflow will run and deploy your server app to Azure.