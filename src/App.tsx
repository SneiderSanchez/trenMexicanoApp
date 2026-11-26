import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { AuthScreen } from "./auth/AuthScreen";
import { useSession } from "./auth/session";

export default function App() {
  const { token, setToken } = useSession();
  const me = useQuery(api.accounts.me, { token });
  const signOut = useMutation(api.accounts.signOut);

  // The server no longer accepts this token (signed out elsewhere, reset):
  // forget it so it isn't sent on every load.
  useEffect(() => {
    if (token && me === null) setToken(undefined);
  }, [token, me, setToken]);

  if (me === undefined) {
    return <main className="screen" aria-busy="true" />;
  }
  if (me === null) {
    return <AuthScreen />;
  }

  async function onSignOut() {
    try {
      if (token) await signOut({ token });
    } catch {
      // Offline or server error: still sign out on this phone.
    }
    setToken(undefined);
  }

  return (
    <main className="screen">
      <h1>Tren Mexicano</h1>
      <p>
        Signed in as <strong>{me.username}</strong>
      </p>
      <button onClick={onSignOut}>Sign out</button>
    </main>
  );
}
