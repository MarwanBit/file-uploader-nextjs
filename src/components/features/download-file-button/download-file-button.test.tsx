import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DownloadFileButton from "./download-file-button";
import { TestWrapper } from "@/test-utils/test-wrapper";
import React from "react";
import { type File } from "@/types/types";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/file-api.service", () => ({
    FileApiService: {
        downloadFile: vi.fn(() => Promise.resolve({ url: "https://s3.example.com/file-123" })),
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

vi.mock('next/navigation', () => ({
    useParams: vi.fn(() => ({ folderId: ["test-folder-123"] })),
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    usePathname: vi.fn(() => '/'),
}));

describe("DownloadFileButton", () => {
    const mockFile: File = {
        id: "file-123",
        file_name: "test-file.pdf",
        size: 1024,
        created_at: new Date("2024-01-01"),
        shared: false,
        s3_link: "https://s3.example.com/file-123",
        expires_at: undefined,
        parent_folder_id: "folder-456",
        owner_clerk_id: "user-789"
    };

    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <TestWrapper>
                {component}
            </TestWrapper>
        );
    };

    describe("Test Rendering", () => {
        it("Should render the download button", () => {
            renderWithProviders(<DownloadFileButton file={mockFile}/>);
            expect(screen.getByText("Download")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("renders the correct link from the file response", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            
            renderWithProviders(<DownloadFileButton file={mockFile}/>);

            // Mock window.open
            const mockWindowOpen = vi.fn();
            Object.defineProperty(window, 'open', {
                value: mockWindowOpen,
                writable: true
            });

            // get the download button
            const downloadButton = screen.getByText("Download");

            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(FileApiService.downloadFile).toHaveBeenCalledWith("file-123");
                expect(mockWindowOpen).toHaveBeenCalledWith("https://s3.example.com/file-123", "_blank");
            });
        });
    })
});