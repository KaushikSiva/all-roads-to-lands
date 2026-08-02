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

  submissions: defineTable({
    participantId: v.string(),
    cityId: v.id("cities"),
    updatedAt: v.number(),
  })
    .index("by_participant", ["participantId"])
    .index("by_updated_at", ["updatedAt"]),
});
