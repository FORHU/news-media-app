import { createHash } from "crypto";
import { prisma } from "@/lib/db";

export type ApiKeyPayload = {
  tenantId: string;
  sourceName: string;
  keyId: string;
};

export async function verifyApiKey(rawKey: string): Promise<ApiKeyPayload | null> {
  if (!rawKey) return null;
  const hashed = createHash("sha256").update(rawKey).digest("hex");
  const record = await prisma.apiKey.findFirst({
    where: {
      key: hashed,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true, tenantId: true, sourceName: true },
  });
  if (!record) return null;
  return { tenantId: record.tenantId, sourceName: record.sourceName, keyId: record.id };
}
