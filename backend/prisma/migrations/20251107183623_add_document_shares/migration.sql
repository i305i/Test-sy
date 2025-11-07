-- CreateTable
CREATE TABLE "document_shares" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "shared_with_user_id" TEXT NOT NULL,
    "shared_by_user_id" TEXT NOT NULL,
    "permission_level" "PermissionLevel" NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "status" "ShareStatus" NOT NULL DEFAULT 'ACTIVE',
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "document_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_shares_document_id_idx" ON "document_shares"("document_id");

-- CreateIndex
CREATE INDEX "document_shares_shared_with_user_id_idx" ON "document_shares"("shared_with_user_id");

-- CreateIndex
CREATE INDEX "document_shares_status_idx" ON "document_shares"("status");

-- CreateIndex
CREATE UNIQUE INDEX "document_shares_document_id_shared_with_user_id_key" ON "document_shares"("document_id", "shared_with_user_id");

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_by_user_id_fkey" FOREIGN KEY ("shared_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
