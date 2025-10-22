import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DeleteFileButton from "./delete-file-button";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/file-api.service", () => ({
    FileApiService: {
        deleteFile: vi.fn(),
    },
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("DeleteFileButton", () => {

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

    describe("Testing Rendering", () => {
        it("renders the delete file button with correct text", () => {
            renderWithSidebar(<DeleteFileButton file={mockFile} readOnly={false}/>);
            expect(screen.getByText("Delete")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when delete file button is fired", () => {
            renderWithSidebar(<DeleteFileButton file={mockFile} readOnly={false}/>);
            // click the delete button
            const deleteButton = screen.getByText("Delete");
            fireEvent.click(deleteButton);

            // now we should expect the alert dialog to pop up
            expect(screen.getByText("Delete this File?")).toBeInTheDocument();
            expect(screen.getByText("Are you sure you want to delete this file?")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", () => {
            renderWithSidebar(<DeleteFileButton file={mockFile} readOnly={false}/>);
            // click the delete button
            const deleteButton = screen.getByText("Delete");
            fireEvent.click(deleteButton);
            // now let's get the cancel button
            const cancelButton = screen.getByText("Cancel");
            fireEvent.click(cancelButton);
            // Expect the alert dialog options to not be in the area
            expect(screen.queryByText("Delete this File?")).not.toBeInTheDocument();
            expect(screen.queryByText("Are you sure you want to delete this file?")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            // Expect the delete button to appear and be in the screen
            expect(screen.getByText("Delete")).toBeInTheDocument();
        })
    });

    describe("Testing Delete Functionality", () => {
        it("Should call FileApiService.deleteFile and show success toast when delete is confirmed", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            const { toast } = await import("sonner");

            //Set up the mock to return success
            FileApiService.deleteFile.mockResolvedValue(mockFile);

            // Now let's render the button
            renderWithSidebar(<DeleteFileButton file={mockFile} readOnly={false}/>);
            
            // Now let's pop up the alert
            fireEvent.click(screen.getByText("Delete"));
     
            // Now let's get the delete button and delete it!
            fireEvent.click(screen.getByRole("button", { name: /delete/i }));

            await waitFor(() => {
                expect(FileApiService.deleteFile).toHaveBeenCalled();
                expect(FileApiService.deleteFile).toHaveBeenCalledWith("file-123");
                expect(FileApiService.deleteFile).toHaveBeenCalledTimes(1);
                expect(toast.success).toHaveBeenCalledWith("File test-file.pdf deleted successfully!");
            }); 
        });
    });

    describe("Error Handling", () => {
        it("Should show error toast when API call fails", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            const { toast } = await import("sonner");
            
            const error = new Error("Network error");
            vi.mocked(FileApiService.deleteFile).mockRejectedValue(error);

            renderWithSidebar(<DeleteFileButton file={mockFile} readOnly={false}/>);

            fireEvent.click(screen.getByText("Delete"));
            fireEvent.click(screen.getByRole("button", { name: /delete/i }));

            await waitFor(() => {
                expect(FileApiService.deleteFile).toHaveBeenCalledWith("file-123");
                expect(toast.error).toHaveBeenCalledWith("Something went wrong while deleting! try again!");
                expect(consoleSpy).toHaveBeenCalledWith(error);
            })
        });
    });
})