-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "folder_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_root" BOOLEAN NOT NULL DEFAULT false,
    "s3_link" TEXT,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "parent_folder_id" TEXT,
    "owner_clerk_id" TEXT NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "s3_link" TEXT,
    "expires_at" TIMESTAMP(3),
    "parent_folder_id" TEXT,
    "owner_clerk_id" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
