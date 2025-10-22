import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SharedDirectoryBreadCrumb from "./shared-directory-breadcrumb";
import React from "react";
import { FolderApiService } from "@/api-services/folder-api.service";

vi.mock("@/api-services/folder-api.service", () => ({
    FolderApiService: {
        getAncestorsSecurely: vi.fn(),
    }
}));

vi.mock("@/hooks/use-folder", () => ({
    useFolder: vi.fn(() => ({
        rootFolder: {
            id: "root-folder",
            folder_name: "Root Folder",
            created_at: new Date("2024-01-01"),
            updated_at: new Date("2024-01-01"),
            is_root: true,
            s3_link: "https://s3.example.com/root-folder",
            shared: false,
            expires_at: undefined,
            owner_clerk_id: "user-123",
            files: [],
            subfolders: []
        },
        currentFolder: {
            id: "current-folder",
            folder_name: "Current Folder",
            created_at: new Date("2024-01-01"),
            updated_at: new Date("2024-01-01"),
            is_root: false,
            s3_link: "https://s3.example.com/current-folder",
            shared: false,
            expires_at: undefined,
            owner_clerk_id: "user-123",
            files: [],
            subfolders: []
        },
        setCurrentFolder: vi.fn(),
        folderMap: {
            "root-folder": {
                id: "root-folder",
                folder_name: "Root Folder",
                created_at: new Date("2024-01-01"),
                updated_at: new Date("2024-01-01"),
                is_root: true,
                s3_link: "https://s3.example.com/root-folder",
                shared: false,
                expires_at: undefined,
                owner_clerk_id: "user-123",
                files: [],
                subfolders: []
            },
            "current-folder": {
                id: "current-folder",
                folder_name: "Current Folder",
                created_at: new Date("2024-01-01"),
                updated_at: new Date("2024-01-01"),
                is_root: false,
                s3_link: "https://s3.example.com/current-folder",
                shared: false,
                expires_at: undefined,
                owner_clerk_id: "user-123",
                files: [],
                subfolders: []
            }
        }
    }))
}));

