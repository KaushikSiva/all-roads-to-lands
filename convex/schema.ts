import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cities: defineTable({
    jambaseCityId: v.string(),
    name: v.string(),
    region: v.optional(v.string()),
    countryCode: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    metroName: v.optional(v.string()),
    upcomingEvents: v.optional(v.number()),
    demoCount: v.number(),
    liveCount: v.number(),
    media: v.optional(v.object({
      imageUrl: v.string(),
      eventName: v.string(),
      eventUrl: v.string(),
      artistName: v.optional(v.string()),
    })),
  })
    .index("by_jambase_id", ["jambaseCityId"])
    .index("by_live_count", ["liveCount"]),

  artists: defineTable({
    jambaseArtistId: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    artistUrl: v.optional(v.string()),
    upcomingEvents: v.optional(v.number()),
    demoCount: v.number(),
    liveCount: v.number(),
  })
    .index("by_jambase_id", ["jambaseArtistId"])
    .index("by_demo_count_and_live_count", ["demoCount", "liveCount"]),

  submissions: defineTable({
    participantId: v.string(),
    cityId: v.id("cities"),
    artistId: v.optional(v.id("artists")),
    updatedAt: v.number(),
  })
    .index("by_participant", ["participantId"])
    .index("by_updated_at", ["updatedAt"]),
});
