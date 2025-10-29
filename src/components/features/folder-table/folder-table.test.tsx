import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FolderTable from './folder-table';
import { TestWrapper } from "@/test-utils/test-wrapper";
import React, { useState } from "react";
import { Folder, File } from "@/types/types";
import { FileSidebar } from '../file-sidebar/file-sidebar';

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/file-api.service", () => ({
    FileApiService: {
        downloadFile: vi.fn(),
    }
}));

vi.mock("@/api-services/folder-api.service", () => ({
    FolderApiService: {
        getRootFolderId: vi.fn(() => Promise.resolve("root-folder-123")),
        getFolderContents: vi.fn(() => Promise.resolve({ files: [], subFolders: [] })),
    }
}));

vi.mock("@/hooks/use-auth-folder", () => ({
    useAuthFolder: vi.fn(() => ({
        currentFolderId: "test-folder-123",
        fetchFolderContents: vi.fn(),
        refetchFolderTree: vi.fn(),
        files: [],
        subFolders: [],
    })),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useParams: () => ({ folderId: ["test-folder-123"] }),
    useRouter: vi.fn(() => ({
        push: mockPush,
    })),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
}));

vi.mock("sonner");

describe("FolderTable", () => {
    const mockFiles: File[] = [
        {
            id: "file-123",
            file_name: "test-file.pdf",
            size: 1024,
            created_at: new Date("2024-01-01"),
            shared: false,
            s3_link: null,
            s3_key: "user-789/test-file.pdf",
            expires_at: null,
            parent_folder_id: "folder-456",
            owner_clerk_id: "user-789",
        },
        {
            id: "file-456",
            file_name: "document.docx",
            size: 2048,
            created_at: new Date("2024-01-03"),
            shared: true,
            s3_link: null,
            s3_key: "user-789/document.docx",
            expires_at: new Date("2024-12-31"),
            parent_folder_id: "folder-456",
            owner_clerk_id: "user-789",
        }
    ];

    const mockFolders: Folder[] = [
        {
            id: "folder-1",
            folder_name: "Documents",
            display_name: "Documents",
            created_at: new Date("2024-01-01"),
            updated_at: new Date("2024-01-01"),
            is_root: false,
            s3_link: null,
            shared: false,
            expires_at: null,
            owner_clerk_id: "user-789",
            parent_folder_id: "parent-folder-456",
            subfolders: [],
            files: [],
        },
        {
            id: "folder-2",
            folder_name: "Images",
            display_name: "Images",
            created_at: new Date("2024-01-02"),
            updated_at: new Date("2024-01-02"),
            is_root: false,
            s3_link: null,
            shared: true,
            expires_at: new Date("2024-12-31"),
            owner_clerk_id: "user-789",
            parent_folder_id: "parent-folder-456",
            subfolders: [],
            files: [],
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const TestWrapperComponent = () => {
        const [selectedFile, setSelectedFile] = useState<File | null>(null);
        const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

        const handleRowClick = (file: File) => {
            setSelectedFile(file);
            setIsSidebarOpen(true);
        }

        const handleCloseSidebar = () => {
            setIsSidebarOpen(false);
            setSelectedFile(null);
        }

        return (
            <TestWrapper>
                <FolderTable 
                    files={mockFiles} 
                    selectedFile={selectedFile}
                    handleRowClick={handleRowClick}
                    folders={mockFolders}/>
                <FileSidebar
                    file={selectedFile}
                    isOpen={isSidebarOpen}
                    onClose={handleCloseSidebar}
                    readOnly={false}/>
            </TestWrapper>
        );
    };

    describe("Testing Rendering", () => {
        it("Renders Correctly Folders and Files", () => {
            render(<TestWrapperComponent />);
            // check to see that the caption appears
            expect(screen.getByText("Contents of the Current Folder")).toBeInTheDocument();
        });

        it("renders table headers correctly", () => {
            render(<TestWrapperComponent />);
            expect(screen.getByText("Content Type")).toBeInTheDocument();
            expect(screen.getByText("Name")).toBeInTheDocument();
            expect(screen.getByText("Size")).toBeInTheDocument();
            expect(screen.getByText("Created At")).toBeInTheDocument();
        });

        it("renders files correctly", () => {
            render(<TestWrapperComponent />);
            expect(screen.getByText("test-file.pdf")).toBeInTheDocument();
            expect(screen.getByText("document.docx")).toBeInTheDocument();
        });

        it("displays correct content types", () => {
            render(<TestWrapperComponent />);
            const folderCells = screen.getAllByText("Folder");
            const fileCells = screen.getAllByText("File");
            expect(folderCells).toHaveLength(2);
            expect(fileCells).toHaveLength(2);
        });

        it("displays file sizes correctly", () => {
            render(<TestWrapperComponent />);
            expect(screen.getByText("1024kb")).toBeInTheDocument();
            expect(screen.getByText("2048kb")).toBeInTheDocument();
        });

        it("displays folder sizes as ---", () => {
            render(<TestWrapperComponent />);
            const dashElements = screen.getAllByText("---");
            expect(dashElements).toHaveLength(2);
        });

        it("displays created dates correctly", () => {
            render(<TestWrapperComponent />);
            expect(screen.getAllByText("1/1/2024").length).toBeGreaterThan(0);
            expect(screen.getByText("1/2/2024")).toBeInTheDocument();
        });
    });

    describe("User Interactions", () => {
        it("calls handleRowClick when file row is clicked", async () => {
            const user = userEvent.setup();
            render(<TestWrapperComponent />);
            
            const fileRow = screen.getByText("test-file.pdf").closest('tr');
            await user.click(fileRow!);

            // Wait for sidebar to open
            await waitFor(() => {
                expect(screen.getByText("Size:")).toBeInTheDocument();
            });
        
            // Use getAllByText and check that we have at least one
            const sizeElements = screen.getAllByText("1024kb");
            expect(sizeElements.length).toBeGreaterThan(0);
          
            expect(screen.getByText("Created:")).toBeInTheDocument();
            expect(screen.getAllByText("1/1/2024").length).toBeGreaterThan(0);
            expect(screen.getByText("Type:")).toBeInTheDocument();
            expect(screen.getByText("PDF")).toBeInTheDocument();
            expect(screen.getByText("Download")).toBeInTheDocument();
        });

        it("navigates to correct folder when different folder is clicked", async () => {
            const user = userEvent.setup();
            render(<TestWrapperComponent />);

            const folderRow = screen.getByText("Documents").closest("tr");
            await user.click(folderRow!);
            expect(mockPush).toHaveBeenCalledWith("/folders/folder-1");
        });

        it("handles empty folders and files arrays", () => {
            render(
                <TestWrapper>
                    <FolderTable 
                        files={[]} 
                        selectedFile={null}
                        handleRowClick={() => {}}
                        folders={[]}/>
                </TestWrapper>
            );
            
            expect(screen.getByText("Contents of the Current Folder")).toBeInTheDocument();
            expect(screen.getByText("Content Type")).toBeInTheDocument();
        });

        it("handles null folders and files", () => {
            render(
                <TestWrapper>
                    <FolderTable 
                        files={null} 
                        selectedFile={null}
                        handleRowClick={() => {}}
                        folders={null}/>
                </TestWrapper>
            );
            
            expect(screen.getByText("Contents of the Current Folder")).toBeInTheDocument();
            expect(screen.getByText("Content Type")).toBeInTheDocument();
        });
    });
});