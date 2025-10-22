import type { Metadata } from "next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import { Toaster } from "sonner";


export const metadata: Metadata = {
  title: "File Uploader",
  description: "File Uploader, share and upload files and folders with friends!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
        <SidebarProvider>        
            <AppSidebar />
            <SidebarTrigger />
            {children}
            <Toaster richColors position="top-right"/>
        </SidebarProvider>
    </>
  );
}