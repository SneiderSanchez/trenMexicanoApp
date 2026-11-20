# Convex backend with username + PIN accounts

Every Player joins a Game from their own phone and sees scores update live, so the app needs a realtime backend. We chose Convex because the team works in TypeScript: backend functions, schema and types live in the same language as the React frontend, and reactive queries give live sync without hand-written WebSocket or subscription code. The free tier covers family-sized usage.

Accounts are a username plus a 4-digit PIN rather than anonymous device identities or full email/password/OAuth accounts. Games are stored per Account from day one so stats can be added later; anonymous identities would lose history when browser data is cleared, and full accounts are too much friction for family members at the table. A PIN is not strong security, and that is accepted: the goal is to prevent accidental or joking use of someone else's name, not to resist attackers.

## Considered Options

- **Supabase / Firebase**: viable realtime stacks, but they require SQL/RLS policies or a weakly typed document model, which is more friction for a TS-first developer.
- **Custom Node + WebSocket server**: full control, but means hosting a server and handling reconnects ourselves.
- **Username only (no PIN)**: anyone typing a name becomes that person, corrupting history and future stats.
