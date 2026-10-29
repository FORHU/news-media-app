-- CreateTable
-- Append-only history of General Publish actions. broadcast_id is intentionally
-- not a foreign key so the trail survives deleting the broadcast.
CREATE TABLE "general_publish_audit" (
    "id" TEXT NOT NULL,
    "broadcast_id" TEXT NOT NULL,
    "broadcast_title" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_email" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "general_publish_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "general_publish_audit_broadcast_id_created_at_idx" ON "general_publish_audit"("broadcast_id", "created_at");

-- CreateIndex
CREATE INDEX "general_publish_audit_created_at_idx" ON "general_publish_audit"("created_at");
