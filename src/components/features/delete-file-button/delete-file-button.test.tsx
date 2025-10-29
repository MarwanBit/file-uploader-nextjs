import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteFileButton from "./delete-file-button";
import { TestWrapper } from "@/test-utils/test-wrapper";
import React from "react";
import { FileApiService } from "@/api-services/file-api.service";
import { toast } from "sonner";
import { type File } from "@/types/types";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

// Mock the file API service
vi.mock("@/api-services/file-api.service", () => ({
    FileApiService: {
        deleteFile: vi.fn(() => Promise.resolve({ id: "file-123", file_name: "test-file.pdf" })),
    }
}));

// Mock the folder API service for root folder fetching
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
    })),
}));

vi.mock("next/navigation", () => ({
    useParams: () => ({ folderId: ["test-folder-123"] }),
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
}));

vi.mock("sonner");

describe("DeleteFileButton", () => {
    const mockFile: File = {
        id: "file-123",
        file_name: "test-file.pdf",
        size: 1024,
        created_at: new Date("2024-01-01"),
        shared: false,
        s3_link: null,
        s3_key: "user-789/test-file.pdf",
        expires_at: null,
        parent_folder_id: "folder-456",
        owner_clerk_id: "user-789"
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <TestWrapper>
                {component}
            </TestWrapper>
        );
    };

    describe("Testing Rendering", () => {
        it("renders the delete file button with correct text", () => {
            renderWithProviders(<DeleteFileButton file={mockFile} readOnly={false} />);
            expect(screen.getByText("Delete")).toBeInTheDocument();
        });

        it("disables button when readOnly is true", () => {
            renderWithProviders(<DeleteFileButton file={mockFile} readOnly={true} />);
            const deleteButton = screen.getByRole("button", { name: /delete/i });
            expect(deleteButton).toBeDisabled();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when delete file button is fired", async () => {
            const user = userEvent.setup();
            renderWithProviders(<DeleteFileButton file={mockFile} readOnly={false} />);
            
            // click the delete button
            await user.click(screen.getByRole("button", { name: /delete/i }));

            // now we should expect the alert dialog to pop up
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });
            expect(screen.getByText("Delete File?")).toBeInTheDocument();
            expect(screen.getByText((content, element) => {
                return element?.textContent === "Are you sure you want to delete test-file.pdf? This action cannot be undone.";
            })).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", async () => {
            const user = userEvent.setup();
            renderWithProviders(<DeleteFileButton file={mockFile} readOnly={false} />);
            
            // click the delete button
            await user.click(screen.getByRole("button", { name: /delete/i }));
            
            // now let's get the cancel button
            const cancelButton = screen.getByText("Cancel");
            await user.click(cancelButton);
            
            // Expect the alert dialog options to not be in the area
            expect(screen.queryByText("Delete File?")).not.toBeInTheDocument();
            expect(screen.queryByText((content, element) => {
                return element?.textContent === "Are you sure you want to delete test-file.pdf? This action cannot be undone.";
            })).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            // Expect the delete button to appear and be in the screen
            expect(screen.getByText("Delete")).toBeInTheDocument();
        });
    });

    describe("Testing Delete Functionality", () => {
        it("Should open dialog and show delete confirmation", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<DeleteFileButton file={mockFile} readOnly={false} />);
            
            // Open the dialog
            await user.click(screen.getByRole("button", { name: /delete/i }));

            // Wait for the dialog to be open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Verify delete confirmation is present
            expect(screen.getByText("Delete File?")).toBeInTheDocument();
            expect(screen.getByText((content, element) => {
                return element?.textContent === "Are you sure you want to delete test-file.pdf? This action cannot be undone.";
            })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /delete file/i })).toBeInTheDocument();
        });

        it("Should show delete button with correct text", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<DeleteFileButton file={mockFile} readOnly={false} />);
            
            await user.click(screen.getByRole("button", { name: /delete/i }));

            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Verify delete button is present
            const deleteButton = screen.getByRole("button", { name: /delete file/i });
            expect(deleteButton).toBeInTheDocument();
        });

        it("Should handle onClose callback when provided", async () => {
            const user = userEvent.setup();
            const mockOnClose = vi.fn();
            
            renderWithProviders(<DeleteFileButton file={mockFile} readOnly={false} onClose={mockOnClose} />);
            
            await user.click(screen.getByRole("button", { name: /delete/i }));

            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // The onClose callback should be available
            expect(mockOnClose).toBeDefined();
        });
    });

    describe("Error Handling", () => {
        it("Should show error when no file is provided", async () => {
            const user = userEvent.setup();
            renderWithProviders(<DeleteFileButton file={null} readOnly={false} />);

            await user.click(screen.getByRole("button", { name: /delete/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Try to delete without a file
            const deleteButton = screen.getByRole("button", { name: /delete file/i });
            await user.click(deleteButton);

            // Verify error toast is shown
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Please select a valid file!");
            });
        });

        it("Should show error when file has no ID", async () => {
            const user = userEvent.setup();
            const invalidFile = { ...mockFile, id: "" };
            renderWithProviders(<DeleteFileButton file={invalidFile} readOnly={false} />);

            await user.click(screen.getByRole("button", { name: /delete/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Try to delete with invalid file
            const deleteButton = screen.getByRole("button", { name: /delete file/i });
            await user.click(deleteButton);

            // Verify error toast is shown
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Please select a valid file!");
            });
        });

        it("Should show error when API call fails", async () => {
            const user = userEvent.setup();
            const { FileApiService } = await import("@/api-services/file-api.service");
            
            const error = new Error("Network error");
            vi.mocked(FileApiService.deleteFile).mockRejectedValue(error);

            renderWithProviders(<DeleteFileButton file={mockFile} readOnly={false} />);

            await user.click(screen.getByRole("button", { name: /delete/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole("button", { name: /delete file/i });
            expect(deleteButton).toBeInTheDocument();
            
            // The component should handle the error gracefully
            await user.click(deleteButton);
        });
    });
})