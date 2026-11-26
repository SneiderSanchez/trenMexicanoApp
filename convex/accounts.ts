import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import { MAX_USERNAME_LENGTH } from "./lib/accountRules";
import { accountForToken, endSession, startSession } from "./lib/auth";
import { hashPin, randomHex } from "./lib/crypto";

export const signUp = mutation({
  args: { username: v.string(), pin: v.string() },
  handler: async (ctx, { username: rawUsername, pin }) => {
    const username = rawUsername.trim().normalize("NFC");
    if (!username) {
      throw new ConvexError("Escribe un nombre de usuario");
    }
    // Counts characters, not UTF-16 units, so "é" is one.
    if ([...username].length > MAX_USERNAME_LENGTH) {
      throw new ConvexError(
        `El nombre de usuario puede tener como máximo ${MAX_USERNAME_LENGTH} caracteres`,
      );
    }
    if (!/^\d{4}$/.test(pin)) {
      throw new ConvexError("El PIN debe tener exactamente 4 dígitos");
    }
    const normalizedUsername = normalizeUsername(username);
    if (await findAccountByUsername(ctx, normalizedUsername)) {
      throw new ConvexError("Ese nombre de usuario ya está en uso");
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

const MAX_FAILED_PIN_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
// Same message for an unknown username and a wrong PIN.
const WRONG_USERNAME_OR_PIN = "Usuario o PIN incorrecto";

/**
 * An action rather than a mutation: a mutation that throws rolls back its
 * writes, so the failed attempt would never be counted. The internal
 * mutation records the attempt and reports the outcome; this throws after.
 */
export const signIn = action({
  args: { username: v.string(), pin: v.string() },
  handler: async (ctx, args): Promise<{ token: string }> => {
    const result = await ctx.runMutation(internal.accounts.attemptSignIn, args);
    if ("error" in result) throw new ConvexError(result.error);
    return result;
  },
});

export const attemptSignIn = internalMutation({
  args: { username: v.string(), pin: v.string() },
  handler: async (
    ctx,
    { username, pin },
  ): Promise<{ token: string } | { error: string }> => {
    const account = await findAccountByUsername(
      ctx,
      normalizeUsername(username),
    );
    if (!account) return { error: WRONG_USERNAME_OR_PIN };

    const now = Date.now();
    if (account.lockedUntil !== undefined && now < account.lockedUntil) {
      const minutes = Math.ceil((account.lockedUntil - now) / 60_000);
      return {
        error: `Demasiados intentos con PIN incorrecto. Inténtalo de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.`,
      };
    }

    if ((await hashPin(pin, account.pinSalt)) !== account.pinHash) {
      const failedPinAttempts = (account.failedPinAttempts ?? 0) + 1;
      await ctx.db.patch(
        account._id,
        failedPinAttempts >= MAX_FAILED_PIN_ATTEMPTS
          ? { failedPinAttempts: 0, lockedUntil: now + LOCKOUT_MS }
          : { failedPinAttempts },
      );
      return { error: WRONG_USERNAME_OR_PIN };
    }

    await ctx.db.patch(account._id, {
      failedPinAttempts: 0,
      lockedUntil: undefined,
    });
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

/** Accents typed by different keyboards (é vs e + ◌́) compare equal after NFC. */
function normalizeUsername(username: string): string {
  return username.trim().normalize("NFC").toLowerCase();
}

function findAccountByUsername(ctx: QueryCtx, normalizedUsername: string) {
  return ctx.db
    .query("accounts")
    .withIndex("by_normalized_username", (q) =>
      q.eq("normalizedUsername", normalizedUsername),
    )
    .unique();
}
