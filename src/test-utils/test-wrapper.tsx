import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthFolderProvider } from '@/contexts/auth-folder-context';
import { ClerkProvider } from '@clerk/nextjs';

/**
 * Test wrapper component that provides all necessary context providers
 * for testing components that depend on folder context and authentication
 */
export function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <SidebarProvider>
                <AuthFolderProvider>
                    {children}
                </AuthFolderProvider>
            </SidebarProvider>
        </ClerkProvider>
    );
}
