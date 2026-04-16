-- Remove soft delete columns (ativo) from all tables
-- Data is permanently deleted now instead of being marked inactive

-- AlterTable
ALTER TABLE "crianca" DROP COLUMN "ativo";

-- AlterTable
ALTER TABLE "doacao" DROP COLUMN "ativo";

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "ativo";
