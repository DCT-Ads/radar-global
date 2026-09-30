-- CreateTable
CREATE TABLE "SalesAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "market" TEXT,
    "stage" TEXT,
    "whyRising" TEXT,
    "format" TEXT,
    "language" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "headlines" JSONB NOT NULL,
    "body" TEXT NOT NULL,
    "ctas" JSONB NOT NULL,
    "shortCopy" TEXT NOT NULL,
    "longCopy" TEXT NOT NULL,
    "presellTemplate" TEXT,
    "mediaUrl" TEXT,
    "checkoutUrl" TEXT,
    "headlineIndex" INTEGER NOT NULL DEFAULT 0,
    "ctaIndex" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesAsset_slug_key" ON "SalesAsset"("slug");

-- CreateIndex
CREATE INDEX "SalesAsset_userId_updatedAt_idx" ON "SalesAsset"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "SalesAsset" ADD CONSTRAINT "SalesAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
