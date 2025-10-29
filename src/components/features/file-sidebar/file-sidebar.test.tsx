import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileSidebar } from "./file-sidebar";
import { TestWrapper } from "@/test-utils/test-wrapper";
import React, { useState } from "react";
import { type File } from "@/types/types";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/file-api.service", () => ({
    FileApiService: {
        downloadFile: vi.fn(() => Promise.resolve({})),
    }
}));

vi.mock("@/api-services/folder-api.service", () => ({
    FolderApiService: {
        getRootFolderId: vi.fn(() => Promise.resolve("test-folder-123")),
        getFolderContents: vi.fn(() => Promise.resolve({ files: [], subFolders: [] })),
    },
}));

vi.mock("@/hooks/use-auth-folder", () => ({
    useAuthFolder: vi.fn(() => ({
        currentFolderId: "test-folder-123",
        fetchFolderContents: vi.fn(),
        refetchFolderTree: vi.fn(),
        subFolders: [],
    })),
}));

vi.mock("next/navigation", () => ({
    useParams: vi.fn(() => ({ folderId: ["test-folder-123"] })),
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    usePathname: vi.fn(() => '/'),
}));

describe("FileSidebar", () => {
    const mockFile: File = {
        id: "file-123",
        file_name: "test-file.pdf",
        size: 1024,
        created_at: new Date(2024, 0, 1),
        shared: false,
        s3_link: "https://s3.example.com/file-123",
        expires_at: undefined,
        parent_folder_id: "folder-456",
        owner_clerk_id: "user-789",
        type: "application/pdf"
    };

    let consoleSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const FileSidebarWrapper = ({ initialOpen = false } : {
        initialOpen?: boolean
    }) => {
        const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(initialOpen);
        const [selectedFile, setSelectedFile] = useState(mockFile);
        const handleCloseSidebar = () => {
             setIsSidebarOpen(false);
             setSelectedFile(null);
        };
        return (
            <TestWrapper>
                <FileSidebar 
                    file={selectedFile} 
                    isOpen={isSidebarOpen}
                    onClose={handleCloseSidebar}
                    readOnly={false}/>
            </TestWrapper>
        );
    };


    describe("Testing Rendering", () => {
        it("should render file details correctly", () => {
            render(<FileSidebarWrapper initialOpen={true} />);    
            expect(screen.getByText("test-file.pdf")).toBeInTheDocument();
            expect(screen.getByText("Size:")).toBeInTheDocument();
            expect(screen.getByText("1024kb")).toBeInTheDocument();
            expect(screen.getByText("Created:")).toBeInTheDocument();
            expect(screen.getByText("1/1/2024")).toBeInTheDocument();
            expect(screen.getByText("Type:")).toBeInTheDocument();
            expect(screen.getByText("PDF")).toBeInTheDocument();
            expect(screen.getByText("Download")).toBeInTheDocument();
        });
    });

    describe("Testing Interactivity", () => {
        it("should not render anything when closed", () => {
            render(<FileSidebarWrapper initialOpen={false} />);
            expect(screen.queryByText("test-file.pdf")).not.toBeInTheDocument();
            expect(screen.queryByText("Size:")).not.toBeInTheDocument();
            expect(screen.queryByText("1024kb")).not.toBeInTheDocument();
            expect(screen.queryByText("Created:")).not.toBeInTheDocument();
            expect(screen.queryByText("1/1/2024")).not.toBeInTheDocument();
            expect(screen.queryByText("Type:")).not.toBeInTheDocument();
            expect(screen.queryByText("PDF")).not.toBeInTheDocument();
            expect(screen.queryByText("Download")).not.toBeInTheDocument();
        });
    });
})