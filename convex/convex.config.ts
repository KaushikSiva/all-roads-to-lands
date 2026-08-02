import { defineApp } from "convex/server";
import { v } from "convex/values";

export default defineApp({
  env: {
    JAMBASE_API_KEY: v.string(),
  },
});
