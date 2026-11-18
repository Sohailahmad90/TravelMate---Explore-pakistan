# TravelMate — Smart Tourism & Trip Management Platform

**Plan Smarter. Travel Safer. Explore Better.**

TravelMate is a full-stack Pakistan tourism and smart trip planning platform built with React, TypeScript, Tailwind CSS v4, Express, Firebase Auth & Cloud Firestore, Leaflet/OpenStreetMap, Open-Meteo live weather, and server-side Google Gemini AI.

## Features
- **Explore Northern Pakistan**: Interactive Leaflet destination map, 14 curated destinations, live Open-Meteo weather forecasts, and seasonal travel insights.
- **AI Smart Trip Planner & Re-Planner**: Server-side Gemini AI generates day-by-day PKR itineraries and dynamically adapts active plans for weather, budget, or route disruptions.
- **Unified Marketplace**: Tour packages, hotels & room inventory, 4x4/transport rentals, and cultural experiences with PKR pricing, date-overlap conflict checks, and printable booking invoices.
- **Travel Buddy & Group Trips**: Compatibility matching across destinations, dates, interests, and PKR budget ranges, plus travel group creation and real-time direct messaging.
- **Safety & Weather Center**: Live weather alerts, verified travel advisories, 1-click SOS check-in with geolocation, and trusted emergency contacts.
- **Role-Based Workspaces**: Dedicated operations panels for Tourists, Tour Guides, Hotel Owners, Vehicle Rental Owners, and Administrators.

## Environment Variables
Configure the following in your environment (see `.env.example`):
- `GEMINI_API_KEY`: Google Gemini API key (used strictly on the server in `server.ts`).
- `APP_URL`: Hosted application URL.
- `firebase-applet-config.json`: Firebase project and Firestore database configuration generated via provisioning.

## Scripts
```bash
npm install
npm run dev       # Starts Express + Vite dev server on port 3000
npm run lint      # Runs TypeScript type checking (tsc --noEmit)
npm run build     # Builds production frontend assets into dist/
npm start         # Runs production Express server on port 3000
```
