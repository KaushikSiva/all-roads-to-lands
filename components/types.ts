export type CityPoint = {
  jambaseCityId: string;
  name: string;
  region?: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  metroName?: string;
  upcomingEvents?: number;
  demoCount: number;
  liveCount: number;
  count: number;
  distanceMiles: number;
  media?: {
    imageUrl: string;
    eventName: string;
    eventUrl: string;
    artistName?: string;
  };
};

export type LiveMapData = {
  cities: CityPoint[];
  stats: {
    travelers: number;
    liveTravelers: number;
    cityCount: number;
    countryCount: number;
    totalDistanceMiles: number;
    farthestCity?: CityPoint;
  };
  latest?: CityPoint;
  mode: "live" | "demo";
};

export type CityCandidate = {
  jambaseCityId: string;
  name: string;
  region?: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  metroName?: string;
  upcomingEvents?: number;
};
