'use client'

import { useParams } from "next/navigation";
import FolderPage from "@/components/pages/folder-page";

export default function UnifiedFolderPage() {
    const params = useParams();
    const folderId = params.folderId?.[0] || null;
    return <FolderPage folderId={folderId}/>;
}