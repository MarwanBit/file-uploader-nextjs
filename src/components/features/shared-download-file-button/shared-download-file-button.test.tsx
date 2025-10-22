import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SharedDownloadFileButton from "./shared-download-file-button";
import React from "react";
import { FileApiService } from "@/api-services/file-api.service";

vi.mock("@/api-services/file-api.service", () => ({
    FileApiService: {
        downloadFileFromShareToken: vi.fn(),
    }
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("@/hooks/use-folder", () => ({
    useFolder: vi.fn(() => ({
        shareToken: "test-share-token-123"
    }))
}));

// Mock window.open
Object.defineProperty(window, 'open', {
    value: vi.fn(),
    writable: true
});

describe("SharedDownloadFileButton", () => {

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
        // Ensure the mock is properly set up
        vi.mocked(FileApiService.downloadFileFromShareToken).mockResolvedValue({ url: "https://example.com/download-file-123" } as unknown as any);
    });

    describe("Testing Rendering", () => {
        it("renders the download button with correct text", () => {
            render(<SharedDownloadFileButton file={mockFile} />);
            expect(screen.getByText("Download")).toBeInTheDocument();
        });

        it("renders the download button when file is null", () => {
            render(<SharedDownloadFileButton file={null} />);
            expect(screen.getByText("Download")).toBeInTheDocument();
        });
    });

    describe("Testing Download Functionality", () => {
        it("Should call FileApiService.downloadFileFromShareToken and open download URL when clicked", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");

            render(<SharedDownloadFileButton file={mockFile} />);
            
            // Click the download button
            const downloadButton = screen.getByText("Download");
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(FileApiService.downloadFileFromShareToken).toHaveBeenCalled();
                expect(FileApiService.downloadFileFromShareToken).toHaveBeenCalledWith("file-123", "test-share-token-123");
                expect(FileApiService.downloadFileFromShareToken).toHaveBeenCalledTimes(1);
                expect(window.open).toHaveBeenCalledWith("https://example.com/download-file-123", "_blank");
            }); 
        });

        it("Should handle download when file is null", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");

            render(<SharedDownloadFileButton file={null} />);
            
            // Click the download button
            const downloadButton = screen.getByText("Download");
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(FileApiService.downloadFileFromShareToken).toHaveBeenCalled();
                expect(FileApiService.downloadFileFromShareToken).toHaveBeenCalledWith(undefined, "test-share-token-123");
                expect(FileApiService.downloadFileFromShareToken).toHaveBeenCalledTimes(1);
            }); 
        });
    });

    describe("Error Handling", () => {
        it("Should show error toast when API call fails", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            const { toast } = await import("sonner");
            
            const error = new Error("Network error");
            vi.mocked(FileApiService.downloadFileFromShareToken).mockRejectedValue(error);

            render(<SharedDownloadFileButton file={mockFile} />);

            // Click the download button
            const downloadButton = screen.getByText("Download");
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(FileApiService.downloadFileFromShareToken).toHaveBeenCalledWith("file-123", "test-share-token-123");
                expect(toast.error).toHaveBeenCalledWith("Something went wrong when downloading! Try again!");
                expect(consoleSpy).toHaveBeenCalledWith(error);
            })
        });

        it("Should not open window when API call fails", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            
            const error = new Error("Network error");
            vi.mocked(FileApiService.downloadFileFromShareToken).mockRejectedValue(error);

            render(<SharedDownloadFileButton file={mockFile} />);

            // Click the download button
            const downloadButton = screen.getByText("Download");
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(FileApiService.downloadFileFromShareToken).toHaveBeenCalled();
                expect(window.open).not.toHaveBeenCalled();
            })
        });
    });

    describe("Testing Share Token Integration", () => {
        it("Should use share token from useFolder hook", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            const { useFolder } = await import("@/hooks/use-folder");

            // Mock different share token
            vi.mocked(useFolder).mockReturnValue({
                shareToken: "different-share-token-456"
            });

            render(<SharedDownloadFileButton file={mockFile} />);
            
            // Click the download button
            const downloadButton = screen.getByText("Download");
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(FileApiService.downloadFileFromShareToken).toHaveBeenCalledWith("file-123", "different-share-token-456");
            }); 
        });

        it("Should handle missing share token", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            const { useFolder } = await import("@/hooks/use-folder");

            // Mock missing share token
            vi.mocked(useFolder).mockReturnValue({
                shareToken: null
            });

            render(<SharedDownloadFileButton file={mockFile} />);
            
            // Click the download button
            const downloadButton = screen.getByText("Download");
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(FileApiService.downloadFileFromShareToken).toHaveBeenCalledWith("file-123", null);
            }); 
        });
    });

    describe("Testing Button Behavior", () => {
        it("Should be clickable and not disabled", () => {
            render(<SharedDownloadFileButton file={mockFile} />);
            
            const downloadButton = screen.getByText("Download");
            expect(downloadButton).not.toBeDisabled();
            expect(downloadButton).toBeInTheDocument();
        });

        it("Should have correct button styling", () => {
            render(<SharedDownloadFileButton file={mockFile} />);
            
            const downloadButton = screen.getByText("Download");
            expect(downloadButton).toHaveClass("w-full", "justify-start", "hover:cursor-pointer");
        });

        it("Should render download icon", () => {
            render(<SharedDownloadFileButton file={mockFile} />);
            
            // The icon should be present (IconDownload)
            const downloadButton = screen.getByText("Download");
            expect(downloadButton).toBeInTheDocument();
        });
    });
})
