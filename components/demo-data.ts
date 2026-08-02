import type { LiveMapData } from "./types";

const seed = [
  ["jambase:demo-london", "London", "", "GB", 51.5072, -0.1276, 212, 5351],
  ["jambase:demo-los-angeles", "Los Angeles", "CA", "US", 34.0522, -118.2437, 196, 347],
  ["jambase:demo-chicago", "Chicago", "IL", "US", 41.8781, -87.6298, 173, 1854],
  ["jambase:demo-new-york", "New York", "NY", "US", 40.7128, -74.006, 161, 2567],
  ["jambase:demo-seattle", "Seattle", "WA", "US", 47.6062, -122.3321, 149, 679],
  ["jambase:demo-tokyo", "Tokyo", "", "JP", 35.6762, 139.6503, 128, 5135],
  ["jambase:demo-mexico-city", "Mexico City", "", "MX", 19.4326, -99.1332, 112, 1882],
  ["jambase:demo-toronto", "Toronto", "ON", "CA", 43.6532, -79.3832, 104, 2258],
  ["jambase:demo-sydney", "Sydney", "NSW", "AU", -33.8688, 151.2093, 91, 7419],
  ["jambase:demo-berlin", "Berlin", "", "DE", 52.52, 13.405, 83, 5671],
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

const cities = seed.map(([jambaseCityId, name, region, countryCode, latitude, longitude, count, distanceMiles]) => ({
  jambaseCityId,
  name,
  region: region || undefined,
  countryCode,
  latitude,
  longitude,
  demoCount: count,
  liveCount: 0,
  count,
  distanceMiles,
}));

export const demoMapData: LiveMapData = {
  cities,
  stats: {
    travelers: cities.reduce((sum, city) => sum + city.count, 0),
    liveTravelers: 0,
    cityCount: cities.length,
    countryCount: new Set(cities.map((city) => city.countryCode)).size,
    totalDistanceMiles: cities.reduce((sum, city) => sum + city.count * city.distanceMiles, 0),
    farthestCity: cities.find((city) => city.name === "Sydney"),
  },
  latest: cities[0],
  mode: "demo",
};
