-- This is an empty migration.
CREATE UNIQUE INDEX unique_root_folder_per_user
ON "Folder" (owner_clerk_id)
WHERE is_root = true;