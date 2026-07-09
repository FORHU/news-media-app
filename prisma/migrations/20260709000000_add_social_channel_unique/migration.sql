-- CreateIndex
-- SocialChannel currently has no rows in any environment (feature was scaffolded
-- but never wired up), so this unique index is safe to add directly.
CREATE UNIQUE INDEX "social_channels_tenant_id_social_media_name_key" ON "social_channels"("tenant_id", "social_media_name");
