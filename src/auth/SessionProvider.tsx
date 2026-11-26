import { useCallback, useMemo, useState, type ReactNode } from "react";
import { SessionContext } from "./session";

const STORAGE_KEY = "tren-mexicano.sessionToken";

// Browsers that block storage (e.g. Safari "Block all cookies") throw on
// access; the token then lives in memory only, for this visit.
function readStoredToken(): string | undefined {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeStoredToken(token: string | undefined) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: keep the token in memory only.
  }
}

/** Keeps the session token on this device so the Account stays signed in. */
export function SessionProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [token, setToken] = useState<string | undefined>(readStoredToken);
  const storeToken = useCallback((next: string | undefined) => {
    writeStoredToken(next);
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
