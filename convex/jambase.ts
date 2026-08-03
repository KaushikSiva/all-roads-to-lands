"use node";

import { action, env, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { outsideLands2026Lineup } from "../lib/outside-lands-2026";

const JAMBASE_API = "https://api.data.jambase.com/v3";

type UnknownRecord = Record<string, unknown>;

function apiKey() {
  const key = env.JAMBASE_API_KEY;
  if (!key) throw new Error("JamBase is not configured");
  return key;
}

async function jambaseFetch(path: string) {
  const response = await fetch(`${JAMBASE_API}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      Accept: "application/json",
      "User-Agent": "AllRoadsToTheLands/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`JamBase request failed (${response.status})`);
  }
  return (await response.json()) as UnknownRecord;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function nested(record: unknown, key: string): unknown {
  return record && typeof record === "object" ? (record as UnknownRecord)[key] : undefined;
}

function regionName(city: UnknownRecord) {
  const region = nested(nested(city, "address"), "addressRegion");
  return text(region) ?? text(nested(region, "name")) ?? text(nested(region, "identifier"));
}

function normalizeCity(city: UnknownRecord) {
  const geo = nested(city, "geo");
  const latitude = nested(geo, "latitude");
  const longitude = nested(geo, "longitude");
  const jambaseCityId = text(city.identifier);
  const name = text(city.name);
  const countryCode = text(nested(nested(city, "address"), "addressCountry"));
  if (
    !jambaseCityId ||
    !name ||
    !countryCode ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) return null;
  const upcomingEvents = city["x-numUpcomingEvents"];
  return {
    jambaseCityId,
    name,
    region: regionName(city),
    countryCode,
    latitude,
    longitude,
    metroName: text(nested(nested(city, "containedInPlace"), "name")),
    upcomingEvents: typeof upcomingEvents === "number" ? upcomingEvents : undefined,
  };
}

function imageUrl(image: unknown): string | undefined {
  if (typeof image === "string" && image.startsWith("https://")) return image;
  if (Array.isArray(image)) {
    for (const item of image) {
      const candidate = imageUrl(item);
      if (candidate) return candidate;
    }
  }
  if (image && typeof image === "object") {
    return text((image as UnknownRecord).url) ?? text((image as UnknownRecord).contentUrl);
  }
  return undefined;
}

function normalizedName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeArtist(artist: UnknownRecord) {
  const jambaseArtistId = text(artist.identifier);
  const name = text(artist.name);
  if (!jambaseArtistId || !name) return null;
  const upcomingEvents = artist["x-numUpcomingEvents"];
  return {
    jambaseArtistId,
    name,
    imageUrl: imageUrl(artist.image),
    artistUrl: text(artist.url),
    upcomingEvents: typeof upcomingEvents === "number" ? upcomingEvents : undefined,
  };
}

async function findMedia(jambaseCityId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const payload = await jambaseFetch(
    `/events?geoCityId=${encodeURIComponent(jambaseCityId)}&eventDateFrom=${today}&perPage=20`,
  );
  const events = Array.isArray(payload.events) ? payload.events : [];
  for (const item of events) {
    if (!item || typeof item !== "object") continue;
    const event = item as UnknownRecord;
    const image = imageUrl(event.image);
    const eventName = text(event.name);
    const eventUrl = text(event.url);
    if (!image || !eventName || !eventUrl) continue;
    const performers = Array.isArray(event.performer) ? event.performer : [];
    return {
      imageUrl: image,
      eventName,
      eventUrl,
      artistName: text(nested(performers[0], "name")),
    };
  }
  return null;
}

export const searchCities = action({
  args: { query: v.string() },
  handler: async (_ctx, args) => {
    const query = args.query.trim().slice(0, 80);
    if (query.length < 2) return [];
    const payload = await jambaseFetch(
      `/geographies/cities?geoCityName=${encodeURIComponent(query)}&perPage=8`,
    );
    const cities = Array.isArray(payload.cities) ? payload.cities : [];
    return cities
      .map((city) => normalizeCity(city as UnknownRecord))
      .filter((city): city is NonNullable<typeof city> => city !== null);
  },
});

export const resolveLineupArtist = action({
  args: { name: v.string() },
  handler: async (_ctx, args) => {
    const requested = normalizedName(args.name.slice(0, 100));
    const officialName = outsideLands2026Lineup.find((name) => normalizedName(name) === requested);
    if (!officialName) throw new Error("Artist is not on the 2026 lineup");

    const payload = await jambaseFetch(
      `/artists?artistName=${encodeURIComponent(officialName)}&perPage=8`,
    );
    const artists = Array.isArray(payload.artists) ? payload.artists : [];
    const normalized = artists
      .map((artist) => normalizeArtist(artist as UnknownRecord))
      .filter((artist): artist is NonNullable<typeof artist> => artist !== null);
    const exact = normalized.find((artist) => normalizedName(artist.name) === requested);
    if (!exact) throw new Error("JamBase artist record was not found");
    return exact;
  },
});

export const enrichCity = action({
  args: { jambaseCityId: v.string() },
  handler: async (ctx, args) => {
    if (args.jambaseCityId.startsWith("jambase:demo-")) return { found: false };
    const media = await findMedia(args.jambaseCityId);
    if (!media) return { found: false };
    await ctx.runMutation(internal.jambaseData.storeMedia, {
      jambaseCityId: args.jambaseCityId,
      ...media,
    });
    return { found: true };
  },
});

export const bootstrapDemo = internalAction({
  args: {},
  handler: async (ctx) => {
    const seeds = [
      ["London", "GB"],
      ["Los Angeles", "US"],
      ["Chicago", "US"],
      ["New York", "US"],
      ["Seattle", "US"],
      ["Tokyo", "JP"],
      ["Mexico City", "MX"],
      ["Toronto", "CA"],
      ["Sydney", "AU"],
      ["Berlin", "DE"],
    ] as const;
    let imported = 0;
    let enriched = 0;
    for (const [name, countryCode] of seeds) {
      const payload = await jambaseFetch(
        `/geographies/cities?geoCityName=${encodeURIComponent(name)}&geoCountryIso2=${countryCode}&perPage=5`,
      );
      const cities = Array.isArray(payload.cities) ? payload.cities : [];
      const city = cities
        .map((item) => normalizeCity(item as UnknownRecord))
        .find((item) => item?.name.toLowerCase() === name.toLowerCase()) ??
        normalizeCity((cities[0] ?? {}) as UnknownRecord);
      if (!city) continue;
      await ctx.runMutation(internal.jambaseData.seedCity, { ...city, demoCount: 0 });
      imported += 1;
      const media = await findMedia(city.jambaseCityId);
      if (media) {
        await ctx.runMutation(internal.jambaseData.storeMedia, {
          jambaseCityId: city.jambaseCityId,
          ...media,
        });
        enriched += 1;
      }
    }
    return { imported, enriched };
  },
});

export const bootstrapArtists = internalAction({
  args: {},
  handler: async (ctx) => {
    const seeds = [
      "Charli xcx",
      "RÜFÜS DU SOL",
      "The Strokes",
      "The xx",
      "Baby Keem",
      "Turnstile",
      "Djo",
      "Labrinth",
    ] as const;
    let imported = 0;
    for (const name of seeds) {
      const payload = await jambaseFetch(
        `/artists?artistName=${encodeURIComponent(name)}&perPage=8`,
      );
      const artists = Array.isArray(payload.artists) ? payload.artists : [];
      const artist = artists
        .map((item) => normalizeArtist(item as UnknownRecord))
        .find((item) => item && normalizedName(item.name) === normalizedName(name));
      if (!artist) continue;
      await ctx.runMutation(internal.jambaseData.seedArtist, { ...artist, demoCount: 0 });
      imported += 1;
    }
    return { imported };
  },
});
