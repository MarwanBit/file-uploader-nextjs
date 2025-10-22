import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ShareFileButton from "./share-file-button";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { FileApiService } from "@/api-services/file-api.service";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/file-api.service", () => ({
    FileApiService: {
        shareFile: vi.fn(),
    }
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("ShareFileButton", () => {

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
        vi.mocked(FileApiService.shareFile).mockResolvedValue({ url: "https://example.com/shared-file-123" } as unknown as any);
    });

    const renderWithSidebar = (component: React.ReactElement) => {
        return render(
            <SidebarProvider>
                {component}
            </SidebarProvider>
        )
    };

    describe("Testing Rendering", () => {
        it("renders the share file button with correct text", () => {
            renderWithSidebar(<ShareFileButton file={mockFile} readOnly={false}/>);
            expect(screen.getByText("Share")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when share file button is fired", () => {
            renderWithSidebar(<ShareFileButton file={mockFile} readOnly={false}/>);
            // click the share button
            const shareButton = screen.getByRole('button', { name: /share/i });
            fireEvent.click(shareButton);

            // now we should expect the alert dialog to pop up
            expect(screen.getByText("Share File")).toBeInTheDocument();
            expect(screen.getByText("Generate a public link to share the current file and its contents.")).toBeInTheDocument();
            expect(screen.getByText("1 hour")).toBeInTheDocument();
            expect(screen.getByText("4 hours")).toBeInTheDocument();
            expect(screen.getByText("1 day")).toBeInTheDocument();
            expect(screen.getByText("3 days")).toBeInTheDocument();
            expect(screen.getByText("1 week")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
            expect(screen.getByText("Generate Link")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", () => {
            renderWithSidebar(<ShareFileButton file={mockFile} readOnly={false}/>);
            // click the share button
            const shareButton = screen.getByRole('button', { name: /share/i });
            fireEvent.click(shareButton);
            // now let's get the cancel button
            const cancelButton = screen.getByText("Cancel");
            fireEvent.click(cancelButton);
            // Expect the alert dialog options to not be in the area
            expect(screen.queryByText("Generate a public link to share the current file and its contents.")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            expect(screen.queryByText("Generate Link")).not.toBeInTheDocument();
            // Expect the share button to appear and be in the screen
            expect(screen.getByText("Share")).toBeInTheDocument();
        })
    });

    describe("Testing Share Functionality", () => {
        it("Should call FileApiService.shareFile and show link when generate is confirmed", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");

            // Now let's render the button
            renderWithSidebar(<ShareFileButton file={mockFile} readOnly={false}/>);
            
            // Now let's pop up the alert
            fireEvent.click(screen.getByRole('button', { name: /share/i }));

            // Select a duration (1 hour)
            const oneHourButton = screen.getByText("1 hour");
            fireEvent.click(oneHourButton);
     
            // Now let's get the generate button and generate it!
            const generateButton = screen.getByRole("button", { name: /generate link/i });
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(FileApiService.shareFile).toHaveBeenCalled();
                expect(FileApiService.shareFile).toHaveBeenCalledWith("file-123", 1);
                expect(FileApiService.shareFile).toHaveBeenCalledTimes(1);
            }); 
        });

        it("Should handle different duration selections", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");

            renderWithSidebar(<ShareFileButton file={mockFile} readOnly={false}/>);
            
            fireEvent.click(screen.getByRole('button', { name: /share/i }));

            // Select 4 hours
            const fourHoursButton = screen.getByText("4 hours");
            fireEvent.click(fourHoursButton);
     
            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(FileApiService.shareFile).toHaveBeenCalledWith("file-123", 4);
            }); 
        });

        it("Should handle 1 day selection", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");

            renderWithSidebar(<ShareFileButton file={mockFile} readOnly={false}/>);
            
            fireEvent.click(screen.getByRole('button', { name: /share/i }));

            // Select 1 day
            const oneDayButton = screen.getByText("1 day");
            fireEvent.click(oneDayButton);
     
            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(FileApiService.shareFile).toHaveBeenCalledWith("file-123", 24);
            }); 
        });
    });

    describe("Error Handling", () => {
        it("Should show error toast when no duration is selected", async () => {
            const { toast } = await import("sonner");

            renderWithSidebar(<ShareFileButton file={mockFile} readOnly={false}/>);

            fireEvent.click(screen.getByRole('button', { name: /share/i }));
            
            // Don't select any duration, just click generate
            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Please select a share duration!");
            })
        });

        it("Should show error toast when file is null", async () => {
            const { toast } = await import("sonner");

            renderWithSidebar(<ShareFileButton file={null} readOnly={false}/>);

            fireEvent.click(screen.getByRole('button', { name: /share/i }));

            // Select a duration
            const oneHourButton = screen.getByText("1 hour");
            fireEvent.click(oneHourButton);

            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Error, cannot find file to share!");
            })
        });

        it("Should show error toast when API call fails", async () => {
            const { FileApiService } = await import("@/api-services/file-api.service");
            const { toast } = await import("sonner");
            
            const error = new Error("Network error");
            vi.mocked(FileApiService.shareFile).mockRejectedValue(error);

            renderWithSidebar(<ShareFileButton file={mockFile} readOnly={false}/>);

            fireEvent.click(screen.getByRole('button', { name: /share/i }));

            // Select a duration
            const oneHourButton = screen.getByText("1 hour");
            fireEvent.click(oneHourButton);

            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(FileApiService.shareFile).toHaveBeenCalledWith("file-123", 1);
                expect(consoleSpy).toHaveBeenCalledWith(error);
            })
        });
    });
})
