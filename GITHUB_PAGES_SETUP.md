# GitHub Pages Setup Guide

This document explains how to set up and deploy your PWA to GitHub Pages.

## Initial Setup

### 1. Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/CppFanatic/grocery`
2. Click on **Settings** (top right)
3. In the left sidebar, click **Pages**
4. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/docs`
5. Click **Save**

### 2. Wait for Deployment

After pushing your code, GitHub will automatically deploy your site. This usually takes 1-2 minutes.

You can check the deployment status:
- Go to the **Actions** tab in your repository
- Look for the "pages build and deployment" workflow

### 3. Access Your App

Once deployed, your PWA will be available at:
**https://cppfanatic.github.io/grocery/**

## Deploying Updates

Whenever you want to update your live app:

### Option 1: Using npm script (Recommended)

```bash
npm run deploy
git add .
git commit -m "Deploy updates to GitHub Pages"
git push origin main
```

### Option 2: Manual steps

```bash
# Build the production version
npm run build

# Copy to docs folder
cp -r dist/* docs/

# Commit and push
git add .
git commit -m "Update GitHub Pages deployment"
git push origin main
```

## Important Files

- **`docs/`** - Contains the deployed version of your app (tracked by git)
- **`docs/.nojekyll`** - Tells GitHub Pages not to use Jekyll processing
- **`dist/`** - Build output (ignored by git, used as source for docs)

## Troubleshooting

### App not loading after deployment

1. Check that `docs/index.html` exists and has content
2. Verify GitHub Pages is enabled in repository settings
3. Check the Actions tab for any deployment errors
4. Ensure the branch is set to `main` and folder to `/docs`

### 404 errors for assets

1. Make sure all asset paths are relative (not absolute)
2. Rebuild and redeploy: `npm run deploy`
3. Clear your browser cache

### Changes not appearing

1. GitHub Pages can take 1-2 minutes to update
2. Try hard refresh in browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check that you pushed your changes: `git push origin main`

## Custom Domain (Optional)

To use a custom domain:

1. Add a file `docs/CNAME` with your domain name
2. Configure DNS settings with your domain provider
3. Point to GitHub Pages IP addresses

See: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Notes

- The `docs` folder is tracked by git (not in `.gitignore`)
- The `dist` folder is ignored by git
- Always rebuild before copying to docs: `npm run build`
- Use the `npm run deploy` script to automate the process

