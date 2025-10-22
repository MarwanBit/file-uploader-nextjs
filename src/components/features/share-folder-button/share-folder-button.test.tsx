import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ShareFolderButton from "./share-folder-button";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { FolderApiService } from "@/api-services/folder-api.service";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/folder-api.service", () => ({
    FolderApiService: {
        shareFolder: vi.fn(),
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

describe("ShareFolderButton", () => {

    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // Ensure the mock is properly set up
        vi.mocked(FolderApiService.shareFolder).mockResolvedValue({ url: "https://example.com/shared-folder-123" } as unknown as any);
    });

    const renderWithSidebar = (component: React.ReactElement) => {
        return render(
            <SidebarProvider>
                {component}
            </SidebarProvider>
        )
    };

    describe("Testing Rendering", () => {
        it("renders the share folder button with correct text", () => {
            renderWithSidebar(<ShareFolderButton readOnly={false}/>);
            expect(screen.getByText("Share Folder")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when share folder button is fired", () => {
            renderWithSidebar(<ShareFolderButton readOnly={false}/>);
            // click the share folder button
            const shareButton = screen.getByRole('button', { name: /share folder/i });
            fireEvent.click(shareButton);

            // now we should expect the alert dialog to pop up
            expect(screen.getByText("Generate a public link to share the current folder and its contents.")).toBeInTheDocument();
            expect(screen.getByText("1 hour")).toBeInTheDocument();
            expect(screen.getByText("4 hours")).toBeInTheDocument();
            expect(screen.getByText("1 day")).toBeInTheDocument();
            expect(screen.getByText("3 days")).toBeInTheDocument();
            expect(screen.getByText("1 week")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
            expect(screen.getByText("Generate Link")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", () => {
            renderWithSidebar(<ShareFolderButton readOnly={false}/>);
            // click the share folder button
            const shareButton = screen.getByRole('button', { name: /share folder/i });
            fireEvent.click(shareButton);
            // now let's get the cancel button
            const cancelButton = screen.getByText("Cancel");
            fireEvent.click(cancelButton);
            // Expect the alert dialog options to not be in the area
            expect(screen.queryByText("Generate a public link to share the current folder and its contents.")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            expect(screen.queryByText("Generate Link")).not.toBeInTheDocument();
            // Expect the share folder button to appear and be in the screen
            expect(screen.getByText("Share Folder")).toBeInTheDocument();
        })
    });

    describe("Testing Share Functionality", () => {
        it("Should call FolderApiService.shareFolder and show link when generate is confirmed", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");

            // Now let's render the button
            renderWithSidebar(<ShareFolderButton readOnly={false}/>);
            
            // Now let's pop up the alert
            fireEvent.click(screen.getByRole('button', { name: /share folder/i }));

            // Select a duration (1 hour)
            const oneHourButton = screen.getByText("1 hour");
            fireEvent.click(oneHourButton);
     
            // Now let's get the generate button and generate it!
            const generateButton = screen.getByRole("button", { name: /generate link/i });
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(FolderApiService.shareFolder).toHaveBeenCalled();
                expect(FolderApiService.shareFolder).toHaveBeenCalledWith("test-folder-123", 1);
                expect(FolderApiService.shareFolder).toHaveBeenCalledTimes(1);
            }); 
        });

        it("Should handle different duration selections", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");

            renderWithSidebar(<ShareFolderButton readOnly={false}/>);
            
            fireEvent.click(screen.getByRole('button', { name: /share folder/i }));

            // Select 4 hours
            const fourHoursButton = screen.getByText("4 hours");
            fireEvent.click(fourHoursButton);
     
            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(FolderApiService.shareFolder).toHaveBeenCalledWith("test-folder-123", 4);
            }); 
        });

        it("Should handle 1 day selection", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");

            renderWithSidebar(<ShareFolderButton readOnly={false}/>);
            
            fireEvent.click(screen.getByRole('button', { name: /share folder/i }));

            // Select 1 day
            const oneDayButton = screen.getByText("1 day");
            fireEvent.click(oneDayButton);
     
            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(FolderApiService.shareFolder).toHaveBeenCalledWith("test-folder-123", 24);
            }); 
        });

        it("Should handle 3 days selection", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");

            renderWithSidebar(<ShareFolderButton readOnly={false}/>);
            
            fireEvent.click(screen.getByRole('button', { name: /share folder/i }));

            // Select 3 days
            const threeDaysButton = screen.getByText("3 days");
            fireEvent.click(threeDaysButton);
     
            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(FolderApiService.shareFolder).toHaveBeenCalledWith("test-folder-123", 72);
            }); 
        });

        it("Should handle 1 week selection", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");

            renderWithSidebar(<ShareFolderButton readOnly={false}/>);
            
            fireEvent.click(screen.getByRole('button', { name: /share folder/i }));

            // Select 1 week
            const oneWeekButton = screen.getByText("1 week");
            fireEvent.click(oneWeekButton);
     
            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(FolderApiService.shareFolder).toHaveBeenCalledWith("test-folder-123", 168);
            }); 
        });
    });

    describe("Error Handling", () => {
        it("Should show error toast when no duration is selected", async () => {
            const { toast } = await import("sonner");

            renderWithSidebar(<ShareFolderButton readOnly={false}/>);

            fireEvent.click(screen.getByRole('button', { name: /share folder/i }));
            
            // Don't select any duration, just click generate
            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Please select a share duration!");
            })
        });


        it("Should show error toast when API call fails", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");
            
            const error = new Error("Network error");
            vi.mocked(FolderApiService.shareFolder).mockRejectedValue(error);

            renderWithSidebar(<ShareFolderButton readOnly={false}/>);

            fireEvent.click(screen.getByRole('button', { name: /share folder/i }));

            // Select a duration
            const oneHourButton = screen.getByText("1 hour");
            fireEvent.click(oneHourButton);

            fireEvent.click(screen.getByRole("button", { name: /generate link/i }));

            await waitFor(() => {
                expect(FolderApiService.shareFolder).toHaveBeenCalledWith("test-folder-123", 1);
                expect(consoleSpy).toHaveBeenCalledWith(error);
            })
        });
    });
})
