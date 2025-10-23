import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileSidebar } from "./file-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import React, { useState } from "react";

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/file-api.service", () => ({
    FileApiService: {
        downloadFile: vi.fn(),
    }
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("FileSidebar", () => {

    const mockFile: File = {
        id: "file-123",
        file_name: "test-file.pdf",
        size: 1024,
        created_at: new Date(2024, 0, 1),
        shared: false,
        s3_link: "https://s3.example.com/file-123",
        expires_at: undefined,
        parent_folder_id: "folder-456",
        owner_clerk_id: "user-789",
        type: "application/pdf"
    };

    let consoleSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const TestWrapper = ({ initialOpen = false } : {
        initialOpen?: boolean
    }) => {
        const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(initialOpen);
        const [selectedFile, setSelectedFile] = useState(mockFile);
        const handleCloseSidebar = () => {
             setIsSidebarOpen(false);
             setSelectedFile(null);
        };
        return (
            <SidebarProvider>
                <FileSidebar 
                    file={selectedFile} 
                    isOpen={isSidebarOpen}
                    onClose={handleCloseSidebar}
                    readOnly={false}/>
            </SidebarProvider>
        );
    };


    describe("Testing Rendering", () => {
        it("should render file details correctly", () => {
            render(<TestWrapper initialOpen={true} />);    
            expect(screen.getByText("test-file.pdf")).toBeInTheDocument();
            expect(screen.getByText("Size:")).toBeInTheDocument();
            expect(screen.getByText("1024kb")).toBeInTheDocument();
            expect(screen.getByText("Created:")).toBeInTheDocument();
            expect(screen.getByText("1/1/2024")).toBeInTheDocument();
            expect(screen.getByText("Type:")).toBeInTheDocument();
            expect(screen.getByText("PDF")).toBeInTheDocument();
            expect(screen.getByText("Download")).toBeInTheDocument();
        });
    });

    describe("Testing Interactivity", () => {
        it("should not render anything when closed", () => {
            render(<TestWrapper initialOpen={false} />);
            expect(screen.queryByText("test-file.pdf")).not.toBeInTheDocument();
            expect(screen.queryByText("Size:")).not.toBeInTheDocument();
            expect(screen.queryByText("1024kb")).not.toBeInTheDocument();
            expect(screen.queryByText("Created:")).not.toBeInTheDocument();
            expect(screen.queryByText("1/1/2024")).not.toBeInTheDocument();
            expect(screen.queryByText("Type:")).not.toBeInTheDocument();
            expect(screen.queryByText("PDF")).not.toBeInTheDocument();
            expect(screen.queryByText("Download")).not.toBeInTheDocument();
        });
    });
})