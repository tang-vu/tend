import "server-only";

import { cookies } from "next/headers";
import {
  CREATOR_SESSION_COOKIE,
  CREATOR_SESSION_MAX_AGE_SECONDS,
  createCreatorSessionToken,
  readCreatorAuthConfig,
  verifyCreatorSessionToken,
} from "./creator-auth-core";

export function creatorAuthConfigured(): boolean {
  return readCreatorAuthConfig(process.env) !== null;
}

export async function readCreatorSession() {
  const config = readCreatorAuthConfig(process.env);
  if (!config) return null;
  const token = (await cookies()).get(CREATOR_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyCreatorSessionToken(token, config.sessionSecret);
}

export async function startCreatorSession(): Promise<boolean> {
  const config = readCreatorAuthConfig(process.env);
  if (!config) return false;
  const cookieStore = await cookies();
  cookieStore.set(
    CREATOR_SESSION_COOKIE,
    await createCreatorSessionToken(config.sessionSecret),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: CREATOR_SESSION_MAX_AGE_SECONDS,
      priority: "high",
    },
  );
  return true;
}

export async function endCreatorSession(): Promise<void> {
  (await cookies()).set(CREATOR_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
}
