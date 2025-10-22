import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DeleteFolderButton from "./delete-folder-button";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/folder-api.service", () => ({
    FolderApiService: {
        deleteFolder: vi.fn(),
    },
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("next/navigation", () => ({
    useParams: vi.fn(() => ({
        folderId: "test-folder-id"
    })),
}));

describe("DeleteFolderButton", () => {

    const mockFolder: Folder = {
        id: "test-folder-id",
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

    describe("Testing Rendering", () => {
        it("renders the delete folder button with correct text", () => {
            renderWithSidebar(<DeleteFolderButton readOnly={false}/>);
            expect(screen.getByText("Delete Folder")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when delete folder button is fired", () => {
            renderWithSidebar(<DeleteFolderButton readOnly={false}/>);
            // click the delete button
            const deleteButton = screen.getByText("Delete Folder");
            fireEvent.click(deleteButton);

            // now we should see the alert dialog as desired
            expect(screen.getByText("Delete this Folder?")).toBeInTheDocument();
            expect(screen.getByText("Are you sure you want to delete this folder?")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
            expect(screen.getByText("Delete")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", () => {
            renderWithSidebar(<DeleteFolderButton readOnly={false}/>);
            // click the delete button
            fireEvent.click(screen.getByText("Delete Folder"));
            fireEvent.click(screen.getByText("Cancel"));

            // we should expect none of the alert dialog to appear
            expect(screen.queryByText("Delete this Folder?")).not.toBeInTheDocument();
            expect(screen.queryByText("Are you sure you want to delete this folder?")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            expect(screen.queryByText("Delete")).not.toBeInTheDocument();

            // we should expect the regular delete-folder-button to appear here
            expect(screen.getByText("Delete Folder")).toBeInTheDocument();
        });
    });

    describe("Testing Delete Functionality", () => {
        it("Should call FolderApiService.deleteFolder and show success toast when delete is confirmed", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");
            const { toast } = await import("sonner");

            // Set up the mock to return success
            FolderApiService.deleteFolder.mockResolvedValue(mockFolder);

            renderWithSidebar(<DeleteFolderButton readOnly={false}/>);
            
            fireEvent.click(screen.getByText("Delete Folder"));
            fireEvent.click(screen.getByRole("button", { name: /delete/i }));

            await waitFor(() => {
                expect(FolderApiService.deleteFolder).toHaveBeenCalled();
                expect(FolderApiService.deleteFolder).toHaveBeenCalledWith("test-folder-id");
                expect(FolderApiService.deleteFolder).toHaveBeenCalledTimes(1);
                expect(toast.success).toHaveBeenCalledWith("Successfully deleted the folder!");
            });
        });
    });

    describe("Error Handling", () => {
        it("Should call FolderApiService.deleteFolder and show success toast when delete is confirmed", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");
            const { toast } = await import("sonner");

            // Set up the mock to return success
            const error = new Error("Network error");
            FolderApiService.deleteFolder.mockRejectedValue(error);

            renderWithSidebar(<DeleteFolderButton readOnly={false}/>);
            
            fireEvent.click(screen.getByText("Delete Folder"));
            fireEvent.click(screen.getByRole("button", { name: /delete/i }));

            await waitFor(() => {
                expect(FolderApiService.deleteFolder).toHaveBeenCalled();
                expect(FolderApiService.deleteFolder).toHaveBeenCalledWith("test-folder-id");
                expect(toast.error).toHaveBeenCalledWith(`Problem occured when deleting folder, please try again!`);
                expect(consoleSpy).toHaveBeenCalledWith(error);
            });
        });
    });
})