import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const cityInput = v.object({
  jambaseCityId: v.string(),
  name: v.string(),
  region: v.optional(v.string()),
  countryCode: v.string(),
  latitude: v.number(),
  longitude: v.number(),
  metroName: v.optional(v.string()),
  upcomingEvents: v.optional(v.number()),
});

const SF_LATITUDE = 37.7749;
const SF_LONGITUDE = -122.4194;

function distanceMiles(latitude: number, longitude: number) {
  const earthRadius = 3958.8;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(SF_LATITUDE - latitude);
  const longitudeDelta = toRadians(SF_LONGITUDE - longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitude)) *
      Math.cos(toRadians(SF_LATITUDE)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const getLiveMap = query({
  args: {},
  handler: async (ctx) => {
    const cityDocuments = await ctx.db.query("cities").take(500);
    const active = cityDocuments
      .map((city) => ({
        jambaseCityId: city.jambaseCityId,
        name: city.name,
        region: city.region,
        countryCode: city.countryCode,
        latitude: city.latitude,
        longitude: city.longitude,
        metroName: city.metroName,
        upcomingEvents: city.upcomingEvents,
        demoCount: city.demoCount,
        liveCount: city.liveCount,
        count: city.demoCount + city.liveCount,
        distanceMiles: distanceMiles(city.latitude, city.longitude),
        media: city.media,
      }))
      .filter((city) => city.count > 0)
      .sort((a, b) => b.count - a.count);

    const latestSubmission = await ctx.db
      .query("submissions")
      .withIndex("by_updated_at")
      .order("desc")
      .first();
    const latestCityDocument = latestSubmission ? await ctx.db.get(latestSubmission.cityId) : null;
    const latest = latestCityDocument
      ? active.find((city) => city.jambaseCityId === latestCityDocument.jambaseCityId)
      : undefined;

    const travelers = active.reduce((sum, city) => sum + city.count, 0);
    const liveTravelers = active.reduce((sum, city) => sum + city.liveCount, 0);
    const totalDistanceMiles = active.reduce(
      (sum, city) => sum + city.count * city.distanceMiles,
      0,
    );
    const farthestCity = [...active].sort((a, b) => b.distanceMiles - a.distanceMiles)[0];

    return {
      cities: active,
      stats: {
        travelers,
        liveTravelers,
        cityCount: active.length,
        countryCount: new Set(active.map((city) => city.countryCode)).size,
        totalDistanceMiles,
        farthestCity,
      },
      latest,
      mode: "live" as const,
    };
  },
});

export const submitOrigin = mutation({
  args: {
    participantId: v.string(),
    city: cityInput,
  },
  handler: async (ctx, args) => {
    if (args.participantId.length < 8 || args.participantId.length > 128) {
      throw new Error("Invalid participant identifier");
    }
    if (!Number.isFinite(args.city.latitude) || !Number.isFinite(args.city.longitude)) {
      throw new Error("City coordinates are required");
    }

    const existingSubmission = await ctx.db
      .query("submissions")
      .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
      .unique();

    let targetCity = await ctx.db
      .query("cities")
      .withIndex("by_jambase_id", (q) => q.eq("jambaseCityId", args.city.jambaseCityId))
      .unique();

    if (!targetCity) {
      const cityId = await ctx.db.insert("cities", {
        ...args.city,
        demoCount: 0,
        liveCount: 0,
      });
      targetCity = await ctx.db.get(cityId);
    }
    if (!targetCity) throw new Error("Unable to create city");

    if (existingSubmission?.cityId === targetCity._id) {
      await ctx.db.patch(existingSubmission._id, { updatedAt: Date.now() });
      return { changed: false, cityId: targetCity._id };
    }

    if (existingSubmission) {
      const previousCity = await ctx.db.get(existingSubmission.cityId);
      if (previousCity) {
        await ctx.db.patch(previousCity._id, {
          liveCount: Math.max(0, previousCity.liveCount - 1),
        });
      }
    }

    await ctx.db.patch(targetCity._id, {
      name: args.city.name,
      region: args.city.region,
      countryCode: args.city.countryCode,
      latitude: args.city.latitude,
      longitude: args.city.longitude,
      metroName: args.city.metroName,
      upcomingEvents: args.city.upcomingEvents,
      liveCount: targetCity.liveCount + 1,
    });

    if (existingSubmission) {
      await ctx.db.patch(existingSubmission._id, {
        cityId: targetCity._id,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("submissions", {
        participantId: args.participantId,
        cityId: targetCity._id,
        updatedAt: Date.now(),
      });
    }

    return { changed: true, cityId: targetCity._id };
  },
});

export const seedDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const seeds = [
      ["jambase:demo-london", "London", undefined, "GB", 51.5072, -0.1276, 212],
      ["jambase:demo-los-angeles", "Los Angeles", "CA", "US", 34.0522, -118.2437, 196],
      ["jambase:demo-chicago", "Chicago", "IL", "US", 41.8781, -87.6298, 173],
      ["jambase:demo-new-york", "New York", "NY", "US", 40.7128, -74.006, 161],
      ["jambase:demo-seattle", "Seattle", "WA", "US", 47.6062, -122.3321, 149],
      ["jambase:demo-tokyo", "Tokyo", undefined, "JP", 35.6762, 139.6503, 128],
      ["jambase:demo-mexico-city", "Mexico City", undefined, "MX", 19.4326, -99.1332, 112],
      ["jambase:demo-toronto", "Toronto", "ON", "CA", 43.6532, -79.3832, 104],
      ["jambase:demo-sydney", "Sydney", "NSW", "AU", -33.8688, 151.2093, 91],
      ["jambase:demo-berlin", "Berlin", undefined, "DE", 52.52, 13.405, 83],
    ] as const;

    let inserted = 0;
    for (const [jambaseCityId, name, region, countryCode, latitude, longitude, demoCount] of seeds) {
      const existing = await ctx.db
        .query("cities")
        .withIndex("by_jambase_id", (q) => q.eq("jambaseCityId", jambaseCityId))
        .unique();
      if (existing) continue;
      await ctx.db.insert("cities", {
        jambaseCityId,
        name,
        region,
        countryCode,
        latitude,
        longitude,
        demoCount,
        liveCount: 0,
      });
      inserted += 1;
    }
    return { inserted };
  },
});
