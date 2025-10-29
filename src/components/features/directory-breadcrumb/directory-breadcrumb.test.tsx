import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DirectoryBreadcrumb from "./directory-breadcrumb";
import { TestWrapper } from "@/test-utils/test-wrapper";
import React from "react";


vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

// Mock Clerk's useUser hook
vi.mock("@clerk/nextjs", () => ({
    useUser: () => ({
        user: {
            firstName: "Amine",
            lastName: "Bit",
            publicMetadata: {
                root_folder: "test-root-folder"
            }
        }
    })
}));

// Mock useAuthFolder hook
vi.mock("@/hooks/use-auth-folder", () => ({
    useAuthFolder: () => ({
        currentFolderId: "test-folder-123"
    })
}));

// Mock FolderApiService
vi.mock("@/api-services/folder-api.service", () => ({ 
    FolderApiService: {
        getAncestors: vi.fn(() => Promise.resolve({
            ancestors: [
                { id: "test-root-folder", name: "root-folder" },
                { id: "test-sub-folder-1", name: "sub-folder-1" },
                { id: "test-sub-sub-folder-1", name: "sub-sub-folder-1" }      
            ]
        })),
        getFolder: vi.fn(() => Promise.resolve({
            id: "test-root-folder",
            folder_name: "root_user_123",
            display_name: "AmineBit"
        })),
        getRootFolderId: vi.fn(() => Promise.resolve("test-folder-123")),
        getFolderContents: vi.fn(() => Promise.resolve({ files: [], subFolders: [] })),
    },
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
        promise: vi.fn(async (promise, options) => {
            try {
                const result = await promise;
                if (options?.success) {
                    options.success(result);
                }
                return result;
            } catch (error) {
                if (options?.error) {
                    options.error(error);
                }
                throw error;
            }
        }),
        loading: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
        dismiss: vi.fn(),
    },
}));

describe("DirectoryBreadcrumb", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <TestWrapper>
                {component}
            </TestWrapper>
        );
    };

    describe("Testing Rendering", () => {
        it("renders the DirectoryBreadCrumb, using the mockAncestors data", async () => {
            renderWithProviders(<DirectoryBreadcrumb folderId={"test-sub-sub-folder-1"}/>);

            await new Promise(resolve => setTimeout(resolve, 100));

            // Test the breadcrumb to see if it is rendering based off of the 
            // provided ancestors from the getAncestors mock.
            await waitFor(() => {
                expect(screen.getByText("root-folder")).toBeInTheDocument();
                expect(screen.getByRole("link", { name: "root-folder" })).toHaveAttribute('href', '/folders/test-root-folder');
            }, { timeout: 1000 }); // 1 second timeout
        });

        it("renders breadcrumb with correct structure", async () => {
            renderWithProviders(<DirectoryBreadcrumb folderId={"test-sub-sub-folder-1"}/>);
            await waitFor(() => {
                // Check that the breadcrumb structure is present
                expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument();
                expect(screen.getByRole("list")).toBeInTheDocument();
            });
        });
    });

    describe("Testing Edge Cases", () => {
        it("renders root folder when folderId is null", async () => {
            renderWithProviders(<DirectoryBreadcrumb folderId={null}/>);

            await waitFor(() => {
                expect(screen.getByText("root-folder")).toBeInTheDocument();
                expect(screen.getByRole("link", { name: "root-folder" })).toHaveAttribute('href', '/folders/test-root-folder');
            }, { timeout: 1000 }); // 1 second timeout
        })
    });
})