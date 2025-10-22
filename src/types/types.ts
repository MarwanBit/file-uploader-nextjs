export type Folder = {
    id: string;
    folder_name: string;
    created_at: Date;
    updated_at: Date;
    is_root: boolean;
    s3_link: string | undefined;
    shared: boolean;
    expires_at: Date | undefined;
    owner_clerk_id: string;
    // just added these
    parent_folder_id?: string;
    subfolders: Folder[];
    files?: File[];
}

export type File = {
    id: string;
    file_name: string;
    size: number;
    created_at: Date;
    shared: boolean;
    s3_link: string | undefined;
    expires_at: Date | undefined;
    parent_folder_id: string | undefined;
    owner_clerk_id: string;
}