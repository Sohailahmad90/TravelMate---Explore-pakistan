import type { WeatherData } from '../types/travelmate';

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

export async function fetchWeatherForCoords(lat: number, lng: number): Promise<WeatherData | null> {
  // 1. Try server-side proxy first (when running with Express backend)
  try {
    const resp = await fetch(`/api/weather?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
    const contentType = resp.headers.get('content-type') || '';
    if (resp.ok && contentType.includes('application/json')) {
      const data = (await resp.json()) as WeatherData;
      if (data && data.current) return data;
    }
  } catch {
    // Fall through to direct Open-Meteo lookup
  }

  // 2. Direct Open-Meteo CORS fallback (works on static hosts like GitHub Pages)
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKarachi&forecast_days=5`;
    const directResp = await fetch(url);
    if (!directResp.ok) return null;
    const raw = await directResp.json();
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
  } catch {
    return null;
  }
}
