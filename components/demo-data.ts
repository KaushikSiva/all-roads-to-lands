import type { LiveMapData } from "./types";

const seed = [
  ["jambase:demo-london", "London", "", "GB", 51.5072, -0.1276],
  ["jambase:demo-los-angeles", "Los Angeles", "CA", "US", 34.0522, -118.2437],
  ["jambase:demo-chicago", "Chicago", "IL", "US", 41.8781, -87.6298],
  ["jambase:demo-new-york", "New York", "NY", "US", 40.7128, -74.006],
  ["jambase:demo-seattle", "Seattle", "WA", "US", 47.6062, -122.3321],
  ["jambase:demo-tokyo", "Tokyo", "", "JP", 35.6762, 139.6503],
  ["jambase:demo-mexico-city", "Mexico City", "", "MX", 19.4326, -99.1332],
  ["jambase:demo-toronto", "Toronto", "ON", "CA", 43.6532, -79.3832],
  ["jambase:demo-sydney", "Sydney", "NSW", "AU", -33.8688, 151.2093],
  ["jambase:demo-berlin", "Berlin", "", "DE", 52.52, 13.405],
] as const;

export const demoCandidates = seed.map(([jambaseCityId, name, region, countryCode, latitude, longitude]) => ({
  jambaseCityId,
  name,
  region,
  countryCode,
  latitude,
  longitude,
  upcomingEvents: 42,
}));

export const demoMapData: LiveMapData = {
  cities: [],
  artists: [],
  stats: {
    travelers: 0,
    liveTravelers: 0,
    cityCount: 0,
    countryCount: 0,
    totalDistanceMiles: 0,
  },
  mode: "demo",
};
