# GitHub Pages Deployment Guide

This guide provides a comprehensive walkthrough of the changes made to set up GitHub Pages deployment for the BCard Privy One application.

## Changes Implemented

1. **Added Route Utilities**
   - Created `utils/routes.ts` for handling base path prefixing
   - Added `getRoute()` and `getFullUrl()` utility functions
   - Added `routes.test.ts` for testing route handling

2. **Updated Link Components**
   - Updated all navigation links to use `getRoute()` for correct prefixing
   - Modified `Link` components in:
     - Landing Navbar
     - Footer
     - Index Page
     - Dashboard Page
     - Login Page

3. **Added GitHub Action Workflow**
   - Created `.github/workflows/deploy-gh-pages.yml`
   - Configured secrets handling for CI/CD deployment
   - Set up automatic deployment on push to main branch

4. **Configured Next.js for Static Export**
   - Updated `next.config.js` with proper basePath and assetPrefix
   - Added unoptimized image handling for static export

5. **Added Deployment Scripts**
   - Added `export` and `deploy` scripts in package.json
   - Installed `gh-pages` as a development dependency

6. **Added Documentation**
   - Updated README.md with deployment instructions
   - Created this deployment guide
   - Added CNAME file for custom domain (optional)

7. **Fixed Asset References**
   - Updated asset references in _app.tsx to use dynamic prefixing
   - Fixed API endpoint references (e.g., verifyToken) to work with base path

## Next Steps for Deployment

1. **Set Up GitHub Repository Secrets**
   - Go to your GitHub repository Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `NEXT_PUBLIC_PRIVY_APP_ID`
     - `NEXT_PUBLIC_PRIVY_APP_CLIENT_ID`
   - Note: Don't add the PRIVY_APP_SECRET as it's for server-side only

2. **Push to GitHub**
   - Push your changes to GitHub to trigger the workflow:
   ```
   git add .
   git commit -m "Set up GitHub Pages deployment"
   git push
   ```

3. **Enable GitHub Pages**
   - Go to your repository Settings > Pages
   - Set the source to "Deploy from a branch"
   - Select the "gh-pages" branch
   - Save the settings

4. **Custom Domain Configuration (Optional)**
   - If using a custom domain, update the CNAME file with your actual domain
   - Configure your DNS settings to point to GitHub Pages
   - In repository Settings > Pages, add your custom domain

5. **Verify Deployment**
   - Check the Actions tab to monitor the deployment workflow
   - Verify your site is accessible at yourusername.github.io/bcard-privy-one
   - Test login and navigation to ensure everything works correctly

## Important Notes

- The static export doesn't support server-side features, so server-side authentication verification is disabled
- Update the `NEXT_PUBLIC_BASE_URL` env variable if needed for absolute URL generation
- If you encounter any issues with the routing, check that all links are using the `getRoute()` utility function

## Troubleshooting

If you encounter issues with the deployment:

1. Check the GitHub Actions logs for errors
2. Verify all your secrets are correctly set up
3. Make sure your Next.js configuration is correct
4. Test locally first: `npm run export` and check the generated `out` directory

For local testing of the exported site, you can use:
```bash
npx serve out
```
