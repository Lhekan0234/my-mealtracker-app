# My Meal Tracker

My Meal Tracker is a meal diary for recording meals, keeping a pantry inventory, and tracking optional weight check-ins. It includes a built-in food-coaching helper with general meal-planning suggestions.

## Features

- Record meals with meal type, notes, calories, and protein.
- Review the daily food diary and nutrition summaries.
- Manage pantry items and quantities.
- Log dated check-ins.
- Get general meal ideas based on pantry items and logged meals.
- Save entries in browser local storage.

## Tech stack

- React 19 and TypeScript
- Vite
- Tailwind CSS and Lucide icons

## Run locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Deploy to Vercel

Import this repository into Vercel. Use the default Vite settings:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`

No AppDeploy client package is required by the Vercel frontend build.

## Data and limitations

Entries are stored in the current browser using `localStorage`. They do not automatically sync across browsers or devices, and clearing the browser's site data can remove them. The built-in coach provides rule-based general suggestions; it is not a live generative AI service. A shared database and live AI coach would require a separately configured backend and credentials.

## Safety note

The coach provides general food and meal-planning information, not medical advice or a diagnosis. Consult a qualified clinician or dietitian for individual medical nutrition concerns.
