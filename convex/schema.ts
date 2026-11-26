import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  accounts: defineTable({
    username: v.string(),
    normalizedUsername: v.string(),
    pinHash: v.string(),
    pinSalt: v.string(),
    // Wrong PINs in a row since the last successful sign-in or lockout.
    failedPinAttempts: v.optional(v.number()),
    // Sign-in is refused until this time (ms since epoch).
    lockedUntil: v.optional(v.number()),
  }).index("by_normalized_username", ["normalizedUsername"]),

  sessions: defineTable({
    token: v.string(),
    accountId: v.id("accounts"),
  }).index("by_token", ["token"]),
});
