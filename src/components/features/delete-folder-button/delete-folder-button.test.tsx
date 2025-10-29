import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteFolderButton from "./delete-folder-button";
import { TestWrapper } from "@/test-utils/test-wrapper";
import React from "react";
import { type Folder } from "@/types/types";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/folder-api.service", () => ({
    FolderApiService: {
        deleteFolder: vi.fn(() => Promise.resolve({})),
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

describe("DeleteFolderButton", () => {
    const mockFolder: Folder = {
        id: "test-folder-123",
        folder_name: "test-folder",
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-01"),
        is_root: true,
        s3_link: "https://s3.example.com/test-folder",
        s3_key: "test-folder",
        shared: false,
        subfolders: [],
        files: [],
        owner_clerk_id: "test-user-123",
        display_name: "Test Folder",
    };

    let consoleSpy: any;

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

    describe("Testing Rendering", () => {
        it("renders the delete folder button with correct text", () => {
            renderWithProviders(<DeleteFolderButton readOnly={false} />);
            expect(screen.getByText("Delete Folder")).toBeInTheDocument();
        });

        it("renders button when readOnly is true", () => {
            renderWithProviders(<DeleteFolderButton readOnly={true} />);
            expect(screen.getByText("Delete Folder")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when delete folder button is fired", async () => {
            const user = userEvent.setup();
            renderWithProviders(<DeleteFolderButton readOnly={false} />);
            
            await user.click(screen.getByRole("button", { name: /delete folder/i }));

            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            expect(screen.getByText("Delete this Folder?")).toBeInTheDocument();
            expect(screen.getByText("Are you sure you want to delete this folder?")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
            expect(screen.getByText("Delete")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", async () => {
            const user = userEvent.setup();
            renderWithProviders(<DeleteFolderButton readOnly={false} />);
            
            await user.click(screen.getByRole("button", { name: /delete folder/i }));

            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            await user.click(screen.getByRole("button", { name: /cancel/i }));

            await waitFor(() => {
                expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
            });

            expect(screen.getByText("Delete Folder")).toBeInTheDocument();
        });
    });

    describe("Testing Delete Functionality", () => {
        it("Should call FolderApiService.deleteFolder and show success toast when delete is confirmed", async () => {
            const user = userEvent.setup();
            const { FolderApiService } = await import("@/api-services/folder-api.service");

            FolderApiService.deleteFolder.mockResolvedValue(mockFolder);

            renderWithProviders(<DeleteFolderButton readOnly={false} />);
            
            await user.click(screen.getByRole("button", { name: /delete folder/i }));

            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole("button", { name: /delete/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(FolderApiService.deleteFolder).toHaveBeenCalledWith("test-folder-123");
            });
        });
    });

    describe("Error Handling", () => {
        it("Should handle API call failure", async () => {
            const user = userEvent.setup();
            const { FolderApiService } = await import("@/api-services/folder-api.service");

            FolderApiService.deleteFolder.mockRejectedValue(new Error("Network error"));

            renderWithProviders(<DeleteFolderButton readOnly={false} />);
            
            await user.click(screen.getByRole("button", { name: /delete folder/i }));

            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole("button", { name: /delete/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(FolderApiService.deleteFolder).toHaveBeenCalledWith("test-folder-123");
            });
        });
    });
})