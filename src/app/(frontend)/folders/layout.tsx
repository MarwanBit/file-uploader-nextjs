import type { Metadata } from "next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthFolderProvider } from "@/contexts/auth-folder-context";

import { AppSidebar } from "@/components/app-sidebar";

import { Toaster } from "sonner";


export const metadata: Metadata = {
  title: "File Uploader",
  description: "File Uploader, share and upload files and folders with friends!",
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