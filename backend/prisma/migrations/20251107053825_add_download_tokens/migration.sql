-- CreateEnum
CREATE TYPE "TokenPurpose" AS ENUM ('PREVIEW', 'DOWNLOAD');

-- CreateTable
CREATE TABLE "download_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" "TokenPurpose" NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "download_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "download_tokens_token_key" ON "download_tokens"("token");

-- CreateIndex
CREATE INDEX "download_tokens_token_idx" ON "download_tokens"("token");

-- CreateIndex
CREATE INDEX "download_tokens_document_id_idx" ON "download_tokens"("document_id");

-- CreateIndex
CREATE INDEX "download_tokens_user_id_idx" ON "download_tokens"("user_id");

-- CreateIndex
CREATE INDEX "download_tokens_expires_at_idx" ON "download_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "download_tokens" ADD CONSTRAINT "download_tokens_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_tokens" ADD CONSTRAINT "download_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
