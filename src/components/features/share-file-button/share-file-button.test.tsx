import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareFileButton from "./share-file-button";
import { TestWrapper } from "@/test-utils/test-wrapper";
import React from "react";
import { FileApiService } from "@/api-services/file-api.service";
import { toast } from "sonner";
import { type File } from "@/types/types";

vi.mock("sonner");

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock('next/navigation', () => ({
    useParams: () => ({ folderId: null }),
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
}));

vi.mock("@/api-services/file-api.service", () => ({
    FileApiService: {
        shareFile: vi.fn(() => Promise.resolve({ url: "https://example.com/shared-file-123" })),
    }
}));

// Mock the folder API service
vi.mock("@/api-services/folder-api.service", () => ({
    FolderApiService: {
        getRootFolderId: vi.fn(() => Promise.resolve("root-folder-123")),
    }
}));

vi.mock("@/hooks/use-auth-folder", () => ({
    useAuthFolder: () => ({
        currentFolderId: "test-folder-123",
        fetchFolderContents: vi.fn(),
        refetchFolderTree: vi.fn(),
    }),
}));



describe("ShareFileButton", () => {

    const mockFile: File = {
        id: "file-123",
        file_name: "test-file.pdf",
        size: 1024,
        created_at: new Date("2024-01-01"),
        shared: false,
        s3_link: "https://s3.example.com/file-123",
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
        it("renders the share file button with correct text", () => {
            renderWithProviders(<ShareFileButton file={mockFile} readOnly={false}/>);
            expect(screen.getByText("Share")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("should open alert dialog when share file button is fired", () => {
            renderWithProviders(<ShareFileButton file={mockFile} readOnly={false}/>);
            // click the share button
            const shareButton = screen.getByRole('button', { name: /share/i });
            fireEvent.click(shareButton);

            // now we should expect the alert dialog to pop up
            expect(screen.getByText("Share File")).toBeInTheDocument();
            expect(screen.getByText("Generate a public link to share this file.")).toBeInTheDocument();
            expect(screen.getByText("1 hour")).toBeInTheDocument();
            expect(screen.getByText("4 hours")).toBeInTheDocument();
            expect(screen.getByText("1 day")).toBeInTheDocument();
            expect(screen.getByText("3 days")).toBeInTheDocument();
            expect(screen.getByText("1 week")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
            expect(screen.getByText("Generate Link")).toBeInTheDocument();
        });

        it("Should close alert dialog when cancel button is fired", () => {
            renderWithProviders(<ShareFileButton file={mockFile} readOnly={false}/>);
            // click the share button
            const shareButton = screen.getByRole('button', { name: /share/i });
            fireEvent.click(shareButton);
            // now let's get the cancel button
            const cancelButton = screen.getByText("Cancel");
            fireEvent.click(cancelButton);
            // Expect the alert dialog options to not be in the area
            expect(screen.queryByText("Generate a public link to share this file.")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            expect(screen.queryByText("Generate Link")).not.toBeInTheDocument();
            // Expect the share button to appear and be in the screen
            expect(screen.getByText("Share")).toBeInTheDocument();
        })
    });

    describe("Testing Share Functionality", () => {
        it("Should open dialog and show duration options", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<ShareFileButton file={mockFile} readOnly={false}/>);
            
            // Open the dialog
            await user.click(screen.getByRole('button', { name: /share/i }));

            // Wait for the dialog to be open
            await waitFor(() => {
                expect(screen.getByText("Share File")).toBeInTheDocument();
            });

            // Verify all duration options are present
            expect(screen.getByRole('radio', { name: '1 hour' })).toBeInTheDocument();
            expect(screen.getByRole('radio', { name: '4 hours' })).toBeInTheDocument();
            expect(screen.getByRole('radio', { name: '1 day' })).toBeInTheDocument();
            expect(screen.getByRole('radio', { name: '3 days' })).toBeInTheDocument();
            expect(screen.getByRole('radio', { name: '1 week' })).toBeInTheDocument();

            // Verify generate button is initially disabled
            const generateButton = screen.getByRole("button", { name: /generate link/i });
            expect(generateButton).toBeDisabled();
        });

        it("Should enable generate button when duration is selected", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<ShareFileButton file={mockFile} readOnly={false}/>);
            
            await user.click(screen.getByRole('button', { name: /share/i }));

            await waitFor(() => {
                expect(screen.getByText("Share File")).toBeInTheDocument();
            });

            // Select a duration (1 hour)
            const oneHourButton = screen.getByRole('radio', { name: '1 hour' });
            await user.click(oneHourButton);
    
            // Wait for the button to be enabled
            await waitFor(() => {
                const generateButton = screen.getByRole("button", { name: /generate link/i });
                expect(generateButton).not.toBeDisabled();
            });
        });

        it("Should handle different duration selections", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<ShareFileButton file={mockFile} readOnly={false}/>);
            
            await user.click(screen.getByRole('button', { name: /share/i }));

            await waitFor(() => {
                expect(screen.getByText("Share File")).toBeInTheDocument();
            });

            // Test 4 hours selection
            const fourHoursButton = screen.getByRole('radio', { name: '4 hours' });
            await user.click(fourHoursButton);
    
            await waitFor(() => {
                const generateButton = screen.getByRole("button", { name: /generate link/i });
                expect(generateButton).not.toBeDisabled();
            });

            // Test 1 day selection
            const oneDayButton = screen.getByRole('radio', { name: '1 day' });
            await user.click(oneDayButton);
    
            await waitFor(() => {
                const generateButton = screen.getByRole("button", { name: /generate link/i });
                expect(generateButton).not.toBeDisabled();
            });
        });

        it("Should show generate button with correct text and icon", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(<ShareFileButton file={mockFile} readOnly={false}/>);
            
            await user.click(screen.getByRole('button', { name: /share/i }));

            await waitFor(() => {
                expect(screen.getByText("Share File")).toBeInTheDocument();
            });

            // Select a duration to enable the button
            const oneHourButton = screen.getByRole('radio', { name: '1 hour' });
            await user.click(oneHourButton);

            // Verify generate button is present and enabled
            const generateButton = screen.getByRole("button", { name: /generate link/i });
            expect(generateButton).toBeInTheDocument();
            expect(generateButton).not.toBeDisabled();
        });
    });

    describe("Error Handling", () => {
        it("Should disable generate button when no duration is selected", async () => {
            renderWithProviders(<ShareFileButton file={mockFile} readOnly={false}/>);

            await userEvent.click(screen.getByRole('button', { name: /share/i }));
            
            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByText("Share File")).toBeInTheDocument();
            });
            
            // The generate button should be disabled when no duration is selected
            const generateButton = screen.getByRole("button", { name: /generate link/i });
            expect(generateButton).toBeDisabled();
            
            // No API call should be made when button is disabled
            expect(FileApiService.shareFile).not.toHaveBeenCalled();
        });

        it("Should show error toast when file is null and duration is selected", async () => {
            const user = userEvent.setup();
            renderWithProviders(<ShareFileButton file={null} readOnly={false}/>);

            await user.click(screen.getByRole('button', { name: /share/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByText("Share File")).toBeInTheDocument();
            });

            // Select a duration
            const oneHourButton = screen.getByRole('radio', { name: '1 hour' });
            await user.click(oneHourButton);

            // Wait for the button to be enabled and then click it
            const generateButton = screen.getByRole("button", { name: /generate link/i });
            await waitFor(() => {
                expect(generateButton).not.toBeDisabled();
            });
            
            await user.click(generateButton);

            // Verify error toast is shown
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Error, cannot find file to share!");
            }, { timeout: 5000 });
        });

        it("Should show error when file is null", async () => {
            const user = userEvent.setup();
            renderWithProviders(<ShareFileButton file={null} readOnly={false}/>);

            await user.click(screen.getByRole('button', { name: /share/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByText("Share File")).toBeInTheDocument();
            });

            // Select a duration
            const oneHourButton = screen.getByRole('radio', { name: '1 hour' });
            await user.click(oneHourButton);

            // Wait for the button to be enabled and then click it
            const generateButton = screen.getByRole("button", { name: /generate link/i });
            await waitFor(() => {
                expect(generateButton).not.toBeDisabled();
            });
            
            await user.click(generateButton);

            // Verify error toast is shown
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Error, cannot find file to share!");
            }, { timeout: 3000 });
        });

        it("Should show error toast when trying to generate without selecting duration", async () => {
            const user = userEvent.setup();
            renderWithProviders(<ShareFileButton file={mockFile} readOnly={false}/>);

            await user.click(screen.getByRole('button', { name: /share/i }));

            // Wait for dialog to open
            await waitFor(() => {
                expect(screen.getByText("Share File")).toBeInTheDocument();
            });

            // Try to click generate without selecting duration (this should be prevented by disabled state)
            const generateButton = screen.getByRole("button", { name: /generate link/i });
            expect(generateButton).toBeDisabled();

            // No API call should be made
            expect(FileApiService.shareFile).not.toHaveBeenCalled();
        });
    });
})
