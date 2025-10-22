import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewFolderButton from "./new-folder-button";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { FolderApiService } from "@/api-services/folder-api.service";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/folder-api.service", () => ({
    FolderApiService: {
        createFolder: vi.fn(),
    }
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("next/navigation", () => ({
    useParams: vi.fn(() => ({
        folderId: "test-folder-123"
    })),
}));

// Mock window.location.reload
Object.defineProperty(window, 'location', {
    value: {
        reload: vi.fn()
    },
    writable: true
});

describe("NewFolderButton", () => {

    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // Ensure the mock is properly set up
        vi.mocked(FolderApiService.createFolder).mockResolvedValue({} as unknown as any);
    });

    const renderWithSidebar = (component: React.ReactElement) => {
        return render(
            <SidebarProvider>
                {component}
            </SidebarProvider>
        )
    };

    describe("Testing Rendering", () => {
        it("renders the new folder button with correct text", () => {
            renderWithSidebar(<NewFolderButton readOnly={false}/>);
            expect(screen.getByText("New Folder")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when new folder button is fired", () => {
            renderWithSidebar(<NewFolderButton readOnly={false}/>);
            // click the new folder button
            const newFolderButton = screen.getByRole('button', { name: /new folder/i });
            fireEvent.click(newFolderButton);

            // now we should expect the alert dialog to pop up
            expect(screen.getByPlaceholderText("Enter your folder name...")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
            expect(screen.getByText("Create Folder")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", () => {
            renderWithSidebar(<NewFolderButton readOnly={false}/>);
            // click the new folder button
            const newFolderButton = screen.getByRole('button', { name: /new folder/i });
            fireEvent.click(newFolderButton);
            // now let's get the cancel button
            const cancelButton = screen.getByText("Cancel");
            fireEvent.click(cancelButton);
            // Expect the alert dialog options to not be in the area
            expect(screen.queryByText("Enter your folder name...")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            expect(screen.queryByText("Create Folder")).not.toBeInTheDocument();
            // Expect the new folder button to appear and be in the screen
            expect(screen.getByText("New Folder")).toBeInTheDocument();
        })
    });

    describe("Testing Create Functionality", () => {
        it("Should call FolderApiService.createFolder and show success toast when create is confirmed", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");
            const { toast } = await import("sonner");

            // Now let's render the button
            renderWithSidebar(<NewFolderButton readOnly={false}/>);
            
            // Now let's pop up the alert
            fireEvent.click(screen.getByRole('button', { name: /new folder/i }));

            // Enter folder name
            const folderNameInput = screen.getByPlaceholderText("Enter your folder name...");
            fireEvent.change(folderNameInput, { target: { value: "My New Folder" } });
     
            // Now let's get the create button and create it!
            const createButton = screen.getByRole("button", { name: /create folder/i });
            fireEvent.click(createButton);

            await waitFor(() => {
                expect(FolderApiService.createFolder).toHaveBeenCalled();
                expect(FolderApiService.createFolder).toHaveBeenCalledWith("My New Folder", "test-folder-123");
                expect(FolderApiService.createFolder).toHaveBeenCalledTimes(1);
                expect(toast.success).toHaveBeenCalledWith('Folder "My New Folder" created!');
            }); 
        });
    });

    describe("Error Handling", () => {
        it("Should not create folder when folder name is empty", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");

            renderWithSidebar(<NewFolderButton readOnly={false}/>);

            fireEvent.click(screen.getByRole('button', { name: /new folder/i }));
            
            // Don't enter any folder name, just click create
            fireEvent.click(screen.getByRole("button", { name: /create folder/i }));

            await waitFor(() => {
                expect(FolderApiService.createFolder).not.toHaveBeenCalled();
            })
        });

        it("Should show error toast when API call fails", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");
            const { toast } = await import("sonner");
            
            const error = new Error("Network error");
            vi.mocked(FolderApiService.createFolder).mockRejectedValue(error);

            renderWithSidebar(<NewFolderButton readOnly={false}/>);

            fireEvent.click(screen.getByRole('button', { name: /new folder/i }));

            // Enter folder name
            const folderNameInput = screen.getByPlaceholderText("Enter your folder name...");
            fireEvent.change(folderNameInput, { target: { value: "My New Folder" } });

            fireEvent.click(screen.getByRole("button", { name: /create folder/i }));

            await waitFor(() => {
                expect(FolderApiService.createFolder).toHaveBeenCalledWith("My New Folder", "test-folder-123");
                expect(toast.error).toHaveBeenCalledWith("Something went wrong while creating the folder.");
            })
        });
    });
})
