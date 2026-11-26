import { useState, type SubmitEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";
import { useSession } from "./session";

type Mode = "signIn" | "signUp";

export function AuthScreen() {
  const { setToken } = useSession();
  const signIn = useMutation(api.accounts.signIn);
  const signUp = useMutation(api.accounts.signUp);
  const [mode, setMode] = useState<Mode>("signIn");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const submit = mode === "signIn" ? signIn : signUp;
      const { token } = await submit({ username, pin });
      setToken(token);
    } catch (e) {
      setError(
        e instanceof ConvexError
          ? String(e.data)
          : "Something went wrong. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <main className="screen">
      <h1>Tren Mexicano</h1>
      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={mode === "signIn"}
          onClick={() => switchMode("signIn")}
        >
          Sign in
        </button>
        <button
          role="tab"
          aria-selected={mode === "signUp"}
          onClick={() => switchMode("signUp")}
        >
          Sign up
        </button>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <label>
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            required
          />
        </label>
        <label>
          <span>4-digit PIN</span>
          <input
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            autoComplete={
              mode === "signIn" ? "current-password" : "new-password"
            }
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" type="submit" disabled={busy}>
          {mode === "signIn" ? "Sign in" : "Create Account"}
        </button>
      </form>
    </main>
  );
}
