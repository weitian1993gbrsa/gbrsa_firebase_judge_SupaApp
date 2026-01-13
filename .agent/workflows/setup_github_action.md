---
description: How to setup automatic deployment from GitHub to Firebase
---
This workflow guides you through connecting your local project to GitHub and enabling automatic deployments via Firebase Hosting.

## 1. Initialize Git (If not already done)
If you haven't already pushed your code to GitHub:
1. Create a **New Repository** on GitHub.com (do not initialize with README/License).
2. Run these commands in your terminal:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```

## 2. Setup Firebase GitHub Action
The easiest way is to use the Firebase CLI, which automates the secrets setup.

1. Run the following command:
   ```powershell
   firebase init hosting
   ```
2. When asked features to enable:
   - It may ask to overwrite files. **Say NO** to specific files (index.html), but **YES** to configuration if needed.
   - Crucially, when asked: **"Set up automatic builds and deploys with GitHub?"**, answer **YES (y)**.

3. Log in to GitHub when prompted in the browser.

4. **Select Repository**:
   - Enter your GitHub repo format: `username/repository-name`

5. **Setup Build Script**:
   - What script should be run before every deploy?: `npm run build`

6. **Auto Deploy**:
   - Set up automatic deployment to your site's live channel when a PR is merged? **Yes**
   - What is the name of the GitHub branch associated with your site's live channel? `main`

## 3. Verify
Once completed, Firebase will create a `.github/workflows` folder in your project.
Push this new folder to GitHub:
```powershell
git add .
git commit -m "Setup Firebase GitHub Action"
git push
```
Now, every time you push changes to `main`, GitHub will automatically build and deploy your site to Firebase!