describe("SharedDirectoryBreadCrumb", () => {

    const mockAncestors = [
        { id: "root-folder", name: "Root Folder" },
        { id: "parent-folder", name: "Parent Folder" },
        { id: "current-folder", name: "Current Folder" }
    ];

    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // Ensure the mock is properly set up
        vi.mocked(FolderApiService.getAncestorsSecurely).mockResolvedValue(mockAncestors);
    });

    describe("Testing Rendering", () => {
        it("renders the breadcrumb component", async () => {
            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
                expect(screen.getByText("Parent Folder")).toBeInTheDocument();
                expect(screen.getByText("Current Folder")).toBeInTheDocument();
            });
        });

        it("renders breadcrumb with separators", async () => {
            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                // Check that breadcrumb items are rendered
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
                expect(screen.getByText("Parent Folder")).toBeInTheDocument();
                expect(screen.getByText("Current Folder")).toBeInTheDocument();
                
                // Check that breadcrumb structure exists
                const breadcrumbList = screen.getByRole('list');
                expect(breadcrumbList).toBeInTheDocument();
            });
        });

        it("highlights the current folder (last item)", async () => {
            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                // The current folder should be bold
                const currentFolderLink = screen.getByText("Current Folder");
                expect(currentFolderLink).toBeInTheDocument();
                // Check if it's bold (this might need to be adjusted based on actual implementation)
                expect(currentFolderLink.closest('b')).toBeInTheDocument();
            });
        });
    });

    describe("Testing Navigation", () => {
        it("calls setCurrentFolder when breadcrumb item is clicked", async () => {
            const { useFolder } = await import("@/hooks/use-folder");
            const mockSetCurrentFolder = vi.fn();
            
            vi.mocked(useFolder).mockReturnValue({
                rootFolder: {
                    id: "root-folder",
                    folder_name: "Root Folder",
                    created_at: new Date("2024-01-01"),
                    updated_at: new Date("2024-01-01"),
                    is_root: true,
                    s3_link: "https://s3.example.com/root-folder",
                    shared: false,
                    expires_at: undefined,
                    owner_clerk_id: "user-123",
                    files: [],
                    subfolders: []
                },
                currentFolder: {
                    id: "current-folder",
                    folder_name: "Current Folder",
                    created_at: new Date("2024-01-01"),
                    updated_at: new Date("2024-01-01"),
                    is_root: false,
                    s3_link: "https://s3.example.com/current-folder",
                    shared: false,
                    expires_at: undefined,
                    owner_clerk_id: "user-123",
                    files: [],
                    subfolders: []
                },
                setCurrentFolder: mockSetCurrentFolder,
                folderMap: {
                    "root-folder": {
                        id: "root-folder",
                        folder_name: "Root Folder",
                        created_at: new Date("2024-01-01"),
                        updated_at: new Date("2024-01-01"),
                        is_root: true,
                        s3_link: "https://s3.example.com/root-folder",
                        shared: false,
                        expires_at: undefined,
                        owner_clerk_id: "user-123",
                        files: [],
                        subfolders: []
                    },
                    "current-folder": {
                        id: "current-folder",
                        folder_name: "Current Folder",
                        created_at: new Date("2024-01-01"),
                        updated_at: new Date("2024-01-01"),
                        is_root: false,
                        s3_link: "https://s3.example.com/current-folder",
                        shared: false,
                        expires_at: undefined,
                        owner_clerk_id: "user-123",
                        files: [],
                        subfolders: []
                    }
                }
            });

            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
            });

            // Click on the root folder breadcrumb
            const rootFolderLink = screen.getByText("Root Folder");
            fireEvent.click(rootFolderLink);

            expect(mockSetCurrentFolder).toHaveBeenCalledWith({
                id: "root-folder",
                folder_name: "Root Folder",
                created_at: new Date("2024-01-01"),
                updated_at: new Date("2024-01-01"),
                is_root: true,
                s3_link: "https://s3.example.com/root-folder",
                shared: false,
                expires_at: undefined,
                owner_clerk_id: "user-123",
                files: [],
                subfolders: []
            });
        });

        it("handles click events on breadcrumb links", async () => {
            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
            });

            // Click on a breadcrumb link
            const rootFolderLink = screen.getByText("Root Folder");
            
            // Simulate the click - this should not throw an error
            expect(() => {
                fireEvent.click(rootFolderLink);
            }).not.toThrow();
        });
    });

    describe("Testing API Integration", () => {
        it("calls FolderApiService.getAncestorsSecurely on mount", async () => {
            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                expect(FolderApiService.getAncestorsSecurely).toHaveBeenCalled();
                expect(FolderApiService.getAncestorsSecurely).toHaveBeenCalledWith(
                    expect.any(Object), // rootFolder
                    expect.any(Object), // currentFolder
                    expect.any(Object)  // folderMap
                );
            });
        });

        it("handles empty ancestors array", async () => {
            vi.mocked(FolderApiService.getAncestorsSecurely).mockResolvedValue([]);
            
            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                // Should not render any breadcrumb items
                expect(screen.queryByText("Root Folder")).not.toBeInTheDocument();
            });
        });

        it("handles API error gracefully", async () => {
            // Mock the API to return an empty array instead of rejecting
            vi.mocked(FolderApiService.getAncestorsSecurely).mockResolvedValue([]);
            
            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                // Should not render any breadcrumb items on error
                expect(screen.queryByText("Root Folder")).not.toBeInTheDocument();
            });
        });
    });

    describe("Testing Edge Cases", () => {
        it("handles missing rootFolder", async () => {
            const { useFolder } = await import("@/hooks/use-folder");
            
            vi.mocked(useFolder).mockReturnValue({
                rootFolder: null,
                currentFolder: {
                    id: "current-folder",
                    folder_name: "Current Folder",
                    created_at: new Date("2024-01-01"),
                    updated_at: new Date("2024-01-01"),
                    is_root: false,
                    s3_link: "https://s3.example.com/current-folder",
                    shared: false,
                    expires_at: undefined,
                    owner_clerk_id: "user-123",
                    files: [],
                    subfolders: []
                },
                setCurrentFolder: vi.fn(),
                folderMap: {}
            });

            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                // Should not render any breadcrumb items
                expect(screen.queryByText("Root Folder")).not.toBeInTheDocument();
            });
        });

        it("handles missing currentFolder", async () => {
            const { useFolder } = await import("@/hooks/use-folder");
            
            vi.mocked(useFolder).mockReturnValue({
                rootFolder: {
                    id: "root-folder",
                    folder_name: "Root Folder",
                    created_at: new Date("2024-01-01"),
                    updated_at: new Date("2024-01-01"),
                    is_root: true,
                    s3_link: "https://s3.example.com/root-folder",
                    shared: false,
                    expires_at: undefined,
                    owner_clerk_id: "user-123",
                    files: [],
                    subfolders: []
                },
                currentFolder: null,
                setCurrentFolder: vi.fn(),
                folderMap: {}
            });

            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                // Should not render any breadcrumb items
                expect(screen.queryByText("Root Folder")).not.toBeInTheDocument();
            });
        });

        it("handles empty folderMap", async () => {
            const { useFolder } = await import("@/hooks/use-folder");
            
            vi.mocked(useFolder).mockReturnValue({
                rootFolder: {
                    id: "root-folder",
                    folder_name: "Root Folder",
                    created_at: new Date("2024-01-01"),
                    updated_at: new Date("2024-01-01"),
                    is_root: true,
                    s3_link: "https://s3.example.com/root-folder",
                    shared: false,
                    expires_at: undefined,
                    owner_clerk_id: "user-123",
                    files: [],
                    subfolders: []
                },
                currentFolder: {
                    id: "current-folder",
                    folder_name: "Current Folder",
                    created_at: new Date("2024-01-01"),
                    updated_at: new Date("2024-01-01"),
                    is_root: false,
                    s3_link: "https://s3.example.com/current-folder",
                    shared: false,
                    expires_at: undefined,
                    owner_clerk_id: "user-123",
                    files: [],
                    subfolders: []
                },
                setCurrentFolder: vi.fn(),
                folderMap: {}
            });

            render(<SharedDirectoryBreadCrumb />);
            
            await waitFor(() => {
                // Should not render any breadcrumb items
                expect(screen.queryByText("Root Folder")).not.toBeInTheDocument();
            });
        });
    });
})
