import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SharedFolderTable from "./shared-folder-table";
import React from "react";

vi.mock("@/hooks/use-folder", () => ({
    useFolder: vi.fn(() => ({
        setCurrentFolder: vi.fn(),
        folderMap: {
            "folder-1": {
                id: "folder-1",
                folder_name: "Documents",
                created_at: new Date("2024-01-01"),
                updated_at: new Date("2024-01-01"),
                is_root: false,
                s3_link: "https://s3.example.com/folder-1",
                shared: false,
                expires_at: undefined,
                owner_clerk_id: "user-123",
                files: [],
                subfolders: []
            },
            "folder-2": {
                id: "folder-2",
                folder_name: "Images",
                created_at: new Date("2024-01-02"),
                updated_at: new Date("2024-01-02"),
                is_root: false,
                s3_link: "https://s3.example.com/folder-2",
                shared: false,
                expires_at: undefined,
                owner_clerk_id: "user-123",
                files: [],
                subfolders: []
            }
        }
    }))
}));

describe("SharedFolderTable", () => {

    const mockFiles = [
        {
            id: "file-1",
            file_name: "document.pdf",
            size: 1024,
            created_at: new Date("2024-01-01"),
            type: "application/pdf"
        },
        {
            id: "file-2",
            file_name: "image.jpg",
            size: 2048,
            created_at: new Date("2024-01-02"),
            type: "image/jpeg"
        }
    ];

    const mockFolders = [
        {
            id: "folder-1",
            folder_name: "Documents",
            created_at: new Date("2024-01-01"),
            updated_at: new Date("2024-01-01"),
            is_root: false,
            s3_link: "https://s3.example.com/folder-1",
            shared: false,
            expires_at: undefined,
            owner_clerk_id: "user-123",
            files: [],
            subfolders: []
        },
        {
            id: "folder-2",
            folder_name: "Images",
            created_at: new Date("2024-01-02"),
            updated_at: new Date("2024-01-02"),
            is_root: false,
            s3_link: "https://s3.example.com/folder-2",
            shared: false,
            expires_at: undefined,
            owner_clerk_id: "user-123",
            files: [],
            subfolders: []
        }
    ];

    const defaultProps = {
        files: mockFiles,
        handleRowClick: vi.fn(),
        folders: mockFolders
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Testing Rendering", () => {
        it("renders the table with correct caption", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            expect(screen.getByText("Contents of the Current Folder")).toBeInTheDocument();
        });

        it("renders table headers correctly", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            expect(screen.getByText("Content Type")).toBeInTheDocument();
            expect(screen.getByText("Name")).toBeInTheDocument();
            expect(screen.getByText("Size")).toBeInTheDocument();
            expect(screen.getByText("Created At")).toBeInTheDocument();
        });

        it("renders folders in the table", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            expect(screen.getByText("Documents")).toBeInTheDocument();
            expect(screen.getByText("Images")).toBeInTheDocument();
            expect(screen.getAllByText("Folder")).toHaveLength(2);
        });

        it("renders files in the table", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            expect(screen.getByText("document.pdf")).toBeInTheDocument();
            expect(screen.getByText("image.jpg")).toBeInTheDocument();
            expect(screen.getAllByText("File")).toHaveLength(2);
        });

        it("renders file sizes correctly", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            expect(screen.getByText("1024kb")).toBeInTheDocument();
            expect(screen.getByText("2048kb")).toBeInTheDocument();
        });

        it("renders folder sizes as dashes", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            expect(screen.getAllByText("---")).toHaveLength(2);
        });
    });

    describe("Testing Interaction", () => {
        it("calls handleRowClick when file row is clicked", () => {
            const mockHandleRowClick = vi.fn();
            render(<SharedFolderTable {...defaultProps} handleRowClick={mockHandleRowClick} />);
            
            const fileRow = screen.getByText("document.pdf");
            fireEvent.click(fileRow);
            
            expect(mockHandleRowClick).toHaveBeenCalledWith(mockFiles[0]);
        });

        it("calls setCurrentFolder when folder row is clicked", async () => {
            const { useFolder } = await import("@/hooks/use-folder");
            const mockSetCurrentFolder = vi.fn();
            
            vi.mocked(useFolder).mockReturnValue({
                setCurrentFolder: mockSetCurrentFolder,
                folderMap: {
                    "folder-1": mockFolders[0],
                    "folder-2": mockFolders[1]
                }
            });

            render(<SharedFolderTable {...defaultProps} />);
            
            const folderRow = screen.getByText("Documents");
            fireEvent.click(folderRow);
            
            expect(mockSetCurrentFolder).toHaveBeenCalledWith(mockFolders[0]);
        });

        it("handles multiple file clicks", () => {
            const mockHandleRowClick = vi.fn();
            render(<SharedFolderTable {...defaultProps} handleRowClick={mockHandleRowClick} />);
            
            // Click first file
            fireEvent.click(screen.getByText("document.pdf"));
            expect(mockHandleRowClick).toHaveBeenCalledWith(mockFiles[0]);
            
            // Click second file
            fireEvent.click(screen.getByText("image.jpg"));
            expect(mockHandleRowClick).toHaveBeenCalledWith(mockFiles[1]);
            
            expect(mockHandleRowClick).toHaveBeenCalledTimes(2);
        });
    });

    describe("Testing Data Display", () => {
        it("displays file creation dates correctly", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            // Check that dates are present (there might be multiple with same date)
            expect(screen.getAllByText("1/1/2024")).toHaveLength(2); // Folder and file both have this date
            expect(screen.getAllByText("1/2/2024")).toHaveLength(2); // Folder and file both have this date
        });

        it("displays folder creation dates correctly", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            // Should show folder creation dates
            expect(screen.getAllByText("1/1/2024")).toHaveLength(2); // Folder and file both have this date
            expect(screen.getAllByText("1/2/2024")).toHaveLength(2); // Folder and file both have this date
        });

        it("displays content types correctly", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            expect(screen.getAllByText("Folder")).toHaveLength(2);
            expect(screen.getAllByText("File")).toHaveLength(2);
        });
    });

    describe("Testing Edge Cases", () => {
        it("handles empty files array", () => {
            render(<SharedFolderTable {...defaultProps} files={[]} />);
            
            expect(screen.getByText("Contents of the Current Folder")).toBeInTheDocument();
            expect(screen.queryByText("document.pdf")).not.toBeInTheDocument();
            expect(screen.getByText("Documents")).toBeInTheDocument(); // Folders should still show
        });

        it("handles empty folders array", () => {
            render(<SharedFolderTable {...defaultProps} folders={[]} />);
            
            expect(screen.getByText("Contents of the Current Folder")).toBeInTheDocument();
            expect(screen.queryByText("Documents")).not.toBeInTheDocument();
            expect(screen.getByText("document.pdf")).toBeInTheDocument(); // Files should still show
        });

        it("handles null folders", () => {
            render(<SharedFolderTable {...defaultProps} folders={null} />);
            
            expect(screen.getByText("Contents of the Current Folder")).toBeInTheDocument();
            expect(screen.queryByText("Documents")).not.toBeInTheDocument();
            expect(screen.getByText("document.pdf")).toBeInTheDocument(); // Files should still show
        });

        it("handles undefined folders", () => {
            render(<SharedFolderTable {...defaultProps} folders={undefined} />);
            
            expect(screen.getByText("Contents of the Current Folder")).toBeInTheDocument();
            expect(screen.queryByText("Documents")).not.toBeInTheDocument();
            expect(screen.getByText("document.pdf")).toBeInTheDocument(); // Files should still show
        });

        it("handles files without id", () => {
            const filesWithoutId = [
                {
                    file_name: "no-id-file.pdf",
                    size: 512,
                    created_at: new Date("2024-01-03"),
                    type: "application/pdf"
                }
            ];
            
            render(<SharedFolderTable {...defaultProps} files={filesWithoutId} />);
            
            expect(screen.getByText("no-id-file.pdf")).toBeInTheDocument();
        });
    });

    describe("Testing Table Structure", () => {
        it("has correct table structure", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            const table = screen.getByRole('table');
            expect(table).toBeInTheDocument();
            
            const rows = screen.getAllByRole('row');
            expect(rows).toHaveLength(5); // 1 header + 2 folders + 2 files
        });

        it("has proper table headers", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            const headerRow = screen.getByRole('row', { name: /content type name size created at/i });
            expect(headerRow).toBeInTheDocument();
        });

        it("has clickable rows", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            const rows = screen.getAllByRole('row');
            // All data rows should be clickable (skip header row)
            const dataRows = rows.slice(1);
            dataRows.forEach(row => {
                expect(row).toHaveClass('cursor-pointer');
            });
        });
    });

    describe("Testing Accessibility", () => {
        it("has proper table caption", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            const caption = screen.getByText("Contents of the Current Folder");
            expect(caption).toBeInTheDocument();
        });

        it("has proper table headers", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            const headers = screen.getAllByRole('columnheader');
            expect(headers).toHaveLength(4);
            expect(headers[0]).toHaveTextContent("Content Type");
            expect(headers[1]).toHaveTextContent("Name");
            expect(headers[2]).toHaveTextContent("Size");
            expect(headers[3]).toHaveTextContent("Created At");
        });

        it("has proper table cells", () => {
            render(<SharedFolderTable {...defaultProps} />);
            
            const cells = screen.getAllByRole('cell');
            expect(cells.length).toBeGreaterThan(0);
        });
    });
})
