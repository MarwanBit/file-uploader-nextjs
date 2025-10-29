<!-- ad136428-03d8-4ed5-b60e-437bc4731ae1 3ff1ad57-cbfa-42e6-bcb7-17a159e5454f -->
# Separate Folder Contexts Refactoring

## Problem

The current `FolderContext` mixes two fundamentally different concerns:

1. **Shared Views**: Tree-based navigation with `rootFolder`, `currentFolder`, `folderMap`, `shareToken`
2. **Authenticated Views**: Directory-based navigation with `files`, `subfolders`, `currentFolderId`

This creates:

- Confusing interfaces with props that only apply to one mode
- Single `isLoading` state that conflates two different operations
- Unclear which props are relevant in which context
- The authenticated `FolderTree` component doesn't even use the context!

## Solution

Create **two separate, focused contexts**:

### 1. SharedFolderContext (for shared views)

- Tree navigation without URL changes
- Uses: `rootFolder`, `currentFolder`, `folderMap`, `shareToken`, `isLoading`
- Navigation: Context-based (clicks update state)

### 2. AuthFolderContext (for authenticated views)

- Directory navigation with URL-based routing
- Uses: `files`, `subfolders`, `currentFolderId`, `isLoading`, `refetchFolderContents`
- Navigation: URL-based (folderId in route)

## Implementation Steps

### Step 1: Create AuthFolderContext (new file)

**File**: `src/contexts/auth-folder-context.tsx`

```typescript
'use client'

import React, { createContext, useState, useEffect, useCallback } from "react";
import { Folder, File } from "@/types/types";
import { FolderApiService } from "@/api-services/folder-api.service";
import { ApiError } from "@/lib/api-client";

export interface AuthFolderContextProps {
    /** Files in the current directory */
    files: File[] | null;
    /** Subfolders in the current directory */
    subfolders: Folder[] | null;
    /** Current folder ID being viewed */
    currentFolderId: string | null;
    /** Loading state for folder contents fetch */
    isLoading: boolean;
    /** Function to refetch current folder contents */
    refetchFolderContents: () => Promise<void>;
    /** Setter for currentFolderId (for prop sync) */
    setCurrentFolderId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AuthFolderContext = createContext<AuthFolderContextProps | null>(null);

export const AuthFolderProvider = ({ 
    children, 
    initialFolderId 
}: { 
    children: React.ReactNode;
    initialFolderId?: string | null;
}) => {
    const [files, setFiles] = useState<File[] | null>(null);
    const [subfolders, setSubfolders] = useState<Folder[] | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId ?? null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const refetchFolderContents = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await FolderApiService.getFolderContents(currentFolderId);
            if (!(data instanceof ApiError)) {
                setSubfolders(data.subfolders);
                setFiles(data.files as File[]);
            }
        } catch (err) {
            console.error("Error fetching folder contents:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentFolderId]);

    // Auto-fetch when currentFolderId changes
    useEffect(() => {
        refetchFolderContents();
    }, [refetchFolderContents]);

    return (
        <AuthFolderContext.Provider value={{
            files,
            subfolders,
            currentFolderId,
            isLoading,
            refetchFolderContents,
            setCurrentFolderId
        }}>
            {children}
        </AuthFolderContext.Provider>
    );
};
```

### Step 2: Rename and Clean Up SharedFolderContext

**File**: `src/contexts/folder-context.tsx` → `src/contexts/shared-folder-context.tsx`

Remove all authenticated-related props and logic:

