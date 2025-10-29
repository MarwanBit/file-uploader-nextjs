<!-- 8a7ffd5e-71e9-4053-bbbe-f34ccdd02654 c81173d8-f748-48b8-9e6a-024acc158ccc -->
# Optimistic Updates Implementation Plan

## Core Architecture

### 1. Create State Management Context

**File**: `src/contexts/folder-file-operations-context.tsx`

Create a new context to manage both folders and files with optimistic updates:

```tsx
interface OperationsContextProps {
  optimisticFolders: Folder[];
  optimisticFiles: File[];
  addFolder: (folder: Folder) => void;
  removeFolder: (folderId: string) => void;
  updateFolder: (folderId: string, updates: Partial<Folder>) => void;
  addFile: (file: File) => void;
  removeFile: (fileId: string) => void;
  updateFile: (fileId: string, updates: Partial<File>) => void;
  refreshData: () => Promise<void>;
}
```

Key implementation points:

- Use `useOptimistic` hook for both folders and files state
- Define action types: 'add', 'remove', 'update' for both resources
- Include `onRefresh` callback prop to refetch data from parent
- Use `useCallback` to memoize operation functions

### 2. Update Layout Wrapper

**File**: `src/app/(frontend)/folders/layout.tsx`

Modify to provide the operations context:

```tsx
// Add state for folders and files
const [folders, setFolders] = useState<Folder[]>([]);
const [files, setFiles] = useState<File[]>([]);

// Create memoized fetch function
const fetchData = useCallback(async () => {
  const data = await FolderApiService.getFolderContents(folderId);
  setFolders(data.subfolders);
  setFiles(data.files);
}, [folderId]);

// Wrap children with provider
<OperationsProvider 
  folders={folders} 
  files={files} 
  onRefresh={fetchData}
>
  {children}
</OperationsProvider>
```

### 3. Update FolderPage Component

**File**: `src/components/pages/folder-page.tsx`

Replace direct state management with context:

```tsx
// Remove local state for folders/files
const { optimisticFolders, optimisticFiles } = useOperations();

// Pass optimistic state to table
<FolderTable 
  folders={optimisticFolders}
  files={optimisticFiles}
  ...
/>
```

## Operation Implementations

### Operation 1: Folder Creation (Enhanced)

**File**: `src/components/features/new-folder-button/new-folder-button.tsx`

```tsx
const { addFolder, refreshData } = useOperations();

const handleCreateFolder = async () => {
  const tempFolder: Folder = {
    id: `temp-${Date.now()}`,
    folder_name: folderName,
    created_at: new Date(),
    // ... other required fields
  };
  
  // 1. Show optimistically
  addFolder(tempFolder);
  
  try {
    // 2. Create on server
    await FolderApiService.createFolder(folderName, folderId);
    
    // 3. Refresh to get real data
    await refreshData();
  } catch (error) {
    // Optimistic update auto-reverts
    toast.error("Failed to create folder");
  }
};
```

### Operation 2: Folder Deletion

**File**: `src/components/features/delete-folder-button/delete-folder-button.tsx`

```tsx
const { removeFolder, refreshData } = useOperations();

const handleDeleteFolder = async (folderId: string) => {
  // 1. Remove optimistically
  removeFolder(folderId);
  
  try {
    // 2. Delete on server
    await FolderApiService.deleteFolder(folderId);
    
    // 3. Navigate to parent and refresh
    router.push('/folders/[parentId]');
    await refreshData();
  } catch (error) {
    // Auto-reverts on error
    toast.error("Failed to delete folder");
  }
};
```

### Operation 3: File Upload

**File**: `src/components/features/new-file-button/new-file-button.tsx`

```tsx
const { addFile, refreshData } = useOperations();

const handleUpload = async () => {
  const tempFile: File = {
    id: `temp-${Date.now()}`,
    file_name: file.name,
    size: Math.round(file.size / 1024),
    created_at: new Date(),
    // ... other required fields
  };
  
  // 1. Show optimistically
  addFile(tempFile);
  
  try {
    // 2. Upload to server
    const formData = new FormData();
    formData.append("file", file);
    await FileApiService.uploadFile(folderId, formData);
    
    // 3. Refresh to get real data
    await refreshData();
  } catch (error) {
    toast.error("Failed to upload file");
  }
};
```

### Operation 4: File Deletion

**File**: `src/components/features/delete-file-button/delete-file-button.tsx`

