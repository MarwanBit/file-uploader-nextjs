import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/themes';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "File Uploader - Secure Cloud File Management",
  description: "A modern, secure file uploader and management system with folder organization, file sharing, and cloud storage integration.",
  keywords: ["file upload", "cloud storage", "file management", "secure files", "folder organization"],
  authors: [{ name: "MarwanBit" }],
  creator: "MarwanBit",
  publisher: "File Uploader",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://file-uploader-nextjs.vercel.app",
    title: "File Uploader - Secure Cloud File Management",
    description: "A modern, secure file uploader and management system with folder organization, file sharing, and cloud storage integration.",
    siteName: "File Uploader",
  },
  twitter: {
    card: "summary_large_image",
    title: "File Uploader - Secure Cloud File Management",
    description: "A modern, secure file uploader and management system with folder organization, file sharing, and cloud storage integration.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider
        appearance = {{
          baseTheme: shadcn
        }}>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            {children}
          </body>
      </ClerkProvider>
    </html>
  );
}
