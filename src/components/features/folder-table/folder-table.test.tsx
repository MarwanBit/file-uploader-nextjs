import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FolderTable from './folder-table';
import { SidebarProvider } from "@/components/ui/sidebar";
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

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({
        push: mockPush,
    })),
}));

describe("FolderTable", () => {

    let consoleSpy: any;
    
    const mockFiles: File[] = [
        {
            id: "file-123",
            file_name: "test-file.pdf",
            size: 1024,
            created_at: new Date("2024-01-01"),
            shared: false,
            s3_link: "https://s3.example.com/file-123",
            expires_at: undefined,
            parent_folder_id: "folder-456",
            owner_clerk_id: "user-789",
            type: "application/pdf",
        },
        {
            id: "file-456",
            file_name: "document.docx",
            size: 2048,
            created_at: new Date("2024-01-03"),
            shared: true,
            s3_link: "https://s3.example.com/file-456",
            expires_at: new Date("2024-12-31"),
            parent_folder_id: "folder-456",
            owner_clerk_id: "user-789",
            type: "application/pdf",
        }
    ];

    const mockFolders: Folder[] = [
        {
            id: "folder-1",
            folder_name: "Documents",
            created_at: new Date("2024-01-01"),
            updated_at: new Date("2024-01-01"),
            is_root: false,
            s3_link: "https://s3.example.com/folder-1",
            s3_key: "documents",
            shared: false,
            subfolders: [],
            files: [],
            owner_clerk_id: "user-789",
        },
        {
            id: "folder-2",
            folder_name: "Images",
            created_at: new Date("2024-01-02"),
            updated_at: new Date("2024-01-02"),
            is_root: false,
            s3_link: "https://s3.example.com/folder-2",
            s3_key: "images",
            shared: true,
            subfolders: [],
            files: [],
            owner_clerk_id: "user-789",
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const TestWrapper = () => {
        const [selectedFile, setSelectedFile] = useState<File | null>(null);
        const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
        const [files, setFiles] = useState<File[] | null>(mockFiles);
        const [subFolders, setSubFolders] = useState<Folder[]>(mockFolders);

        const handleRowClick = (file: File) => {
            setSelectedFile(file);
            setIsSidebarOpen(true);
        }

        const handleCloseSidebar = () => {
            setIsSidebarOpen(false);
            setSelectedFile(null);
          }

        return (
            <SidebarProvider>
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
            </SidebarProvider>
        );
    };

    describe("Testing Rendering", () => {
        it("Renders Correctly Folders and Files", () => {
            render(<TestWrapper/>);
            // check to see that the bottom occurs
            expect(screen.getByText("Contents of the Current Folder")).toBeInTheDocument();
        });

        it("renders table headers correctly", () => {
            render(<TestWrapper/>);
            expect(screen.getByText("Content Type")).toBeInTheDocument();
            expect(screen.getByText("Name")).toBeInTheDocument();
            expect(screen.getByText("Size")).toBeInTheDocument();
            expect(screen.getByText("Created At")).toBeInTheDocument();
        });

        it("renders files correctly", () => {
            render(<TestWrapper />);
            expect(screen.getByText("test-file.pdf")).toBeInTheDocument();
            expect(screen.getByText("document.docx")).toBeInTheDocument();
        });

        it("displays correct content types", () => {
            render(<TestWrapper />);
            const folderCells = screen.getAllByText("Folder");
            const fileCells = screen.getAllByText("File");
            expect(folderCells).toHaveLength(2);
            expect(fileCells).toHaveLength(2);
        });

        it("displays file sizes correctly", () => {
            render(<TestWrapper />);
            expect(screen.getByText("1024kb")).toBeInTheDocument();
            expect(screen.getByText("2048kb")).toBeInTheDocument();
        });

        it("displays folder sizes as ---", () => {
            render(<TestWrapper />);
            const dashElements = screen.getAllByText("---");
            expect(dashElements).toHaveLength(2);
        });

        it("displays created dates correctly", () => {
            render(<TestWrapper />);
            expect(screen.getByText("1/1/2024")).toBeInTheDocument();
            expect(screen.getByText("1/2/2024")).toBeInTheDocument();
        });
    });

    describe("User Interactions", () => {
        it("calls handleRowClick when file row is clicked", async () => {
            render(<TestWrapper />);
            const fileRow = screen.getByText("test-file.pdf").closest('tr');
            fireEvent.click(fileRow!);

            expect(screen.getByText("Size:")).toBeInTheDocument();
        
            // Use getAllByText and check that we have at least one
            const sizeElements = screen.getAllByText("1024kb");
            expect(sizeElements.length).toBeGreaterThan(0);
          
            expect(screen.getByText("Created:")).toBeInTheDocument();
            expect(screen.getByText("1/1/2024")).toBeInTheDocument();
            expect(screen.getByText("Type:")).toBeInTheDocument();
            expect(screen.getByText("PDF")).toBeInTheDocument();
            expect(screen.getByText("Download")).toBeInTheDocument();
        });

        it("navigates to correct folder when different folder is clicked", () => {
            render(<TestWrapper />);

            const folderRow = screen.getByText("Documents").closest("tr");
            fireEvent.click(folderRow!);
            expect(mockPush).toHaveBeenCalledWith("/folders/folder-1");
        })
    })
});