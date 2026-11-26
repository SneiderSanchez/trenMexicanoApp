import { createContext, useContext } from "react";

export type Session = {
  token: string | undefined;
  setToken: (token: string | undefined) => void;
};

export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside SessionProvider");
  return session;
}
