-- AlterTable
ALTER TABLE "File" ADD COLUMN     "s3_key" TEXT;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "s3_key" TEXT;
