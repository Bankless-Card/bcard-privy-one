# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BPages is a Next.js-based platform for creating static websites with embedded blockchain/web3 widgets. The project aims to provide an open-source library of easy-to-use web3 components that communities can integrate into their own websites using markdown.

Key characteristics:
- Static-first architecture (no backend required)
- Markdown-based content management with React component embedding
- Privy.io authentication for seamless blockchain functionality
- Styled after the Black Flag website aesthetic
- Deployable to Orbitor.host and other static hosting services

## Commands

### Development
```bash
npm run dev          # Start development server at http://localhost:3000
```

### Building and Deployment
```bash
npm run build        # Build the Next.js application
npm run export       # Build and export static site to 'out/' directory
npx serve out        # Test the exported static site locally
```

## Architecture

### Static Export Configuration
The project uses Next.js's static export feature (`output: 'export'` in next.config.js). This means:
- All pages must be statically renderable
- No server-side API routes
- Image optimization is disabled (`unoptimized: true`)
- Trailing slashes are enabled for GitHub Pages compatibility

### Markdown + React Component System
The core innovation is allowing React components to be embedded in markdown files:

1. **Markdown Content**: Stored in `/public/content/` (e.g., `about.md`, `vote.md`)
2. **Component Registry**: All embeddable components must be registered in `ComponentRegistry` in `/components/MarkdownWithReactComponentRenderer.tsx`
3. **Embedding Syntax**: Use `{{component:ComponentName}}` or `{{component:ComponentName props={"key":"value"}}}` in markdown files
4. **Rendering**: The `MarkdownWithReactComponentRenderer` component parses markdown and replaces component blocks with actual React components

Example:
```markdown
# My Page

Some text content here.

{{component:Vote}}

More content after the component.
```

### Web3/Blockchain Components
The project includes several blockchain-focused components that are production-ready:

- **Vote** (`Vote.jsx`): Snapshot governance integration for displaying and voting on proposals
- **Deposit** (`Deposit.tsx`): USDC deposit/vault interface for Base network with balance tracking
- **Withdraw** (`Withdraw.tsx`): Withdrawal functionality for vault balances
- **BCardIntegration** (`bcard-integration.tsx`): Digital debit card creation and management
- **LoginButton** (`LoginButton.tsx`): Privy authentication UI

Each component is self-contained and can be dropped into any markdown page.

### Authentication with Privy
- All pages are wrapped in `PrivyProvider` in `pages/_app.tsx`
- Configuration uses email-only login with embedded wallets
- Wallet UIs are hidden by default (`showWalletUIs: false`)
- Environment variables: `NEXT_PUBLIC_PRIVY_APP_ID` and `NEXT_PUBLIC_PRIVY_APP_CLIENT_ID`

### Styling
- NO CSS libraries like Tailwind should be used (per project conventions in AGENTS.md)
- Component-scoped CSS modules (e.g., `Button.module.css`, `Deposit.module.css`)
- Global styles in `styles/globals.css` and `styles/mobile.css`
- Dark theme with Black Flag aesthetic

### Routing
- Legacy routing utility in `utils/routes.ts` (marked as deprecated in README)
- Base path is configured in `next.config.js` for GitHub Pages deployment
- Use Next.js `Link` component for internal navigation

## Environment Variables

Required variables (see `.env.example`):
```bash
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id
NEXT_PUBLIC_PRIVY_APP_CLIENT_ID=your_client_id

# Snapshot Governance (for Vote component)
NEXT_PUBLIC_SNAPSHOT_SPACE_ID=snapshot_space_id
NEXT_PUBLIC_SNAPSHOT_QUERY_ROUTE=graphql_endpoint_url
```

All environment variables are public (prefixed with `NEXT_PUBLIC_`) since this is a static site.

## Adding New Components

To create a new embeddable component:

1. Create the component file in `/components/` (e.g., `MyWidget.tsx`)
2. Create associated CSS module if needed (e.g., `MyWidget.module.css`)
3. Register the component in `ComponentRegistry` in `/components/MarkdownWithReactComponentRenderer.tsx`:
   ```typescript
   const ComponentRegistry = {
     'MyWidget': MyWidget,
     // ... other components
   };
   ```
4. Use in markdown: `{{component:MyWidget}}`

## TypeScript Configuration

- Extends strictest TypeScript config (`@tsconfig/strictest`)
- Build errors are ignored in production (`ignoreBuildErrors: true` in next.config.js)
- Mixed `.tsx`, `.ts`, `.jsx`, and `.js` files are supported
- Some strictness options are disabled: `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`

## Deployment

Manual deployment: `npm run deploy`
- then upload to your favourite static site host

## Code Conventions

From AGENTS.md:
- **Naming**: camelCase for variables, PascalCase for components
- **Static-first**: No backend dependencies
- **Minimal Next.js**: Use as little Next.js-specific functionality as possible for maximum portability
- **No Tailwind**: Avoid CSS utility libraries
- **Component registration**: All markdown-embeddable components must be in `ComponentRegistry`
