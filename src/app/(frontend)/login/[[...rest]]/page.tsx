import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - File Uploader",
  description: "Sign in to your File Uploader account to access your secure cloud file storage and management system.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LogIn() {
  return (
    <div className="flex flex-row">
        <div className="bg-[var(--signup-background)] w-1/2 min-h-screen hidden md:block md:w-1/2">
        </div>
        <div className="flex flex-col justify-center items-center m-auto w-full md:w-1/2">
            <SignIn
              signUpUrl="/signup"
              afterSignInUrl="/folders"/>
        </div>
    </div>
  );
}