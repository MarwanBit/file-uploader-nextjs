import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthFolderProvider } from '@/contexts/auth-folder-context';

/**
 * Test wrapper component that provides all necessary context providers
 * for testing components that depend on folder context
 */
export function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AuthFolderProvider>
                {children}
            </AuthFolderProvider>
        </SidebarProvider>
    );
}
