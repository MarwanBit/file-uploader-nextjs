import React, { useState } from 'react';
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { type File } from "@/types/types";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

import { IconFolderPlus } from "@tabler/icons-react";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FileApiService } from '@/api-services/file-api.service';

// REFACTORED


export default function NewFileButton({ readOnly }: { readOnly: boolean }) {
    const [file, setFile] = useState<File | null>(null);
    const params = useParams();
    const folderId: string = params.folderId as string;

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file first!");
        }
         try {
            const formData = new FormData();
            formData.append("file", file);
            await FileApiService.uploadFile(folderId, formData)
            toast.success(`File ${file?.name} created successfully!`);
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while uploading!");
        }
    }
   

    return (<AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"outline"}
                    disabled={readOnly}
                    className="w-full justify-start hover:cursor-pointer"
                    data-testid="new-file-button">
                    {React.createElement(IconFolderPlus)}
                    New File
                </Button>
            </SidebarMenuButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>New File</AlertDialogTitle>
            </AlertDialogHeader>
            <Label htmlFor="file">Choose File</Label>
            <Input 
                id="file" 
                type="file"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                        setFile(f);
                    }
                }}/>
            <AlertDialogFooter>
                <AlertDialogCancel
                    className="hover:cursor-pointer">
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                    className="hover:cursor-pointer"
                    onClick={handleUpload}>
                        Upload File
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>);
}