import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { accountForToken, endSession, startSession } from "./lib/auth";
import { hashPin, randomHex } from "./lib/crypto";

export const signUp = mutation({
  args: { username: v.string(), pin: v.string() },
  handler: async (ctx, { username: rawUsername, pin }) => {
    const username = rawUsername.trim();
    if (!username) {
      throw new ConvexError("Username is required");
    }
    if (!/^\d{4}$/.test(pin)) {
      throw new ConvexError("PIN must be exactly 4 digits");
    }
    const normalizedUsername = normalizeUsername(username);
    if (await findAccountByUsername(ctx, normalizedUsername)) {
      throw new ConvexError("That username is already taken");
    }
    const pinSalt = randomHex(16);
    const accountId = await ctx.db.insert("accounts", {
      username,
      normalizedUsername,
      pinSalt,
      pinHash: await hashPin(pin, pinSalt),
    });
    return { token: await startSession(ctx, accountId) };
  },
});

export const signIn = mutation({
  args: { username: v.string(), pin: v.string() },
  handler: async (ctx, { username, pin }) => {
    const account = await findAccountByUsername(
      ctx,
      normalizeUsername(username),
    );
    if (
      !account ||
      (await hashPin(pin, account.pinSalt)) !== account.pinHash
    ) {
      throw new ConvexError("Wrong username or PIN");
    }
    return { token: await startSession(ctx, account._id) };
  },
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await endSession(ctx, token);
  },
});

export const me = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    const account = await accountForToken(ctx, token);
    return account && { username: account.username };
  },
});

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function findAccountByUsername(ctx: QueryCtx, normalizedUsername: string) {
  return ctx.db
    .query("accounts")
    .withIndex("by_normalized_username", (q) =>
      q.eq("normalizedUsername", normalizedUsername),
    )
    .unique();
}