```typescript
export interface SharedFolderContextProps {
    // Only shared view props - NO authenticated props
    rootFolder: Folder | null;
    setRootFolder: React.Dispatch<React.SetStateAction<Folder | null>>;
    currentFolder: Folder | null;
    setCurrentFolder: React.Dispatch<React.SetStateAction<Folder | null>>;
    shareToken: string | null;
    setShareToken: React.Dispatch<React.SetStateAction<string | null>>;
    folderMap: Record<string, Folder>;
    setFolderMap: React.Dispatch<React.SetStateAction<Record<string, Folder>>>;
    isLoading: boolean;
}

export const SharedFolderContext = createContext<SharedFolderContextProps | null>(null);

export const SharedFolderProvider = ({ children, initialShareToken } : { 
    children : React.ReactNode;
    initialShareToken?: string;
}) => {
    const [rootFolder, setRootFolder] = useState<Folder | null>(null);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [folderMap, setFolderMap] = useState<Record<string, Folder>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Initialize share token
    useEffect(() => {
        if (initialShareToken && !shareToken) {
            setShareToken(initialShareToken);
        }
    }, [initialShareToken, shareToken]);

    // Fetch shared folder tree when token changes
    useEffect(() => {
        const getRootFolderContents = async () => {
            try {
                if (!shareToken) return;
                setIsLoading(true);
                const data = await FolderApiService.getSharedRootFolderContents(shareToken);
                if (!(data instanceof ApiError)) {
                    setRootFolder(data);
                    const newFolderMap = await FolderApiService.constructFolderMap(data);
                    setFolderMap(newFolderMap);
                    setCurrentFolder(data);
                }
            } catch (error) {
                console.error("Error fetching shared folder:", error);
            } finally {
                setIsLoading(false);
            }
        };
        getRootFolderContents();
    }, [shareToken]);

    return (
        <SharedFolderContext.Provider value={{
            rootFolder, setRootFolder, 
            currentFolder, setCurrentFolder,
            shareToken, setShareToken,
            folderMap, setFolderMap,
            isLoading
        }}>
            {children}
        </SharedFolderContext.Provider>
    );
};
```

### Step 3: Create Two Separate Hooks

**File**: `src/hooks/use-auth-folder.ts` (new)

```typescript
import { AuthFolderContext, AuthFolderContextProps } from "@/contexts/auth-folder-context";
import { useContext } from "react";

export const useAuthFolder = (): AuthFolderContextProps => {
    const context = useContext(AuthFolderContext);
    if (!context) {
        throw new Error('useAuthFolder must be used within AuthFolderProvider');
    }
    return context;
};
```

**File**: `src/hooks/use-folder.ts` → `src/hooks/use-shared-folder.ts`

Update to use SharedFolderContext:

```typescript
import { SharedFolderContext, SharedFolderContextProps } from "@/contexts/shared-folder-context";
import { useContext } from "react";

export const useSharedFolder = (): SharedFolderContextProps => {
    const context = useContext(SharedFolderContext);
    if (!context) {
        throw new Error('useSharedFolder must be used within SharedFolderProvider');
    }
    return context;
};
```

### Step 4: Update Shared View Components

Update all shared view components to import from new locations:

**Files to update**:

- `src/app/(frontend)/shared/folder/[shareToken]/layout.tsx` - use `SharedFolderProvider`
- `src/app/(frontend)/shared/folder/[shareToken]/page.tsx` - use `useSharedFolder()`
- `src/components/features/shared-folder-tree/shared-folder-tree.tsx` - use `useSharedFolder()`
- `src/components/features/shared-directory-breadcrumb/shared-directory-breadcrumb.tsx` - use `useSharedFolder()`
- `src/components/features/shared-download-file-button/shared-download-file-button.tsx` - use `useSharedFolder()`
- `src/components/features/shared-folder-table/shared-folder-table.tsx` - use `useSharedFolder()`

Example change:

```typescript
// Before
import { useFolder } from "@/hooks/use-folder";
const { currentFolder, setCurrentFolder, folderMap } = useFolder();

// After
import { useSharedFolder } from "@/hooks/use-shared-folder";
const { currentFolder, setCurrentFolder, folderMap } = useSharedFolder();
```

### Step 5: Wrap Authenticated Layout with AuthFolderProvider

**File**: `src/app/(frontend)/folders/layout.tsx`

```typescript
import { AuthFolderProvider } from "@/contexts/auth-folder-context";

export default async function RootLayout({ children, params }) {
  const { folderId } = await params;
  const folderIdValue = folderId ? folderId[0] : null;
  
  return (
    <AuthFolderProvider initialFolderId={folderIdValue}>
      <SidebarProvider>        
        <AppSidebar folderId={folderIdValue} shareToken={null}/>
        <SidebarTrigger />
        {children}
        <Toaster richColors position="top-right"/>
      </SidebarProvider>
    </AuthFolderProvider>
  );
}
```

### Step 6: Refactor FolderPage to Use AuthFolderContext

**File**: `src/components/pages/folder-page.tsx`

Remove all fetching logic and consume from context:

```typescript
import { useAuthFolder } from "@/hooks/use-auth-folder";

export default function FolderPage({ folderId = null }: FolderPageProps) {
  const { 
    files, 
    subfolders, 
    isLoading,
    currentFolderId,
    setCurrentFolderId 
  } = useAuthFolder();
  
  // Only keep UI state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  
  // Sync folderId prop with context when it changes
  useEffect(() => {
    if (folderId !== currentFolderId) {
      setCurrentFolderId(folderId);
    }
  }, [folderId, currentFolderId, setCurrentFolderId]);
  
  // Remove: fetchFolderContents, files state, subFolders state, isLoading state
  // All now come from context
  
  // Rest of component unchanged...
}
```

