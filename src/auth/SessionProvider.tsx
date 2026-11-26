import { useCallback, useMemo, useState, type ReactNode } from "react";
import { SessionContext } from "./session";

const STORAGE_KEY = "tren-mexicano.sessionToken";

/** Keeps the session token on this device so the Account stays signed in. */
export function SessionProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [token, setToken] = useState<string | undefined>(
    () => localStorage.getItem(STORAGE_KEY) ?? undefined,
  );
  const storeToken = useCallback((next: string | undefined) => {
    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);
    setToken(next);
  }, []);
  const session = useMemo(
    () => ({ token, setToken: storeToken }),
    [token, storeToken],
  );
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}
