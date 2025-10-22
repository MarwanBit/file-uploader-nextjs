import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DownloadFileButton from "./download-file-button";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

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

    let consoleSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const renderWithSidebar = (component: React.ReactElement) => {
        return render(
            <SidebarProvider>
                {component}
            </SidebarProvider>
        )
    };

    describe("Test Rendering", () => {
        it("Should render the download button", () => {
            renderWithSidebar(<DownloadFileButton file={mockFile} readOnly={false}/>);
            expect(screen.getByText("Download")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("renders the correct link from the file response", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            FileApiService.downloadFile.mockResolvedValue({url: "https://s3.example.com/file-123"});
            renderWithSidebar(<DownloadFileButton file={mockFile} readOnly={false}/>);

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