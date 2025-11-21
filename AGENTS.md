# AGENTS.md - Project Context for AI Agents

This file provides essential context and instructions for AI agents interacting with this project. Please fill out the sections below to help the agent understand the codebase, conventions, and goals.

---

## 1. Project Overview

*   **Project Name:** BPages
*   **Purpose:** This project is aiming to create an open platform and library of easy-to-use web-based blockchain widgets that communities can use to make their own websites.
*   **Key Features:** 
    * easy-to-setup website using markdown for static content
    * easy-to-deploy static-first website
    * library of blockchain/web3 widgets that can be mixed and matched by communities for their own needs
    * free and open source, making it usable for any community regardless of size and resources

---

## 2. Technology Stack

*   **Frontend:** Next.js, React, TypeScript
    * relies heavily on Privy.io authentication for seamless blockchain functionality (to be abstracted later)

---

## 3. Coding Conventions & Style

*   **Language/Framework Specifics:** 
    * This codebase should be static - no backend is required.
    * TypeScipt React components for all web3 widgets.
    * Use as little NextJS functionality as possible to maximize portability.
    * Don't use any CSS libraries (especially not Tailwind).
*   **Naming Conventions:** camelCase for variables, PascalCase for components.
*   **Architectural Patterns:**
    * The site aims to use markdown for end-user convenience.  Markdown content is stored in `/public/content`.
    * React components can be included in markdown using `{{component:component_name}}` in markdown (they must registered in `ComponentRegistry` in `/components/MarkdownWithReactComponentRenderer.tsx`)



---

## 4. Important Files & Directories

*   **Entry Points:** `pages/index.tsx`, `pages/_app.tsx`
*   **Configuration Files:** `next.config.js`, `tsconfig.json`, `.env`
*   **Core Logic/Utilities:** `utils/`
*   **Component Library:** `components/`
*   **Styling:** `styles/`
*   **Spec:** `spec/`

---

## 5. Development & Build Commands

*   **Install Dependencies:** `npm install`
*   **Run Development Server:** `npm run dev`
*   **Build for Production:** `npm run export`
*   **Other Common Commands:** `npx serve out` to test prod package after exporting

---

## 6. Additional Notes / Specific Instructions

* I'm trying to learn how to use an AI agent in a more efficient way.  Please provide tips and advice on how I might best make use of you.
* There is no need to run the development server after making changes - I will do that myself.