### Step 7: Update Operation Components

Update all operation buttons to use `useAuthFolder()`:

**NewFolderButton** (`src/components/features/new-folder-button/new-folder-button.tsx`):

```typescript
import { useAuthFolder } from "@/hooks/use-auth-folder";

const { refetchFolderContents } = useAuthFolder();

// Replace window.location.reload() with:
await refetchFolderContents();
```

**NewFileButton** (`src/components/features/new-file-button/new-file-button.tsx`):

```typescript
import { useAuthFolder } from "@/hooks/use-auth-folder";

const { refetchFolderContents } = useAuthFolder();

// After successful upload:
await refetchFolderContents();
```

**DeleteFileButton** (`src/components/features/delete-file-button/delete-file-button.tsx`):

```typescript
import { useAuthFolder } from "@/hooks/use-auth-folder";

const { refetchFolderContents } = useAuthFolder();

// After deletion:
await refetchFolderContents();
onDeleted?.(); // Close sidebar
```

**DeleteFolderButton** (`src/components/features/delete-folder-button/delete-folder-button.tsx`):

```typescript
import { useAuthFolder } from "@/hooks/use-auth-folder";
import { useRouter } from "next/navigation";

const { refetchFolderContents } = useAuthFolder();
const router = useRouter();

// After deletion:
router.push('/folders');
await refetchFolderContents();
```

### Step 8: Update Test Files

Update imports in test files:

- `src/components/features/shared-folder-table/shared-folder-table.test.tsx`
- `src/components/features/shared-folder-tree/shared-folder-tree.test.tsx`
- `src/components/features/shared-download-file-button/shared-download-file-button.test.tsx`
- `src/components/features/shared-directory-breadcrumb/shared-directory-breadcrumb.test.tsx`

Replace `FolderContext` with `SharedFolderContext` and `FolderProvider` with `SharedFolderProvider`.

### Step 9: Delete Old Hook File

Delete `src/hooks/use-folder.ts` (replaced by `use-shared-folder.ts` and `use-auth-folder.ts`)

## Benefits

✅ **Single Responsibility**: Each context does exactly one thing

✅ **Type Safety**: No nullable props that only exist in one mode

✅ **Clarity**: `useAuthFolder()` vs `useSharedFolder()` - intent is obvious

✅ **No Conditional Logic**: No checking "which mode am I in?"

✅ **Easier Testing**: Each context can be tested independently

✅ **Better Performance**: No unnecessary state updates across unrelated views

✅ **Maintainability**: Changes to one view don't affect the other

## Testing

1. Test authenticated folder operations (create/delete/upload) update UI without reload
2. Test shared folder tree navigation still works correctly
3. Verify both loading states work independently
4. Ensure no console errors about missing context providers
5. Check that all operation buttons work in authenticated view
6. Verify shared view components still work with tree navigation

### To-dos

- [ ] Create new AuthFolderContext in src/contexts/auth-folder-context.tsx with files, subfolders, currentFolderId, isLoading, and refetchFolderContents
- [ ] Rename folder-context.tsx to shared-folder-context.tsx and remove all authenticated-related props and logic
- [ ] Create useAuthFolder hook in src/hooks/use-auth-folder.ts
- [ ] Rename use-folder.ts to use-shared-folder.ts and update to use SharedFolderContext
- [ ] Update all shared view components (SharedFolderTree, SharedDirectoryBreadcrumb, etc.) to import and use useSharedFolder()
- [ ] Wrap authenticated layout (src/app/(frontend)/folders/layout.tsx) with AuthFolderProvider
- [ ] Refactor FolderPage to consume state from AuthFolderContext instead of managing its own
- [ ] Replace window.location.reload() with refetchFolderContents from useAuthFolder in NewFolderButton
- [ ] Add refetchFolderContents call after successful upload in NewFileButton
- [ ] Add refetchFolderContents call after file deletion in DeleteFileButton
- [ ] Add refetchFolderContents call and navigation after folder deletion in DeleteFolderButton
- [ ] Update all test files to use SharedFolderContext and SharedFolderProvider instead of FolderContext
- [ ] Delete the old src/hooks/use-folder.ts file