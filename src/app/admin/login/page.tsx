import { headers } from "next/headers";
import { normalizeHostToDomain } from "@/lib/tenant";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const headersList = await headers();
  const domain = normalizeHostToDomain(headersList.get("host")) ?? "";
  return <LoginClient domain={domain} />;
}
