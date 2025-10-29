import type { Metadata } from "next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { Toaster } from "sonner";
import { FolderProvider } from "@/contexts/folder-context";
import { SharedAppSidebar } from "@/components/shared-app-sidebar";


export const metadata: Metadata = {
  title: "Shared Folder - File Uploader",
  description: "View and download files from a shared folder. Access shared files securely with our file sharing system.",
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
  params: Promise<{ shareToken: string }>;
}>) {
  const { shareToken } = await params;
  return (
    <>
        <FolderProvider initialShareToken={ shareToken }>
          <SidebarProvider>        
              <SharedAppSidebar />
              <SidebarTrigger />
              {children}
              <Toaster richColors position="top-right"/>
          </SidebarProvider>
        </FolderProvider>
    </>
  );
}