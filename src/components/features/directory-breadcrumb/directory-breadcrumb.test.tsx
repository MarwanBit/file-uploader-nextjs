import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DirectoryBreadcrumb from "./directory-breadcrumb";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import DirectoryBreadCrumb from './directory-breadcrumb';

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/api-services/folder-api.service", () => ({ 
    FolderApiService: {
        getAncestors: vi.fn(() => ({
            ancestors: [
                { id: "test-root-folder", name: "root-folder" },
                { id: "test-sub-folder-1", name: "sub-folder-1" },
                { id: "test-sub-sub-folder-1", name: "sub-sub-folder-1" }      
            ]
        })),
    },
}));

const mockUser = {
    firstName: "Amine",
    lastName: "Bit",
    publicMetadata: {
        root_folder: "amine-bit"
    }
};

const mockUseUserReturn = {
    user: mockUser,
    isLoaded: true
};

vi.mock("@clerk/nextjs", () => ({
    useUser: vi.fn(() => mockUseUserReturn),
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("DirectoryBreadcrumb", () => {
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
        it("renders the DirectoryBreadCrumb, using the mockAncestors data", async () => {
            const { FolderApiService } = await import("@/api-services/folder-api.service");
            renderWithSidebar(<DirectoryBreadcrumb folderId={"test-sub-sub-folder-1"}/>);

            await new Promise(resolve => setTimeout(resolve, 100));

            // Test the breadcrumb to see if it is rendering based off of the 
            // provided ancestors from the getAncestors mock.
            await waitFor(() => {
                expect(screen.getByText("root-folder")).toBeInTheDocument();
                expect(screen.getByText("sub-folder-1")).toBeInTheDocument();
                expect(screen.getByText("sub-sub-folder-1")).toBeInTheDocument();

                //Test that the links have correct href attributes
                expect(screen.getByRole("link", { name: 'root-folder' })).toHaveAttribute('href', '/folders/test-root-folder');
                expect(screen.getByRole("link", { name: 'sub-folder-1' })).toHaveAttribute('href', '/folders/test-sub-folder-1');
                expect(screen.getByRole("link", { name: 'sub-sub-folder-1' })).toHaveAttribute('href', '/folders/test-sub-sub-folder-1');
            }, { timeout: 1000 }); // 1 second timeout
        });

        it("renders breadcrumb separators between items", async () => {
            renderWithSidebar(<DirectoryBreadCrumb folderId={"test-sub-sub-folder-1"}/>);
            await waitFor(() => {
                // Check separators are rendered
                const separators = screen.getAllByTestId("breadcrumb-separator");
                expect(separators).toHaveLength(2);
            });
        });
    });

    describe("Testing Edge Cases", () => {
        it("renders root folder when folderId is null", async () => {
            const { useUser } = await import("@clerk/nextjs");
            const { FolderApiService } = await import("@/api-services/folder-api.service");

            renderWithSidebar(<DirectoryBreadcrumb folderId={null}/>);

            await waitFor(() => {
                expect(screen.getByText("AmineBit")).toBeInTheDocument();
                expect(screen.getByRole("link", { name: "AmineBit" })).toHaveAttribute('href', '/folders/amine-bit');
            }, { timeout: 1000 }); // 1 second timeout
        })
    });
})