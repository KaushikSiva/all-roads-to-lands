import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const storeMedia = internalMutation({
  args: {
    jambaseCityId: v.string(),
    imageUrl: v.string(),
    eventName: v.string(),
    eventUrl: v.string(),
    artistName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const city = await ctx.db
      .query("cities")
      .withIndex("by_jambase_id", (q) => q.eq("jambaseCityId", args.jambaseCityId))
      .unique();
    if (!city) return false;
    await ctx.db.patch(city._id, {
      media: {
        imageUrl: args.imageUrl,
        eventName: args.eventName,
        eventUrl: args.eventUrl,
        artistName: args.artistName,
      },
    });
    return true;
  },
});

export const seedCity = internalMutation({
  args: {
    jambaseCityId: v.string(),
    name: v.string(),
    region: v.optional(v.string()),
    countryCode: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    metroName: v.optional(v.string()),
    upcomingEvents: v.optional(v.number()),
    demoCount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cities")
      .withIndex("by_jambase_id", (q) => q.eq("jambaseCityId", args.jambaseCityId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        liveCount: existing.liveCount,
      });
      return existing._id;
    }
    return await ctx.db.insert("cities", { ...args, liveCount: 0 });
  },
});

export const seedArtist = internalMutation({
  args: {
    jambaseArtistId: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    artistUrl: v.optional(v.string()),
    upcomingEvents: v.optional(v.number()),
    demoCount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("artists")
      .withIndex("by_jambase_id", (q) => q.eq("jambaseArtistId", args.jambaseArtistId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        liveCount: existing.liveCount,
      });
      return existing._id;
    }
    return await ctx.db.insert("artists", { ...args, liveCount: 0 });
  },
});
