import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FolderTree } from './folder-tree';
import { FolderApiService } from "@/api-services/folder-api.service";

// Mock the API service
vi.mock("@/api-services/folder-api.service", () => ({
    FolderApiService: {
        getRootFolderContents: vi.fn(),
    }
}));

// Mock Next.js navigation
const mockUseParams = vi.fn();
vi.mock("next/navigation", () => ({
    useParams: () => mockUseParams(),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
    default: ({ children, href, onClick, className }: { children: React.ReactNode; href: string; onClick?: (e: React.MouseEvent) => void; className?: string }) => (
        <a href={href} onClick={onClick} className={className}>
            {children}
        </a>
    ),
}));

describe("FolderTree", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    const mockFolderData = {
        id: "root-folder",
        folder_name: "root_user_123",
        display_name: "Root Folder",
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-01"),
        is_root: true,
        s3_link: "https://s3.example.com/root-folder",
        shared: false,
        expires_at: undefined,
        owner_clerk_id: "user-123",
        files: [
            { 
                id: "file-1", 
                file_name: "document.pdf",
                size: 1024,
                created_at: new Date("2024-01-01"),
                shared: false,
                s3_link: "https://s3.example.com/file-1",
                expires_at: undefined,
                parent_folder_id: "root-folder",
                owner_clerk_id: "user-123"
            },
            { 
                id: "file-2", 
                file_name: "image.jpg",
                size: 2048,
                created_at: new Date("2024-01-02"),
                shared: false,
                s3_link: "https://s3.example.com/file-2",
                expires_at: undefined,
                parent_folder_id: "root-folder",
                owner_clerk_id: "user-123"
            }
        ],
        subfolders: [
            {
                id: "folder-1",
                folder_name: "Documents",
                display_name: "Documents",
                created_at: new Date("2024-01-01"),
                updated_at: new Date("2024-01-01"),
                is_root: false,
                s3_link: "https://s3.example.com/folder-1",
                shared: false,
                expires_at: undefined,
                owner_clerk_id: "user-123",
                files: [
                    { 
                        id: "file-3", 
                        file_name: "report.docx",
                        size: 512,
                        created_at: new Date("2024-01-03"),
                        shared: false,
                        s3_link: "https://s3.example.com/file-3",
                        expires_at: undefined,
                        parent_folder_id: "folder-1",
                        owner_clerk_id: "user-123"
                    }
                ],
                subfolders: [
                    {
                        id: "folder-2",
                        folder_name: "Sub Documents",
                        display_name: "Sub Documents",
                        created_at: new Date("2024-01-01"),
                        updated_at: new Date("2024-01-01"),
                        is_root: false,
                        s3_link: "https://s3.example.com/folder-2",
                        shared: false,
                        expires_at: undefined,
                        owner_clerk_id: "user-123",
                        files: [],
                        subfolders: []
                    }
                ]
            },
            {
                id: "folder-3",
                folder_name: "Images",
                display_name: "Images",
                created_at: new Date("2024-01-02"),
                updated_at: new Date("2024-01-02"),
                is_root: false,
                s3_link: "https://s3.example.com/folder-3",
                shared: false,
                expires_at: undefined,
                owner_clerk_id: "user-123",
                files: [
                    { 
                        id: "file-4", 
                        file_name: "photo.png",
                        size: 1536,
                        created_at: new Date("2024-01-04"),
                        shared: false,
                        s3_link: "https://s3.example.com/file-4",
                        expires_at: undefined,
                        parent_folder_id: "folder-3",
                        owner_clerk_id: "user-123"
                    }
                ],
                subfolders: []
            }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(FolderApiService.getRootFolderContents).mockResolvedValue(mockFolderData);
        mockUseParams.mockReturnValue({ folderId: ["folder-1"] });
    });

    describe("Rendering", () => {
        it("renders folder tree with root folder", async () => {
            render(<FolderTree folderId="root-folder" readOnly={true} />);
            
            await waitFor(() => {
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
            });
        });

        it("renders subfolders but they are initially collapsed", async () => {
            render(<FolderTree folderId="root-folder" readOnly={true} />);
            
            await waitFor(() => {
                // Root folder should be visible
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
                
                // Subfolders should not be visible initially (collapsed)
                expect(screen.queryByText("Documents")).not.toBeInTheDocument();
                expect(screen.queryByText("Images")).not.toBeInTheDocument();
            });
        });

        it("renders subfolders, which when expanded are visible", async () => {
            render(<FolderTree folderId="root-folder" readOnly={true} />);
            
            await waitFor(() => {
                // Root folder should be visible
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
                
                // Subfolders should not be visible initially (collapsed)
                expect(screen.queryByText("Documents")).not.toBeInTheDocument();
                expect(screen.queryByText("Images")).not.toBeInTheDocument();
            });

            // Find and click the expand button (the > icon) for the root folder
            // The shadcn Tree component uses AccordionPrimitive.Trigger for expand/collapse
            const expandButton = screen.getByRole('button', { name: /root folder/i });
            fireEvent.click(expandButton);

            // Now subfolders should be visible after clicking the expand button
            await waitFor(() => {
                expect(screen.getByText("Documents")).toBeInTheDocument();
                expect(screen.getByText("Images")).toBeInTheDocument();
            });

            // Files should also be visible when expanded
            await waitFor(() => {
                expect(screen.getByText("document.pdf")).toBeInTheDocument();
                expect(screen.getByText("image.jpg")).toBeInTheDocument();
            });
        })

        it("collapses folder when clicked again", async () => {
            render(<FolderTree folderId="root-folder" readOnly={true} />);
            
            await waitFor(() => {
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
            });

            // Expand the folder
            const expandButton = screen.getByRole('button', { name: /root folder/i });
            fireEvent.click(expandButton);

            await waitFor(() => {
                expect(screen.getByText("Documents")).toBeInTheDocument();
            });

            // Click again to collapse
            fireEvent.click(expandButton);

            // Subfolders should be hidden again
            await waitFor(() => {
                expect(screen.queryByText("Documents")).not.toBeInTheDocument();
                expect(screen.queryByText("Images")).not.toBeInTheDocument();
            });
        });

        it("expands nested folders independently", async () => {
            render(<FolderTree folderId="root-folder" readOnly={true} />);
            
            await waitFor(() => {
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
            });

            // Expand root folder
            const rootExpandButton = screen.getByRole('button', { name: /root folder/i });
            fireEvent.click(rootExpandButton);

            await waitFor(() => {
                expect(screen.getByText("Documents")).toBeInTheDocument();
                expect(screen.getByText("Images")).toBeInTheDocument();
            });

            // Expand Documents folder
            const documentsExpandButton = screen.getByRole('button', { name: /documents/i });
            fireEvent.click(documentsExpandButton);

            // Nested content should be visible
            await waitFor(() => {
                expect(screen.getByText("Sub Documents")).toBeInTheDocument();
                expect(screen.getByText("report.docx")).toBeInTheDocument();
            });

            // Images folder should still be collapsed
            expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
        });
    });

    describe("ReadOnly Mode", () => {
        it("disables folder links when readOnly is true", async () => {
            render(<FolderTree folderId="root-folder" readOnly={true} />);
            
            await waitFor(() => {
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
            });

            // Expand to show subfolders
            const expandButton = screen.getByRole('button', { name: /root folder/i });
            fireEvent.click(expandButton);

            await waitFor(() => {
                expect(screen.getByText("Documents")).toBeInTheDocument();
            });

            // Links should be disabled
            const documentsLink = screen.getByText("Documents").closest('a');
            expect(documentsLink).toHaveAttribute('href', '#');
        });

        it("enables folder links when readOnly is false", async () => {
            render(<FolderTree folderId="root-folder" readOnly={false} />);
            
            await waitFor(() => {
                expect(screen.getByText("Root Folder")).toBeInTheDocument();
            });

            // Expand to show subfolders
            const expandButton = screen.getByRole('button', { name: /root folder/i });
            fireEvent.click(expandButton);

            await waitFor(() => {
                expect(screen.getByText("Documents")).toBeInTheDocument();
            });

            // Links should be enabled
            const documentsLink = screen.getByText("Documents").closest('a');
            expect(documentsLink).toHaveAttribute('href', '/folders/folder-1');
        });
    });

    describe("API Integration", () => {
        it("calls FolderApiService.getRootFolderContents on mount", async () => {
            render(<FolderTree folderId="root-folder" readOnly={false} />);
            
            await waitFor(() => {
                expect(FolderApiService.getRootFolderContents).toHaveBeenCalledWith("root-folder");
            });
        });
    });
});
