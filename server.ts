import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function describeWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Mountain fog / mist';
  if (code <= 57) return 'Light drizzle';
  if (code <= 67) return 'Rain showers';
  if (code <= 77) return 'Snowfall';
  if (code <= 82) return 'Heavy rain showers';
  if (code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Variable alpine conditions';
}

async function fetchOpenMeteoWeather(lat: number, lng: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKarachi&forecast_days=5`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Open-Meteo returned HTTP ${resp.status}`);
  }
  const raw = await resp.json();
  const current = raw.current || {};
  const daily = raw.daily || {};
  const forecast = Array.isArray(daily.time)
    ? daily.time.map((date: string, i: number) => ({
        date,
        condition: describeWeatherCode(Number(daily.weather_code?.[i] ?? 0)),
        weatherCode: Number(daily.weather_code?.[i] ?? 0),
        tempMaxC: Math.round(Number(daily.temperature_2m_max?.[i] ?? 0)),
        tempMinC: Math.round(Number(daily.temperature_2m_min?.[i] ?? 0)),
        rainProbabilityPct: Number(daily.precipitation_probability_max?.[i] ?? 0),
      }))
    : [];

  return {
    source: 'Open-Meteo Live Weather API',
    fetchedAt: new Date().toISOString(),
    current: {
      temperatureC: Math.round(Number(current.temperature_2m ?? 0)),
      humidityPct: Number(current.relative_humidity_2m ?? 0),
      windSpeedKmh: Math.round(Number(current.wind_speed_10m ?? 0)),
      condition: describeWeatherCode(Number(current.weather_code ?? 0)),
      weatherCode: Number(current.weather_code ?? 0),
    },
    forecast,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'TravelMate API', timestamp: new Date().toISOString() });
  });

  app.get('/api/weather', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
      return;
    }
    try {
      const data = await fetchOpenMeteoWeather(lat, lng);
      res.json(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to retrieve weather telemetry.';
      res.status(502).json({ error: msg });
    }
  });

  app.post('/api/ai/plan-trip', async (req, res) => {
    try {
      const {
        startingLocation = 'Islamabad',
        destination,
        startDate,
        endDate,
        travelers = 2,
        budgetPkr = 40000,
        interests = [],
        accommodationPref = 'Mid-range mountain lodge',
        transportPref = '4x4 SUV / Shared coaster',
        specialRequirements = '',
      } = req.body || {};

      if (!destination || typeof destination !== 'string') {
        res.status(400).json({ error: 'Destination is required.' });
        return;
      }

      const startMs = startDate ? new Date(startDate).getTime() : Date.now();
      const endMs = endDate ? new Date(endDate).getTime() : startMs + 4 * 86400000;
      const computedDays = Math.min(14, Math.max(1, Math.round((endMs - startMs) / 86400000) + 1 || 5));

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Plan a ${computedDays}-day Pakistan tourism trip from ${startingLocation} to ${destination}.
Dates: ${startDate || 'Flexible'} to ${endDate || 'Flexible'}.
Travelers: ${travelers}.
Total Target Budget: PKR ${budgetPkr}.
Interests: ${Array.isArray(interests) && interests.length ? interests.join(', ') : 'Mountains, Lakes, Photography'}.
Accommodation Preference: ${accommodationPref}.
Transportation Preference: ${transportPref}.
Special Requirements: ${specialRequirements || 'None'}.`,
        config: {
          systemInstruction: `You are TravelMate's expert Pakistan travel planning engine.
Rules:
1. All currency estimates MUST be in Pakistani Rupees (PKR) and realistic for domestic Pakistan travel.
2. Explicitly treat cost numbers as AI-generated estimates — NEVER fabricate live hotel room inventory, confirmed booking IDs, or fake real-time road closure claims.
3. Recommend real landmarks, routes (such as KKH, Babusar Top, Naran-Kaghan, Skardu Road where seasonally appropriate), local food, and safety precautions for ${destination}.
4. Keep daily schedules structured, practical, and aligned with the requested budget of PKR ${budgetPkr}.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Concise itinerary title' },
              recommendedDurationDays: { type: Type.INTEGER },
              destinationSummary: { type: Type.STRING },
              safetyAndSeasonNote: { type: Type.STRING },
              budgetBreakdown: {
                type: Type.OBJECT,
                properties: {
                  transportationPkr: { type: Type.NUMBER },
                  accommodationPkr: { type: Type.NUMBER },
                  foodPkr: { type: Type.NUMBER },
                  activitiesPkr: { type: Type.NUMBER },
                  miscellaneousPkr: { type: Type.NUMBER },
                  totalEstimatedPkr: { type: Type.NUMBER },
                },
                required: [
                  'transportationPkr',
                  'accommodationPkr',
                  'foodPkr',
                  'activitiesPkr',
                  'miscellaneousPkr',
                  'totalEstimatedPkr',
                ],
              },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    morning: { type: Type.STRING },
                    afternoon: { type: Type.STRING },
                    evening: { type: Type.STRING },
                    attractions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    estimatedDayCostPkr: { type: Type.NUMBER },
                  },
                  required: ['dayNumber', 'title', 'morning', 'afternoon', 'evening', 'attractions', 'estimatedDayCostPkr'],
                },
              },
              alternativeOptions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    estimatedBudgetPkr: { type: Type.NUMBER },
                    summary: { type: Type.STRING },
                  },
                  required: ['label', 'estimatedBudgetPkr', 'summary'],
                },
              },
            },
            required: [
              'title',
              'recommendedDurationDays',
              'destinationSummary',
              'safetyAndSeasonNote',
              'budgetBreakdown',
              'days',
              'alternativeOptions',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({
        ...parsed,
        isAiEstimate: true,
        disclaimer: 'AI-generated itinerary and cost estimates. Verify live room inventory and confirmed rates with TravelMate providers before payment.',
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to generate AI itinerary.';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/ai/replan-trip', async (req, res) => {
    try {
      const { itinerary, affectedDayNumber, disruptionReason, lat, lng } = req.body || {};
      if (!itinerary || !affectedDayNumber) {
        res.status(400).json({ error: 'Itinerary and affectedDayNumber are required.' });
        return;
      }

      let weatherContext = 'Weather telemetry not supplied.';
      if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
        try {
          const weather = await fetchOpenMeteoWeather(Number(lat), Number(lng));
          weatherContext = `Current: ${weather.current.temperatureC}°C, ${weather.current.condition}, Wind ${weather.current.windSpeedKmh} km/h. 5-Day Forecast: ${weather.forecast
            .map((d: { date: string; condition: string; rainProbabilityPct: number; tempMaxC: number }) => `${d.date}: ${d.condition} (${d.rainProbabilityPct}% rain, max ${d.tempMaxC}°C)`)
            .join('; ')}`;
        } catch {
          weatherContext = 'Live Open-Meteo lookup unavailable; using disruption context provided by tourist.';
        }
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Evaluate a trip disruption for "${itinerary.title}" in ${itinerary.destination}.
Affected Day: Day ${affectedDayNumber}.
Disruption Reported: ${disruptionReason || 'Adverse mountain weather / rain / visibility drop'}.
Weather Data: ${weatherContext}.
Current Plan for Day ${affectedDayNumber}: ${JSON.stringify(
          (itinerary.days || []).find((d: { dayNumber: number }) => d.dayNumber === Number(affectedDayNumber)) || {}
        )}.`,
        config: {
          systemInstruction: `You are TravelMate's Dynamic Trip Re-Planning Assistant.
Rules:
1. Never claim a road is officially closed unless citing verified input; frame suggestions as safer indoor/low-altitude/accessible alternatives.
2. Never cancel existing reservations automatically — propose changes for explicit tourist approval.
3. Provide realistic PKR budget delta estimates.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              weatherAssessment: { type: Type.STRING },
              affectedActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
              proposedDayPlan: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  morning: { type: Type.STRING },
                  afternoon: { type: Type.STRING },
                  evening: { type: Type.STRING },
                  attractions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  estimatedDayCostPkr: { type: Type.NUMBER },
                },
                required: ['dayNumber', 'title', 'morning', 'afternoon', 'evening', 'attractions', 'estimatedDayCostPkr'],
              },
              budgetDeltaPkr: { type: Type.NUMBER },
              guideNotificationNote: { type: Type.STRING },
            },
            required: ['weatherAssessment', 'affectedActivities', 'proposedDayPlan', 'budgetDeltaPkr', 'guideNotificationNote'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({
        ...parsed,
        weatherContext,
        proposedAt: new Date().toISOString(),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to generate trip re-plan.';
      res.status(500).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TravelMate server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TravelMate server:', err);
  process.exit(1);
});
