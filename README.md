# BCard Privy One - Black Flag Edition

This is a [Next.js](https://nextjs.org/) project with [**Privy Auth**](https://www.privy.io/) integration, styled after the Black Flag website aesthetic.

## Features

- **Black Flag Theme**: Dark theme with custom styling inspired by the Black Flag website
- **Authentication**: Secure login with Privy Auth
- **BCard Integration**: Create and manage digital business cards
- **Responsive Design**: Works on desktop and mobile devices

## Setup

1. Clone this repository and open it in your terminal.
```sh
git clone https://github.com/yourusername/bcard-privy-one
```

2. Install the necessary dependencies with `npm`.
```sh
npm install
```

3. Set up your environment variables by creating a `.env.local` file with your Privy App credentials.
```
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
NEXT_PUBLIC_PRIVY_APP_CLIENT_ID=<your-privy-app-client-id>
PRIVY_APP_SECRET=<your-privy-app-secret>
```

## Local Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Deployment to GitHub Pages

This project is configured for easy deployment to GitHub Pages.

### Setting Up GitHub Repository Secrets

Before deploying, add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:
   - `NEXT_PUBLIC_PRIVY_APP_ID`: Your Privy App ID
   - `NEXT_PUBLIC_PRIVY_APP_CLIENT_ID`: Your Privy App Client ID

### Manual Deployment

You can manually deploy the site using:

```bash
npm run deploy
```

### Automated Deployment

This repository is set up with GitHub Actions for automatic deployment. Each push to the `main` branch will trigger a build and deploy.

The workflow file is located at `.github/workflows/nextjs.yml`.

## File Structure

- `components/`: React components for the UI
- `pages/`: Next.js pages
- `styles/`: CSS styles, including the Black Flag theme
- `public/`: Static files
- `utils/`: Utility functions, including routing helpers for GitHub Pages
- `content/`: Content files for community-specific data output

## Base Path Handling

For GitHub Pages compatibility, all links use the `basePath` prefix utility in `next.config.js` function to handle base paths correctly when deployed. getRoute is legacy / depreciated.

```tsx
import { getRoute } from "../utils/routes";

// Example usage
<Link href={getRoute("/dashboard")}>Dashboard</Link>
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Auth Documentation](https://docs.privy.io/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [GitHub Pages Deployment](https://pages.github.com/)

**Check out [our docs](https://docs.privy.io/) for more guidance around using Privy in your app!**

