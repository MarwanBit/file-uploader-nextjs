# API Documentation

This document provides comprehensive documentation for all API endpoints in the File Uploader Next.js application. All endpoints return JSON responses and follow RESTful conventions.

## Table of Contents

1. [Authentication](#authentication)
2. [Folders API](#folders-api)
3. [Files API](#files-api)
4. [Shared Resources API](#shared-resources-api)
5. [Response Formats](#response-formats)
6. [Error Handling](#error-handling)

---

## Authentication

Most endpoints require authentication via **Clerk**. Authentication is handled automatically through Next.js middleware which validates JWT tokens from the session.

**Protected Endpoints:** All endpoints under `/api/folders` (except GET operations) and `/api/files` require authentication.

**Public Endpoints:** All endpoints under `/api/shared/*` are public and accessible without authentication using share tokens.

**Authentication Headers:**
```
Cookie: __session=<clerk_jwt_token>
```

---

## Folders API

### Get Root Folder

Retrieves the authenticated user's root folder. Automatically creates a root folder if one doesn't exist.

**Endpoint:** `GET /api/folders`

**Authentication:** Required

**Query Parameters:**
- `recursive` (optional): Set to `"all"` to retrieve the complete folder tree recursively

**Request Examples:**

```typescript
// Get root folder metadata only
const response = await fetch('/api/folders');
const rootFolder = await response.json();
```

```typescript
// Get complete folder tree
const response = await fetch('/api/folders?recursive=all');
const folderTree = await response.json();
```

**Response (without recursive):**
```json
{
  "id": "folder-uuid",
  "folder_name": "JohnDoe",
  "owner_clerk_id": "user_xxx",
  "is_root": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "parent_folder_id": null,
  "s3_key": "user-folder/",
  "s3_link": "s3://bucket/user-folder/",
  "shared": false,
  "expires_at": null,
  "shareToken": null,
  "files": [],
  "subfolders": []
}
```

**Response (with recursive=all):**
```json
{
  "id": "folder-uuid",
  "folder_name": "JohnDoe",
  "is_root": true,
  "files": [
    {
      "id": "file-uuid",
      "file_name": "document.pdf",
      "size": 1024000,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "subfolders": [
    {
      "id": "subfolder-uuid",
      "folder_name": "Documents",
      "files": [...],
      "subfolders": [...]
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (no valid session)
- `500` - Internal server error

---

### Create Folder in Root

Creates a new folder in the user's root directory.

**Endpoint:** `POST /api/folders`

**Authentication:** Required

**Request Body:**
```json
{
  "folder_name": "My New Folder"
}
```

**Request Example:**
```typescript
const response = await fetch('/api/folders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ folder_name: 'My Documents' })
});
const newFolder = await response.json();
```

**Response:**
```json
{
  "id": "folder-uuid",
  "folder_name": "My New Folder",
  "owner_clerk_id": "user_xxx",
  "parent_folder_id": "root-folder-id",
  "s3_key": "user-folder/My New Folder/",
  "created_at": "2024-01-01T00:00:00.000Z",
  "files": [],
  "subfolders": []
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Internal server error (e.g., duplicate folder name)

---

### Get Folder by ID

Retrieves a specific folder by its ID.

**Endpoint:** `GET /api/folders/{folderId}`

**Authentication:** Optional (but recommended for private folders)

**Query Parameters:**
- `recursive` (optional): Set to `"all"` to retrieve the complete subfolder tree

**Request Examples:**

```typescript
// Get folder metadata
const response = await fetch('/api/folders/folder-123');
const folder = await response.json();
```

```typescript
// Get folder with all nested content
const response = await fetch('/api/folders/folder-123?recursive=all');
const folderTree = await response.json();
```

**Response:**
```json
{
  "id": "folder-123",
  "folder_name": "Documents",
  "owner_clerk_id": "user_xxx",
  "parent_folder_id": "root-folder-id",
  "files": [
    {
      "id": "file-uuid",
      "file_name": "report.pdf",
      "size": 2048000,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "subfolders": [...]
}
```

**Status Codes:**
- `200` - Success
- `500` - Internal server error

---

### Create Subfolder

Creates a new subfolder within an existing folder.

**Endpoint:** `POST /api/folders/{folderId}`

**Authentication:** Required

**Request Body:**
```json
{
  "folder_name": "Subfolder Name"
}
```

**Request Example:**
```typescript
const response = await fetch('/api/folders/parent-folder-123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ folder_name: 'Reports' })
});
```

**Response:**
```json
{
  "message": "ENDPOINT POST /api/folders not implemented yet :("
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Parent folder not found or internal error

---

### Delete Folder

Recursively deletes a folder and all its contents (files and subfolders).

**Endpoint:** `DELETE /api/folders/{folderId}`

**Authentication:** Optional (but should be required in production)

**Request Example:**
```typescript
const response = await fetch('/api/folders/folder-789', {
  method: 'DELETE'
});
const result = await response.json();
```

**Response:**
```json
{
  "message": "ENDPOINT DELETE /api/folders/:folderId not implemented yet :("
}
```

**Status Codes:**
- `200` - Success
- `500` - Internal server error

**⚠️ Warning:** This operation is irreversible and deletes all nested content.

---

### Share Folder

Generates a shareable link for a folder with a custom expiration time.

**Endpoint:** `POST /api/folders/{folderId}/share`

**Authentication:** Optional

**Request Body:**
```json
{
  "hours": 24
}
```

**Request Example:**
```typescript
const response = await fetch('/api/folders/folder-123/share', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hours: 48 })
});
const shareInfo = await response.json();
```

**Response:**
```json
{
  "message": "Successful",
  "url": "https://yourapp.com/folders/shared/abc123token",
  "expires_at": "2024-01-03T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid hours parameter (must be > 0)
- `500` - Folder not found or internal error

---

### Get Folder Ancestors (Breadcrumb)

Retrieves the complete ancestor chain for a folder, useful for breadcrumb navigation.

**Endpoint:** `GET /api/folders/{folderId}/ancestors`

**Authentication:** Required

**Request Example:**
```typescript
const response = await fetch('/api/folders/deep-folder-id/ancestors');
const data = await response.json();
```

**Response:**
```json
{
  "message": "Everything is working!",
  "ancestors": [
    {
      "id": "root-id",
      "folder_name": "JohnDoe",
      "parent_folder_id": null
    },
    {
      "id": "docs-id",
      "folder_name": "Documents",
      "parent_folder_id": "root-id"
    },
    {
      "id": "work-id",
      "folder_name": "Work",
      "parent_folder_id": "docs-id"
    },
    {
      "id": "deep-folder-id",
      "folder_name": "Projects",
      "parent_folder_id": "work-id"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Internal server error

**Note:** The array is ordered from root to the current folder.

---

### Upload File to Folder

Uploads a file to a specific folder.

**Endpoint:** `POST /api/folders/{folderId}/files`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (FormData): The file to upload

**Request Example:**
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/folders/folder-123/files', {
  method: 'POST',
  body: formData
});
const result = await response.json();
```

**Response:**
```json
{
  "message": "Worked as expected!"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Folder not found or upload error

---

## Files API

### Get File URL

Generates a temporary presigned URL for downloading a file.

**Endpoint:** `GET /api/files/{fileId}`

**Authentication:** Optional (anyone with the file ID can access)

**Request Example:**
```typescript
const response = await fetch('/api/files/file-123');
const data = await response.json();
// Use data.url to download the file
window.location.href = data.url;
```

**Response:**
```json
{
  "url": "https://s3.amazonaws.com/bucket/file-path?presigned-params..."
}
```

**Status Codes:**
- `200` - Success
- `500` - File not found or URL generation failed

**Note:** The presigned URL expires after approximately 67 minutes (4000 seconds).

---

### Delete File

Permanently deletes a file from both S3 storage and the database.

**Endpoint:** `DELETE /api/files/{fileId}`

**Authentication:** Optional (but should be required in production)

**Request Example:**
```typescript
const response = await fetch('/api/files/file-456', {
  method: 'DELETE'
});
const result = await response.json();
```

**Response:**
```json
{
  "message": "deletion successful!"
}
```

**Status Codes:**
- `200` - Success
- `500` - File not found or deletion failed

**⚠️ Warning:** This operation is irreversible.

---

### Share File

Creates a shareable link for a file with a custom expiration time.

**Endpoint:** `POST /api/files/{fileId}/share`

**Authentication:** Optional

**Request Body:**
```json
{
  "hours": 24
}
```

**Request Example:**
```typescript
const response = await fetch('/api/files/file-789/share', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hours: 48 })
});
const shareInfo = await response.json();
```

**Response:**
```json
{
  "message": "File shared successfully",
  "url": "https://s3.amazonaws.com/bucket/file-path?presigned-params...",
  "expires_at": "2024-01-03T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid hours parameter (must be > 0)
- `500` - File not found or sharing failed

---

## Shared Resources API

These endpoints are **public** and do not require authentication. They use share tokens for access control.

### Access Shared Folder

Retrieves a shared folder's contents using a share token.

**Endpoint:** `GET /api/shared/folder/{token}`

**Authentication:** None (public endpoint)

**Query Parameters:**
- `recursive` (optional): Set to `"all"` to retrieve the complete folder tree

**Request Examples:**

```typescript
// Get shared folder
const response = await fetch('/api/shared/folder/share-token-abc123');
const folder = await response.json();
```

```typescript
// Get complete folder tree
const response = await fetch('/api/shared/folder/share-token-abc123?recursive=all');
const folderTree = await response.json();
```

**Response:**
```json
{
  "id": "folder-123",
  "folder_name": "Shared Documents",
  "shared": true,
  "expires_at": "2024-01-03T00:00:00.000Z",
  "shareToken": "abc123token",
  "files": [
    {
      "id": "file-uuid",
      "file_name": "document.pdf",
      "size": 1024000,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "subfolders": [...]
}
```

**Status Codes:**
- `200` - Success
- `403` - Share link expired or invalid token
- `500` - Internal server error

---

### Access Shared File

Retrieves a presigned URL for a file using a folder share token.

**Endpoint:** `GET /api/shared/file/{fileId}/{token}`

**Authentication:** None (public endpoint)

**Request Example:**
```typescript
const response = await fetch('/api/shared/file/file-123/share-token-abc');
const data = await response.json();

// Download the file
window.location.href = data.url;
```

**Response:**
```json
{
  "message": "File access granted",
  "url": "https://s3.amazonaws.com/bucket/file-path?presigned-params...",
  "file_name": "document.pdf",
  "expires_at": "2024-01-03T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Success
- `403` - Share link expired or file not accessible
- `404` - Invalid share token or file not found
- `500` - Internal server error

**Note:** The share token belongs to the folder, and this endpoint verifies the file is within the shared folder's hierarchy.

---

## Response Formats

### Folder Object

```typescript
interface Folder {
  id: string;
  folder_name: string;
  owner_clerk_id: string;
  parent_folder_id: string | null;
  is_root: boolean;
  s3_key: string | null;
  s3_link: string | null;
  shared: boolean;
  shareToken: string | null;
  expires_at: string | null;  // ISO 8601 date string
  created_at: string;          // ISO 8601 date string
  updated_at: string;          // ISO 8601 date string
  files: File[];
  subfolders: Folder[];
}
```

### File Object

```typescript
interface File {
  id: string;
  file_name: string;
  size: number;                // Size in bytes
  owner_clerk_id: string;
  parent_folder_id: string | null;
  s3_key: string | null;
  s3_link: string | null;
  shared: boolean;
  expires_at: string | null;   // ISO 8601 date string
  created_at: string;           // ISO 8601 date string
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message description"
}
```

### Common Status Codes

| Status Code | Meaning | Description |
|------------|---------|-------------|
| `200` | OK | Request succeeded |
| `400` | Bad Request | Invalid request parameters |
| `401` | Unauthorized | Authentication required but not provided |
| `403` | Forbidden | Valid authentication but insufficient permissions or expired share link |
| `404` | Not Found | Requested resource does not exist |
| `500` | Internal Server Error | Server-side error occurred |

### Error Handling Best Practices

```typescript
async function apiCall(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

---

## Rate Limiting

The application is deployed on Vercel, which provides built-in rate limiting for serverless functions. Excessive requests from a single IP may be throttled.

---

## API Versioning

Currently, the API is unversioned (v1 is implicit). Future breaking changes will introduce versioning in the URL path (e.g., `/api/v2/folders`).

---

## Additional Resources

- **TypeDoc API Documentation:** Auto-generated documentation for all functions and classes
- **Architecture Documentation:** See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- **Database Schema:** See [DATABASE.md](./DATABASE.md) for data models
- **Deployment Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for CI/CD setup

---

## Support

For questions, issues, or contributions, please:
- Open an issue on GitHub: https://github.com/marwanbit/file-uploader-nextjs/issues
- Contact: marwainbit12@gmail.com

---

**Last Updated:** 2025-10-25

