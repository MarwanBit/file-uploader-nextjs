import type { Metadata } from "next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
  const { folderId } = await params;
  const folderIdValue = folderId ? folderId[0] : null;
  
  return (
    <>
        <SidebarProvider>        
            <AppSidebar folderId={folderIdValue} shareToken={null}/>
            <SidebarTrigger />
            {children}
            <Toaster richColors position="top-right"/>
        </SidebarProvider>
    </>
  );
}