```tsx
const { removeFile, refreshData } = useOperations();

const deleteFileController = async (fileId: string) => {
  // 1. Remove optimistically
  removeFile(fileId);
  
  try {
    // 2. Delete on server
    await FileApiService.deleteFile(fileId);
    
    // 3. Refresh data
    await refreshData();
    
    // 4. Close sidebar
    onClose();
  } catch (error) {
    toast.error("Failed to delete file");
  }
};
```

### Operation 5: Folder/File Renaming (New Feature)

**Files**: Create new components or add to existing ones

For folders:

```tsx
const { updateFolder, refreshData } = useOperations();

const handleRename = async (folderId: string, newName: string) => {
  // 1. Update optimistically
  updateFolder(folderId, { folder_name: newName });
  
  try {
    // 2. Update on server
    await FolderApiService.updateFolder(folderId, { name: newName });
    
    // 3. Refresh
    await refreshData();
  } catch (error) {
    toast.error("Failed to rename");
  }
};
```

## Key React Hooks Usage

### useOptimistic Hook

**Purpose**: Manage optimistic state that automatically reverts on error

```tsx
const [optimisticState, updateOptimistic] = useOptimistic(
  actualState,
  (state, action) => {
    // Reducer function to handle optimistic updates
    switch (action.type) {
      case 'add': return [...state, action.item];
      case 'remove': return state.filter(i => i.id !== action.id);
      case 'update': return state.map(i => 
        i.id === action.id ? {...i, ...action.updates} : i
      );
    }
  }
);
```

**Resources**:

- Official Docs: https://react.dev/reference/react/useOptimistic
- Guide: https://react.dev/reference/react/useOptimistic#usage

### useCallback Hook

**Purpose**: Memoize functions to prevent unnecessary re-renders and dependency issues

```tsx
const fetchData = useCallback(async () => {
  const result = await apiCall();
  setState(result);
}, [dependency1, dependency2]);
```

**Resources**:

- Official Docs: https://react.dev/reference/react/useCallback
- When to use: https://react.dev/reference/react/useCallback#should-you-add-usecallback-everywhere

## Error Handling Strategy

1. **Optimistic update happens immediately** - UI updates instantly
2. **Server call in try block** - Actual operation attempted
3. **Auto-revert on error** - useOptimistic automatically reverts if server call fails
4. **User notification** - Toast message informs user of failure
5. **Refresh on success** - Get real data from server to replace temp data

## Implementation Order

1. Create `folder-file-operations-context.tsx` with useOptimistic for both folders and files
2. Update layout to provide context with useCallback for fetch function
3. Update FolderPage to consume optimistic state
4. Update NewFolderButton (folder creation)
5. Update DeleteFolderButton (folder deletion)
6. Update NewFileButton (file upload)
7. Update DeleteFileButton (file deletion)
8. Implement rename functionality (if API endpoints exist)

## Testing Checklist

- [ ] Create folder - appears instantly, persists after refresh
- [ ] Delete folder - disappears instantly, confirmed after refresh
- [ ] Upload file - appears instantly in table
- [ ] Delete file - disappears instantly from table
- [ ] Error scenarios - UI reverts on failure
- [ ] Network throttling - test with slow 3G
- [ ] Multiple rapid operations - ensure state consistency

## Additional Resources

**React Documentation**:

- useOptimistic: https://react.dev/reference/react/useOptimistic
- useCallback: https://react.dev/reference/react/useCallback
- useTransition: https://react.dev/reference/react/useTransition (for async transitions)

**Patterns**:

- Optimistic UI: https://www.patterns.dev/react/optimistic-ui
- Error handling: https://react.dev/reference/react/useOptimistic#my-updates-get-reverted-after-the-action-completes

**Examples**:

- Form submissions: https://react.dev/reference/react/useOptimistic#optimistically-updating-forms
- TanStack Query: https://tanstack.com/query/latest/docs/react/guides/optimistic-updates

### To-dos

- [ ] Create folder-file-operations-context.tsx with useOptimistic for folders and files
- [ ] Update layout to provide operations context with useCallback fetch
- [ ] Update FolderPage to use optimistic state from context
- [ ] Enhance NewFolderButton with optimistic folder creation
- [ ] Update DeleteFolderButton with optimistic folder deletion
- [ ] Update NewFileButton with optimistic file upload
- [ ] Update DeleteFileButton with optimistic file deletion
- [ ] Implement rename functionality for folders/files (if API exists)