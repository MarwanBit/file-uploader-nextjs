import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewFolderButton from "./new-folder-button";
import { TestWrapper } from "@/test-utils/test-wrapper";
import React from "react";
import { FolderApiService } from "@/api-services/folder-api.service";
import { toast } from "sonner";
import { type Folder } from "@/types/types";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

// Mock the folder API service
vi.mock("@/api-services/folder-api.service", () => ({
    FolderApiService: {
        createFolder: vi.fn(() => Promise.resolve({ id: "folder-123", folder_name: "New Folder" })),
        getRootFolderId: vi.fn(() => Promise.resolve("root-folder-123")),
        getFolderContents: vi.fn(() => Promise.resolve({ files: [], subFolders: [] })),
    }
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

// Mock window.location.reload
Object.defineProperty(window, 'location', {
    value: {
        reload: vi.fn()
    },
    writable: true
});

describe("NewFolderButton", () => {
    const mockFolder: Folder = {
        id: "folder-123",
        folder_name: "test-folder",
        display_name: "Test Folder",
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-01"),
        is_root: false,
        s3_link: null,
        shared: false,
        expires_at: null,
        owner_clerk_id: "user-789",
        parent_folder_id: "parent-folder-456",
        subfolders: [],
        files: []
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
        it("renders the new folder button with correct text", () => {
            renderWithProviders(<NewFolderButton />);
            expect(screen.getByText("New Folder")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when new folder button is fired", async () => {
            const user = userEvent.setup();
            renderWithProviders(<NewFolderButton />);
            
            // click the new folder button
            await user.click(screen.getByRole('button', { name: /new folder/i }));

            // now we should expect the alert dialog to pop up
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });
            expect(screen.getByPlaceholderText("Enter your folder name...")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
            expect(screen.getByText("Create Folder")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", async () => {
            const user = userEvent.setup();
            renderWithProviders(<NewFolderButton />);
            
            // click the new folder button
            await user.click(screen.getByRole('button', { name: /new folder/i }));
            
            // now let's get the cancel button
            const cancelButton = screen.getByText("Cancel");
            await user.click(cancelButton);
            
            // Expect the alert dialog options to not be in the area
            expect(screen.queryByText("Enter your folder name...")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            expect(screen.queryByText("Create Folder")).not.toBeInTheDocument();
            // Expect the new folder button to appear and be in the screen
            expect(screen.getByText("New Folder")).toBeInTheDocument();
        });
    });

    describe("Testing Create Functionality", () => {
        it("Should open dialog and show folder name input", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<NewFolderButton />);
            
            // Open the dialog
            await user.click(screen.getByRole('button', { name: /new folder/i }));

            // Wait for the dialog to be open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Verify folder name input is present
            expect(screen.getByPlaceholderText("Enter your folder name...")).toBeInTheDocument();
            expect(screen.getByText("Create Folder")).toBeInTheDocument();
        });

        it("Should handle folder name input", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<NewFolderButton />);
            
            await user.click(screen.getByRole('button', { name: /new folder/i }));

            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Enter folder name
            const folderNameInput = screen.getByPlaceholderText("Enter your folder name...");
            await user.type(folderNameInput, "My New Folder");
            
            // Verify input has the value
            expect(folderNameInput).toHaveValue("My New Folder");
        });

        it("Should show create button with correct text", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<NewFolderButton />);
            
            await user.click(screen.getByRole('button', { name: /new folder/i }));

            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Verify create button is present
            const createButton = screen.getByRole("button", { name: /create folder/i });
            expect(createButton).toBeInTheDocument();
        });
    });

    describe("Error Handling", () => {
        it("Should not create folder when folder name is empty", async () => {
            const user = userEvent.setup();
            renderWithProviders(<NewFolderButton />);

            await user.click(screen.getByRole('button', { name: /new folder/i }));
            
            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });
            
            // Don't enter any folder name, just click create
            const createButton = screen.getByRole("button", { name: /create folder/i });
            expect(createButton).toBeInTheDocument();
            
            // The function should return early when folder name is empty
            await user.click(createButton);
        });

        it("Should show error when folder already exists", async () => {
            const user = userEvent.setup();
            
            // Mock useAuthFolder to return a folder with the same name
            const { useAuthFolder } = await import("@/hooks/use-auth-folder");
            vi.mocked(useAuthFolder).mockReturnValue({
                currentFolderId: "test-folder-123",
                fetchFolderContents: vi.fn(),
                refetchFolderTree: vi.fn(),
                subFolders: [mockFolder],
            });

            renderWithProviders(<NewFolderButton />);

            await user.click(screen.getByRole('button', { name: /new folder/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Enter folder name that already exists
            const folderNameInput = screen.getByPlaceholderText("Enter your folder name...");
            await user.type(folderNameInput, "test-folder");

            const createButton = screen.getByRole("button", { name: /create folder/i });
            await user.click(createButton);

            // Verify error toast is shown
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('A folder name "test-folder" already exists in this location!');
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
                subFolders: [],
            });

            renderWithProviders(<NewFolderButton />);

            await user.click(screen.getByRole('button', { name: /new folder/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            // Enter folder name
            const folderNameInput = screen.getByPlaceholderText("Enter your folder name...");
            await user.type(folderNameInput, "My New Folder");

            const createButton = screen.getByRole("button", { name: /create folder/i });
            expect(createButton).toBeInTheDocument();
            
            // The component should handle null currentFolderId gracefully
            await user.click(createButton);
        });
    });
})
