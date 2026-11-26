import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { AuthScreen } from "./auth/AuthScreen";
import { useSession } from "./auth/session";

export default function App() {
  const { token, setToken } = useSession();
  const me = useQuery(api.accounts.me, { token });
  const signOut = useMutation(api.accounts.signOut);

  if (me === undefined) {
    return <main className="screen" aria-busy="true" />;
  }
  if (me === null) {
    return <AuthScreen />;
  }

  async function onSignOut() {
    if (token) await signOut({ token });
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
