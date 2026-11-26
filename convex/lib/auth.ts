import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { randomHex } from "./crypto";

export async function startSession(
  ctx: MutationCtx,
  accountId: Id<"accounts">,
): Promise<string> {
  const token = randomHex(32);
  await ctx.db.insert("sessions", { token, accountId });
  return token;
}

export async function endSession(ctx: MutationCtx, token: string) {
  const session = await findSession(ctx, token);
  if (session) await ctx.db.delete(session._id);
}

/** Turns a session token into the signed-in Account, or null. */
export async function accountForToken(
  ctx: QueryCtx,
  token: string | undefined,
): Promise<Doc<"accounts"> | null> {
  if (!token) return null;
  const session = await findSession(ctx, token);
  return session && (await ctx.db.get(session.accountId));
}

function findSession(ctx: QueryCtx, token: string) {
  return ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
}
