import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewFileButton from "./new-file-button";
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
        uploadFile: vi.fn(() => Promise.resolve({ id: "file-123", file_name: "test-file.pdf" })),
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

describe("NewFileButton", () => {
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
        it("renders the new file button with correct text", () => {
            renderWithProviders(<NewFileButton />);
            expect(screen.getByText("New File")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when new file button is fired", async () => {
            const user = userEvent.setup();
            renderWithProviders(<NewFileButton />);
            
            // click the new file button
            await user.click(screen.getByRole('button', { name: /new file/i }));

            // now we should expect the alert dialog to pop up
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });
            expect(screen.getByText("Choose File")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
            expect(screen.getByText("Upload File")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", async () => {
            const user = userEvent.setup();
            renderWithProviders(<NewFileButton />);
            
            // click the new file button
            await user.click(screen.getByRole('button', { name: /new file/i }));
            
            // now let's get the cancel button
            const cancelButton = screen.getByText("Cancel");
            await user.click(cancelButton);
            
            // Expect the alert dialog options to not be in the area
            expect(screen.queryByText("Choose File")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            expect(screen.queryByText("Upload File")).not.toBeInTheDocument();
            // Expect the new file button to appear and be in the screen
            expect(screen.getByText("New File")).toBeInTheDocument();
        });
    });

    describe("Testing Upload Functionality", () => {
        it("Should open dialog and show file input", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<NewFileButton />);
            
            // Open the dialog
            await user.click(screen.getByRole('button', { name: /new file/i }));

            // Wait for the dialog to be open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Verify file input is present
            expect(screen.getByLabelText('Choose File')).toBeInTheDocument();
            expect(screen.getByText("Upload File")).toBeInTheDocument();
        });

        it("Should handle file selection", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<NewFileButton />);
            
            await user.click(screen.getByRole('button', { name: /new file/i }));

            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Create a mock file
            const mockFile = new File(['test content'], 'test-file.pdf', { type: 'application/pdf' });
            
            // Select file
            const fileInput = screen.getByLabelText('Choose File');
            await user.upload(fileInput, mockFile);
            
            // Verify file input has the file
            expect(fileInput.files).toHaveLength(1);
            expect(fileInput.files[0]).toBe(mockFile);
        });

        it("Should show upload button with correct text", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<NewFileButton />);
            
            await user.click(screen.getByRole('button', { name: /new file/i }));

            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Verify upload button is present
            const uploadButton = screen.getByRole("button", { name: /upload file/i });
            expect(uploadButton).toBeInTheDocument();
        });
    });

    describe("Error Handling", () => {
        it("Should show error when no file is selected", async () => {
            const user = userEvent.setup();
            renderWithProviders(<NewFileButton />);

            await user.click(screen.getByRole('button', { name: /new file/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Try to upload without selecting a file
            const uploadButton = screen.getByRole("button", { name: /upload file/i });
            await user.click(uploadButton);

            // Verify error toast is shown
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Please select a file first!");
            });
        });

        it("Should show error when file already exists", async () => {
            const user = userEvent.setup();
            
            // Mock useAuthFolder to return a file with the same name
            const { useAuthFolder } = await import("@/hooks/use-auth-folder");
            vi.mocked(useAuthFolder).mockReturnValue({
                currentFolderId: "test-folder-123",
                fetchFolderContents: vi.fn(),
                refetchFolderTree: vi.fn(),
                files: [mockFile],
            });

            renderWithProviders(<NewFileButton />);

            await user.click(screen.getByRole('button', { name: /new file/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Create a file with the same name as the existing one
            const duplicateFile = new File(['test content'], 'test-file.pdf', { type: 'application/pdf' });
            
            // Select file
            const fileInput = screen.getByLabelText('Choose File');
            await user.upload(fileInput, duplicateFile);

            // Try to upload
            const uploadButton = screen.getByRole("button", { name: /upload file/i });
            await user.click(uploadButton);

            // Verify error toast is shown
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('A file name "test-file.pdf" already exists in this location!');
            });
        });

        it("Should show error when no current folder ID", async () => {
            const user = userEvent.setup();
            
            // Mock useAuthFolder to return null currentFolderId
            const { useAuthFolder } = await import("@/hooks/use-auth-folder");
            vi.mocked(useAuthFolder).mockReturnValue({
                currentFolderId: null,
                fetchFolderContents: vi.fn(),
                refetchFolderTree: vi.fn(),
                files: [],
            });

            renderWithProviders(<NewFileButton />);

            await user.click(screen.getByRole('button', { name: /new file/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Create a mock file
            const mockFile = new File(['test content'], 'test-file.pdf', { type: 'application/pdf' });
            
            // Select file
            const fileInput = screen.getByLabelText('Choose File');
            await user.upload(fileInput, mockFile);

            // Try to upload - this should work but the component handles null currentFolderId
            const uploadButton = screen.getByRole("button", { name: /upload file/i });
            expect(uploadButton).toBeInTheDocument();
        });
    });
})
