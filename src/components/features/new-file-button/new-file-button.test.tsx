import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewFileButton from "./new-file-button";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { FileApiService } from "@/api-services/file-api.service";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/file-api.service", () => ({
    FileApiService: {
        uploadFile: vi.fn(),
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

describe("NewFileButton", () => {

    let consoleSpy: ReturnType<typeof vi.spyOn>;

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
        it("renders the new file button with correct text", () => {
            renderWithSidebar(<NewFileButton readOnly={false}/>);
            expect(screen.getByText("New File")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when new file button is fired", () => {
            renderWithSidebar(<NewFileButton readOnly={false}/>);
            // click the new file button
            const newFileButton = screen.getByRole('button', { name: /new file/i });
            fireEvent.click(newFileButton);

            // now we should expect the alert dialog to pop up
            expect(screen.getByText("Choose File")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
            expect(screen.getByText("Upload File")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", () => {
            renderWithSidebar(<NewFileButton readOnly={false}/>);
            // click the new file button
            const newFileButton = screen.getByRole('button', { name: /new file/i });
            fireEvent.click(newFileButton);
            // now let's get the cancel button
            const cancelButton = screen.getByText("Cancel");
            fireEvent.click(cancelButton);
            // Expect the alert dialog options to not be in the area
            expect(screen.queryByText("Choose File")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            expect(screen.queryByText("Upload File")).not.toBeInTheDocument();
            // Expect the new file button to appear and be in the screen
            expect(screen.getByText("New File")).toBeInTheDocument();
        })
    });

    describe("Testing Upload Functionality", () => {
        it("Should call FileApiService.uploadFile and show success toast when upload is confirmed", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            const { toast } = await import("sonner");

            // Now let's render the button
            renderWithSidebar(<NewFileButton readOnly={false}/>);
            
            // Now let's pop up the alert
            fireEvent.click(screen.getByRole('button', { name: /new file/i }));

            // Create a mock file
            const mockFile = new File(['test content'], 'test-file.pdf', { type: 'application/pdf' });
            
            // Select file
            const fileInput = screen.getByLabelText('Choose File');
            fireEvent.change(fileInput, { target: { files: [mockFile] } });
            
            // Wait for file to be processed
            await waitFor(() => {
                expect(fileInput).toBeInTheDocument();
            });
     
            // Now let's get the upload button and upload it!
            const uploadButton = screen.getByRole("button", { name: /upload file/i });
            fireEvent.click(uploadButton);

            await waitFor(() => {
                expect(FileApiService.uploadFile).toHaveBeenCalled();
                expect(FileApiService.uploadFile).toHaveBeenCalledWith("test-folder-123", expect.any(FormData));
                expect(FileApiService.uploadFile).toHaveBeenCalledTimes(1);
                expect(toast.success).toHaveBeenCalledWith("File test-file.pdf created successfully!");
            }); 
        });
    });

    describe("Error Handling", () => {
        it("Should show error toast when no file is selected", async () => {
            const { toast } = await import("sonner");

            renderWithSidebar(<NewFileButton readOnly={false}/>);

            fireEvent.click(screen.getByRole('button', { name: /new file/i }));
            fireEvent.click(screen.getByRole("button", { name: /upload file/i }));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Please select a file first!");
            })
        });

        it("Should show error toast when API call fails", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            const { toast } = await import("sonner");
            
            const error = new Error("Network error");
            vi.mocked(FileApiService.uploadFile).mockRejectedValue(error);

            renderWithSidebar(<NewFileButton readOnly={false}/>);

            fireEvent.click(screen.getByRole('button', { name: /new file/i }));

            // Create a mock file
            const mockFile = new File(['test content'], 'test-file.pdf', { type: 'application/pdf' });
            
            // Select file
            const fileInput = screen.getByLabelText('Choose File');
            fireEvent.change(fileInput, { target: { files: [mockFile] } });

            fireEvent.click(screen.getByRole("button", { name: /upload file/i }));

            await waitFor(() => {
                expect(FileApiService.uploadFile).toHaveBeenCalledWith("test-folder-123", expect.any(FormData));
                expect(toast.error).toHaveBeenCalledWith("Something went wrong while uploading!");
                expect(consoleSpy).toHaveBeenCalledWith(error);
            })
        });
    });
})
