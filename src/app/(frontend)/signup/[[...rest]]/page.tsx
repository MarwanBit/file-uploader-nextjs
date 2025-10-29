import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - File Uploader",
  description: "Create your File Uploader account to start managing your files securely in the cloud with advanced folder organization and sharing features.",
  robots: { index: false, follow: true },
};

export default function LogIn() {
  return (
    <div className="flex flex-row">
        <div className="bg-[var(--signup-background)] w-1/2 min-h-screen hidden md:block md:w-1/2">
        </div>
        <div className="flex flex-col justify-center items-center m-auto w-full md:w-1/2">
            <SignUp
              signInUrl="/login"
              afterSignUpUrl="/folders"/>
        </div>
    </div>
  );
}