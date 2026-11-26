import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  accounts: defineTable({
    username: v.string(),
    normalizedUsername: v.string(),
    pinHash: v.string(),
    pinSalt: v.string(),
  }).index("by_normalized_username", ["normalizedUsername"]),

  sessions: defineTable({
    token: v.string(),
    accountId: v.id("accounts"),
  }).index("by_token", ["token"]),
});
