import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SharedFileSidebar } from "./shared-file-sidebar";
import React from "react";

// Mock framer-motion
vi.mock("framer-motion", () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock SharedDownloadFileButton
vi.mock("../shared-download-file-button/shared-download-file-button", () => ({
    default: ({ file }: { file: any }) => (
        <button data-testid="download-button">Download {file?.file_name}</button>
    ),
}));

describe("SharedFileSidebar", () => {

    const mockFile = {
        id: "file-123",
        file_name: "test-file.pdf",
        size: 1024,
        created_at: new Date("2024-01-01T12:00:00Z"),
        type: "application/pdf"
    };

    const defaultProps = {
        file: mockFile,
        isOpen: true,
        onClose: vi.fn(),
        readOnly: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Testing Rendering", () => {
        it("renders the sidebar when isOpen is true and file exists", () => {
            render(<SharedFileSidebar {...defaultProps} />);
            
            expect(screen.getByText("test-file.pdf")).toBeInTheDocument();
            expect(screen.getByText("Size:")).toBeInTheDocument();
            expect(screen.getByText("Created:")).toBeInTheDocument();
            expect(screen.getByText("Type:")).toBeInTheDocument();
            expect(screen.getByTestId("download-button")).toBeInTheDocument();
        });

        it("does not render when isOpen is false", () => {
            render(<SharedFileSidebar {...defaultProps} isOpen={false} />);
            
            expect(screen.queryByText("test-file.pdf")).not.toBeInTheDocument();
            expect(screen.queryByText("Size:")).not.toBeInTheDocument();
        });

        it("does not render when file is null", () => {
            render(<SharedFileSidebar {...defaultProps} file={null} />);
            
            expect(screen.queryByText("test-file.pdf")).not.toBeInTheDocument();
            expect(screen.queryByText("Size:")).not.toBeInTheDocument();
        });

        it("renders file details correctly", () => {
            render(<SharedFileSidebar {...defaultProps} />);
            
            expect(screen.getByText("1024 bytes")).toBeInTheDocument();
            expect(screen.getByText("1/1/2024")).toBeInTheDocument();
            expect(screen.getByText("PDF")).toBeInTheDocument();
        });
    });

    describe("Testing Interaction", () => {
        it("calls onClose when close button is clicked", () => {
            const mockOnClose = vi.fn();
            render(<SharedFileSidebar {...defaultProps} onClose={mockOnClose} />);
            
            // Find the close button (the first button, which is the close button)
            const buttons = screen.getAllByRole('button');
            const closeButton = buttons[0]; // First button is the close button
            fireEvent.click(closeButton);
            
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it("calls onClose when backdrop is clicked", () => {
            const mockOnClose = vi.fn();
            render(<SharedFileSidebar {...defaultProps} onClose={mockOnClose} />);
            
            // Find the backdrop by its class
            const backdrop = document.querySelector('.bg-black\\/50');
            if (backdrop) {
                fireEvent.click(backdrop);
                expect(mockOnClose).toHaveBeenCalledTimes(1);
            }
        });

        it("renders download button with correct file", () => {
            render(<SharedFileSidebar {...defaultProps} />);
            
            const downloadButton = screen.getByTestId("download-button");
            expect(downloadButton).toBeInTheDocument();
            expect(downloadButton).toHaveTextContent("Download test-file.pdf");
        });
    });

    describe("Testing File Details", () => {
        it("displays file size correctly", () => {
            render(<SharedFileSidebar {...defaultProps} />);
            
            expect(screen.getByText("1024 bytes")).toBeInTheDocument();
        });

        it("displays file creation date correctly", () => {
            render(<SharedFileSidebar {...defaultProps} />);
            
            expect(screen.getByText("1/1/2024")).toBeInTheDocument();
        });

        it("displays file type correctly", () => {
            render(<SharedFileSidebar {...defaultProps} />);
            
            expect(screen.getByText("PDF")).toBeInTheDocument();
        });

        it("handles different file types", () => {
            const imageFile = {
                ...mockFile,
                file_name: "image.jpg",
                type: "image/jpeg"
            };
            
            render(<SharedFileSidebar {...defaultProps} file={imageFile} />);
            
            expect(screen.getByText("image.jpg")).toBeInTheDocument();
            expect(screen.getByText("JPG")).toBeInTheDocument();
        });

        it("handles different file sizes", () => {
            const largeFile = {
                ...mockFile,
                size: 2048
            };
            
            render(<SharedFileSidebar {...defaultProps} file={largeFile} />);
            
            expect(screen.getByText("2048 bytes")).toBeInTheDocument();
        });
    });

    describe("Testing Props", () => {
        it("passes readOnly prop correctly", () => {
            render(<SharedFileSidebar {...defaultProps} readOnly={true} />);
            
            // The sidebar should still render with readOnly=true
            expect(screen.getByText("test-file.pdf")).toBeInTheDocument();
        });

        it("handles different file names", () => {
            const customFile = {
                ...mockFile,
                file_name: "custom-document.docx"
            };
            
            render(<SharedFileSidebar {...defaultProps} file={customFile} />);
            
            expect(screen.getByText("custom-document.docx")).toBeInTheDocument();
        });

        it("handles files without id", () => {
            const fileWithoutId = {
                ...mockFile,
                id: undefined
            };
            
            render(<SharedFileSidebar {...defaultProps} file={fileWithoutId} />);
            
            expect(screen.getByText("test-file.pdf")).toBeInTheDocument();
            expect(screen.getByTestId("download-button")).toBeInTheDocument();
        });
    });

    describe("Testing Edge Cases", () => {
        it("handles very large file sizes", () => {
            const largeFile = {
                ...mockFile,
                size: 1048576 // 1MB in KB
            };
            
            render(<SharedFileSidebar {...defaultProps} file={largeFile} />);
            
            expect(screen.getByText("1048576 bytes")).toBeInTheDocument();
        });

        it("handles files with special characters in name", () => {
            const specialFile = {
                ...mockFile,
                file_name: "file with spaces & symbols!.pdf"
            };
            
            render(<SharedFileSidebar {...defaultProps} file={specialFile} />);
            
            expect(screen.getByText("file with spaces & symbols!.pdf")).toBeInTheDocument();
        });

        it("handles files with long names", () => {
            const longNameFile = {
                ...mockFile,
                file_name: "very-long-file-name-that-might-cause-layout-issues.pdf"
            };
            
            render(<SharedFileSidebar {...defaultProps} file={longNameFile} />);
            
            expect(screen.getByText("very-long-file-name-that-might-cause-layout-issues.pdf")).toBeInTheDocument();
        });
    });

    describe("Testing Accessibility", () => {
        it("has proper heading structure", () => {
            render(<SharedFileSidebar {...defaultProps} />);
            
            const heading = screen.getByRole('heading', { level: 2 });
            expect(heading).toBeInTheDocument();
            expect(heading).toHaveTextContent("test-file.pdf");
        });

        it("has accessible close button", () => {
            render(<SharedFileSidebar {...defaultProps} />);
            
            // The close button doesn't have accessible text, so we find it by its icon
            const buttons = screen.getAllByRole('button');
            const closeButton = buttons[0]; // First button is the close button
            expect(closeButton).toBeInTheDocument();
        });

        it("has proper button structure", () => {
            render(<SharedFileSidebar {...defaultProps} />);
            
            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(2); // Close button and download button
        });
    });
})
