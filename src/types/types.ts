export type Folder = {
    id: string;
    folder_name: string;
    created_at: Date;
    updated_at: Date;
    is_root: boolean;
    s3_link: string | null;
    shared: boolean;
    expires_at: Date | null;
    owner_clerk_id: string;
    // just added these
    parent_folder_id: string | null | undefined;
    subfolders: Folder[];
    files?: File[];
}

export type File = {
    id: string;
    file_name: string;
    size: number;
    created_at: Date;
    shared: boolean;
    s3_link: string | null;
    s3_key: string | null;
    expires_at: Date | null;
    parent_folder_id: string | null;
    owner_clerk_id: string;
}