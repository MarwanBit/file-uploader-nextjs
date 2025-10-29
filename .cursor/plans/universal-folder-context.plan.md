<!-- ecdcada8-9f92-4371-b2bd-15bd65bb19ff 9d713f15-87df-49f9-9482-c36222527edd -->
# Universal Folder Context Refactoring

## Overview

Currently, `NewFolderButton` uses `window.location.reload()` to update the UI after folder creation. This approach is slow and loses application state. We'll extend the existing `FolderContext` (currently only used for shared views) to also handle authenticated views, providing a universal `refetchFolderContents` function that all operation components can use.

## Problem

- `NewFolderButton` uses full page reload (`window.location.reload()`)
- `NewFileButton` doesn't update UI after upload (file doesn't appear)
- `DeleteFileButton` and `DeleteFolderButton` don't update UI after deletion
- `FolderPage` and `AppSidebar` can't share state (siblings in component tree)
- `FolderContext` only works for shared views, not authenticated views

## Component Hierarchy

```
layout.tsx (authenticated)
├── AppSidebar (has operation buttons)
└── page.tsx → FolderPage (displays files/folders)
```

## Implementation Steps

### 1. Extend FolderContext (src/contexts/folder-context.tsx)

Add new state and functionality to support authenticated views:

```typescript
export interface FolderContextProps {
  // Existing shared view props
  rootFolder: Folder | null;
  setRootFolder: React.Dispatch<React.SetStateAction<Folder | null>>;
  currentFolder: Folder | null;
  setCurrentFolder: React.Dispatch<React.SetStateAction<Folder | null>>;
  shareToken: string | null;
  setShareToken: React.Dispatch<React.SetStateAction<string | null>>;
  folderMap: Record<string, Folder>;
  setFolderMap: React.Dispatch<React.SetStateAction<Record<string, Folder>>>;
  isLoading: boolean;
  
  // NEW: Add these for authenticated views
  files: File[] | null;
  setFiles: React.Dispatch<React.SetStateAction<File[] | null>>;
  subfolders: Folder[] | null;
  setSubfolders: React.Dispatch<React.SetStateAction<Folder[] | null>>;
  currentFolderId: string | null;
  setCurrentFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  refetchFolderContents: () => Promise<void>;
}
```

Update `FolderProvider` to:

- Accept `initialFolderId` prop
- Add state for files, subfolders, and currentFolderId
- Create `refetchFolderContents` function that works for both authenticated and shared views
- Use `useCallback` with `[currentFolderId, shareToken]` dependencies
- Call refetch in `useEffect` when `currentFolderId` changes

### 2. Wrap Authenticated Layout (src/app/(frontend)/folders/layout.tsx)

Wrap the entire layout with `FolderProvider`:

```typescript
import { FolderProvider } from "@/contexts/folder-context";

export default async function RootLayout({ children, params }) {
  const { folderId } = await params;
  const folderIdValue = folderId ? folderId[0] : null;
  
  return (
    <FolderProvider initialFolderId={folderIdValue}>
      <SidebarProvider>        
        <AppSidebar folderId={folderIdValue} shareToken={null}/>
        <SidebarTrigger />
        {children}
        <Toaster richColors position="top-right"/>
      </SidebarProvider>
    </FolderProvider>
  );
}
```

### 3. Simplify FolderPage (src/components/pages/folder-page.tsx)

Remove local fetching logic and consume from context:

```typescript
export default function FolderPage({ folderId = null }: FolderPageProps) {
  const { 
    files, 
    subfolders, 
    isLoading,
    currentFolderId,
    setCurrentFolderId 
  } = useFolder();
  
  // Only keep UI state (selectedFile, isSidebarOpen)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  
  // Sync prop with context when it changes
  useEffect(() => {
    if (folderId !== currentFolderId) {
      setCurrentFolderId(folderId);
    }
  }, [folderId, currentFolderId, setCurrentFolderId]);
  
  // Remove: fetchFolderContents, files state, subFolders state, isLoading state
  // All now come from context
}
```

### 4. Update NewFolderButton (src/components/features/new-folder-button/new-folder-button.tsx)

Replace `window.location.reload()` with context refetch:

```typescript
export default function NewFolderButton({ readOnly, folderId }) {
  const { refetchFolderContents } = useFolder();
  
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await FolderApiService.createFolder(folderName, currentFolderId);
      toast.success(`Folder "${folderName}" created!`);
      setFolderName("");
      
      // Replace window.location.reload() with:
      await refetchFolderContents();
    } catch {
      toast.error("Something went wrong while creating the folder.");
    }
  }
}
```

### 5. Update NewFileButton (src/components/features/new-file-button/new-file-button.tsx)

Add refetch after successful upload (currently missing):

```typescript
export default function NewFileButton({ readOnly }) {
  const { refetchFolderContents } = useFolder();
  
  const handleUpload = async () => {
    // ... existing upload logic ...
    try {
      await FileApiService.uploadFile(folderId, formData);
      toast.success(`File ${file.name} created successfully!`);
      
      // ADD: Refetch to show new file
      await refetchFolderContents();
    } catch (error) {
      // ... error handling ...
    }
  }
}
```

### 6. Update DeleteFileButton (src/components/features/delete-file-button/delete-file-button.tsx)

Add refetch and sidebar close callback:

```typescript
export default function DeleteFileButton({ file, readOnly, onDeleted }) {
  const { refetchFolderContents } = useFolder();
  
  const deleteFileController = async (fileId: string | null) => {
    try {
      await FileApiService.deleteFile(fileId as string);
      toast.success(`File ${file?.file_name} deleted successfully!`);
      
      // ADD: Refetch and close sidebar
      await refetchFolderContents();
      if (onDeleted) onDeleted();
    } catch (error) {
      // ... error handling ...
    }
  }
}
```

Pass `onDeleted` from `FileSidebar` to close after deletion.

### 7. Update DeleteFolderButton (src/components/features/delete-folder-button/delete-folder-button.tsx)

Add refetch and navigation:

```typescript
export default function DeleteFolderButton({ readOnly }) {
  const { refetchFolderContents } = useFolder();
  const router = useRouter();
  
  const HandleDeleteFolder = async (folderId: string) => {
    try {
      await FolderApiService.deleteFolder(folderId);
      toast.success(`Successfully deleted the folder!`);
      
      // ADD: Navigate to parent and refetch
      router.push('/folders');
      await refetchFolderContents();
    } catch (error) {
      // ... error handling ...
    }
  }
}
```

## Benefits

- No more page reloads (better UX, faster, maintains state)
- All operations automatically update UI
- Database is always source of truth
- No prop drilling needed
- Consistent pattern for all operation buttons
- Works for both authenticated and shared views

## Testing Considerations

- Verify shared folder view still works correctly
- Test all operations update UI without reload
- Ensure folderId changes trigger refetch
- Check that loading states display properly

### To-dos

- [ ] Extend FolderContext interface and provider to support authenticated views with files, subfolders, currentFolderId state and refetchFolderContents function
- [ ] Wrap the authenticated layout with FolderProvider, passing initialFolderId prop
- [ ] Refactor FolderPage to consume state from context instead of managing its own fetching logic
- [ ] Replace window.location.reload() with refetchFolderContents from context in NewFolderButton
- [ ] Add refetchFolderContents call after successful file upload in NewFileButton
- [ ] Add refetchFolderContents call after file deletion in DeleteFileButton
- [ ] Add refetchFolderContents call and navigation after folder deletion in DeleteFolderButton
- [ ] Test that shared folder view at src/app/(frontend)/shared/folder/[shareToken]/layout.tsx still works correctly