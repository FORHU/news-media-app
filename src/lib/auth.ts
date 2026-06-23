import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable must be set — admin/moderator auth cannot run without it."
  );
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const ALGORITHM = "HS256";
const EXPIRY = "24h";

export type AdminJwtPayload = {
  sub: string;   // user id
  email: string;
  tenantId: string;
  role: string;
};

export async function signAdminJwt(payload: AdminJwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

export async function verifyAdminJwt(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALGORITHM] });
    return payload as unknown as AdminJwtPayload;
  } catch {
    return null;
  }
}

export const ADMIN_JWT_COOKIE = "admin_token";
export const ADMIN_ROLE_COOKIE = "admin_verified";
