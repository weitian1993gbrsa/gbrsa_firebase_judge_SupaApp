---
description: how to deploy the application to Firebase Hosting
---

To deploy your application to Firebase Hosting, follow these steps:

1. **Build the Application**
   Run the build script to generate the production-ready assets in the `dist` folder.
   // turbo
   ```powershell
   npm run build
   ```

2. **Login to Firebase (if not already)**
   If you haven't logged in to the Firebase CLI, run this command and follow the browser prompts.
   ```powershell
   firebase login
   ```

3. **Deploy to Firebase Hosting**
   Run the deploy command to push the contents of the `dist` folder to your Firebase project.
   // turbo
   ```powershell
   firebase deploy
   ```

> [!NOTE]
> Since your project already has `firebase.json` and `.firebaserc` files, it is already configured to deploy the `dist` folder to your specific Firebase project.
