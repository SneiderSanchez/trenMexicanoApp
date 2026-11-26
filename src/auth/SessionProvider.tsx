import { useCallback, useMemo, useState, type ReactNode } from "react";
import { SessionContext } from "./session";

const STORAGE_KEY = "tren-mexicano.sessionToken";

/** Keeps the session token on this device so the Account stays signed in. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | undefined>(
    () => localStorage.getItem(STORAGE_KEY) ?? undefined,
  );
  const setToken = useCallback((next: string | undefined) => {
    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);
    setTokenState(next);
  }, []);
  const session = useMemo(() => ({ token, setToken }), [token, setToken]);
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}
