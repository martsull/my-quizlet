-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "card_count" INTEGER NOT NULL DEFAULT 0,
    "last_reorganized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "russian" TEXT NOT NULL,
    "pronunciation" TEXT,
    "example_en" TEXT,
    "example_ru" TEXT,
    "category_id" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "idx_cards_category" ON "cards"("category_id");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
