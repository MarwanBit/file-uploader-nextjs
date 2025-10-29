import type { Metadata } from "next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthFolderProvider } from "@/contexts/auth-folder-context";

import { AppSidebar } from "@/components/app-sidebar";

import { Toaster } from "sonner";


export const metadata: Metadata = {
  title: "My Files - File Uploader",
  description: "Manage your files and folders with our secure cloud storage system. Upload, organize, and share files with advanced folder management features.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ folderId?: string[] }>;
}>) {  
  return (
    <>
        <AuthFolderProvider>
          <SidebarProvider>        
              <AppSidebar />
              <SidebarTrigger />
              {children}
              <Toaster richColors position="top-right"/>
          </SidebarProvider>
        </AuthFolderProvider>
    </>
  );
}