-- AlterTable
ALTER TABLE "doacao" ALTER COLUMN "valor" DROP NOT NULL;

-- AlterTable
ALTER TABLE "frequencia" ADD COLUMN     "observacao" TEXT,
ADD COLUMN     "turno" TEXT;
