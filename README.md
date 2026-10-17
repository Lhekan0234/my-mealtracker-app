# My Meal Tracker

My Meal Tracker is an AI-assisted meal diary for recording meals, keeping a pantry inventory, and tracking dated weight check-ins. It includes a supportive AI food coach for general meal-planning ideas.

## Features

- Record meals with meal type, notes, calories, and protein.
- Review the daily food diary and nutrition summaries.
- Manage pantry items and quantities.
- Log dated weight check-ins.
- Ask the AI food coach for practical, non-judgmental meal ideas.
- Persist tracker entries through the app backend.

## Tech stack

- React 19 and TypeScript
- Vite
- Tailwind CSS and Lucide icons
- AppDeploy SDK for API, database, and AI integration

## Getting started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

The app's API routes run in the AppDeploy backend environment. Local development of backend-connected features requires the corresponding AppDeploy runtime/configuration.

## Project structure

- `src/App.tsx` — tracker interface and client interactions
- `src/index.css` — application styling
- `src/main.tsx` — React entry point
- `backend/index.ts` — API routes for meals, pantry, weights, and AI coaching
- `tests/tests.json` — end-to-end test scenarios

## Safety note

The AI coach provides general food and meal-planning information, not medical advice or a diagnosis. Consult a qualified clinician or dietitian for individual medical nutrition concerns.
