/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function setup() {
  return convexTest(schema, modules);
}

describe("Accounts", () => {
  test("signing up returns a token that identifies the new Account", async () => {
    const t = setup();
    const { token } = await t.mutation(api.accounts.signUp, {
      username: "Abuela",
      pin: "1234",
    });
    const me = await t.query(api.accounts.me, { token });
    expect(me).toEqual({ username: "Abuela" });
  });

  test.each(["123", "12345", "abcd", "12a4", " 1234", ""])(
    "signing up with PIN %j is rejected",
    async (pin) => {
      const t = setup();
      await expect(
        t.mutation(api.accounts.signUp, { username: "Tio", pin }),
      ).rejects.toThrow(/PIN must be exactly 4 digits/);
    },
  );

  test("a username already taken in any letter case is rejected", async () => {
    const t = setup();
    await t.mutation(api.accounts.signUp, { username: "Abuela", pin: "1234" });
    await expect(
      t.mutation(api.accounts.signUp, { username: "abuela", pin: "9999" }),
    ).rejects.toThrow(/username is already taken/);
  });

  test("signing in with the right PIN, in any letter case, returns a token for the Account", async () => {
    const t = setup();
    await t.mutation(api.accounts.signUp, { username: "Abuela", pin: "1234" });
    const { token } = await t.action(api.accounts.signIn, {
      username: "ABUELA",
      pin: "1234",
    });
    expect(await t.query(api.accounts.me, { token })).toEqual({
      username: "Abuela",
    });
  });

  test("signing in with a wrong PIN is rejected", async () => {
    const t = setup();
    await t.mutation(api.accounts.signUp, { username: "Abuela", pin: "1234" });
    await expect(
      t.action(api.accounts.signIn, { username: "Abuela", pin: "4321" }),
    ).rejects.toThrow(/Wrong username or PIN/);
  });

  test("signing in with an unknown username is rejected", async () => {
    const t = setup();
    await expect(
      t.action(api.accounts.signIn, { username: "Nadie", pin: "1234" }),
    ).rejects.toThrow(/Wrong username or PIN/);
  });

  test("signing out invalidates the token", async () => {
    const t = setup();
    const { token } = await t.mutation(api.accounts.signUp, {
      username: "Abuela",
      pin: "1234",
    });
    await t.mutation(api.accounts.signOut, { token });
    expect(await t.query(api.accounts.me, { token })).toBeNull();
  });

  test("signing out one phone leaves other signed-in phones alone", async () => {
    const t = setup();
    const { token: phoneA } = await t.mutation(api.accounts.signUp, {
      username: "Abuela",
      pin: "1234",
    });
    const { token: phoneB } = await t.action(api.accounts.signIn, {
      username: "Abuela",
      pin: "1234",
    });
    await t.mutation(api.accounts.signOut, { token: phoneA });
    expect(await t.query(api.accounts.me, { token: phoneB })).toEqual({
      username: "Abuela",
    });
  });

  test("nobody is signed in without a valid token", async () => {
    const t = setup();
    expect(await t.query(api.accounts.me, {})).toBeNull();
    expect(await t.query(api.accounts.me, { token: "made-up" })).toBeNull();
  });

  test.each(["", "   "])("signing up with blank username %j is rejected", async (username) => {
    const t = setup();
    await expect(
      t.mutation(api.accounts.signUp, { username, pin: "1234" }),
    ).rejects.toThrow(/Username is required/);
  });

  test("a username can have at most 20 characters", async () => {
    const t = setup();
    await expect(
      t.mutation(api.accounts.signUp, { username: "A".repeat(21), pin: "1234" }),
    ).rejects.toThrow(/at most 20 characters/);
    // Accented letters count as one character each.
    await t.mutation(api.accounts.signUp, {
      username: "é".repeat(20),
      pin: "1234",
    });
  });

  test("surrounding spaces are ignored in usernames", async () => {
    const t = setup();
    const { token } = await t.mutation(api.accounts.signUp, {
      username: " Abuela ",
      pin: "1234",
    });
    expect(await t.query(api.accounts.me, { token })).toEqual({
      username: "Abuela",
    });
    await expect(
      t.mutation(api.accounts.signUp, { username: "abuela", pin: "1234" }),
    ).rejects.toThrow(/username is already taken/);
    await t.action(api.accounts.signIn, { username: "abuela ", pin: "1234" });
  });

  test("an accented username matches however the keyboard encodes the accent", async () => {
    const t = setup();
    const decomposed = "José"; // "José" as e + combining acute accent
    const precomposed = "José"; // "José" as a single é
    await t.mutation(api.accounts.signUp, { username: decomposed, pin: "1234" });
    const { token } = await t.action(api.accounts.signIn, {
      username: precomposed,
      pin: "1234",
    });
    expect(await t.query(api.accounts.me, { token })).toEqual({
      username: precomposed,
    });
    await expect(
      t.mutation(api.accounts.signUp, { username: precomposed, pin: "1234" }),
    ).rejects.toThrow(/username is already taken/);
  });
});

describe("PIN lockout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  async function failSignIns(t: ReturnType<typeof setup>, times: number) {
    for (let i = 0; i < times; i++) {
      await expect(
        t.action(api.accounts.signIn, { username: "Abuela", pin: "0000" }),
      ).rejects.toThrow(/Wrong username or PIN/);
    }
  }

  test("after 5 wrong PINs in a row, even the right PIN is rejected", async () => {
    const t = setup();
    await t.mutation(api.accounts.signUp, { username: "Abuela", pin: "1234" });
    await failSignIns(t, 5);
    await expect(
      t.action(api.accounts.signIn, { username: "Abuela", pin: "1234" }),
    ).rejects.toThrow(/Too many wrong PINs/);
  });

  test("the lockout ends after 5 minutes", async () => {
    vi.useFakeTimers();
    const t = setup();
    await t.mutation(api.accounts.signUp, { username: "Abuela", pin: "1234" });
    await failSignIns(t, 5);

    vi.advanceTimersByTime(4.5 * 60 * 1000);
    await expect(
      t.action(api.accounts.signIn, { username: "Abuela", pin: "1234" }),
    ).rejects.toThrow(/Too many wrong PINs. Try again in 1 minute\./);

    vi.advanceTimersByTime(31 * 1000); // just past the 5-minute mark
    const { token } = await t.action(api.accounts.signIn, {
      username: "Abuela",
      pin: "1234",
    });
    expect(await t.query(api.accounts.me, { token })).toEqual({
      username: "Abuela",
    });
  });

  test("signing in with the right PIN resets the count of wrong PINs", async () => {
    const t = setup();
    await t.mutation(api.accounts.signUp, { username: "Abuela", pin: "1234" });
    await failSignIns(t, 4);
    await t.action(api.accounts.signIn, { username: "Abuela", pin: "1234" });
    await failSignIns(t, 4);
    await t.action(api.accounts.signIn, { username: "Abuela", pin: "1234" });
  });
});
