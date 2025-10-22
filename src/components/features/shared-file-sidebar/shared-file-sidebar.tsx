// src/components/features/file-sidebar/file-sidebar.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IconX } from "@tabler/icons-react";
import SharedDownloadFileButton from "../shared-download-file-button/shared-download-file-button";
import { type File } from "@/types/types";

interface FileSidebarProps {
  file?: File | null;
  isOpen: boolean;
  onClose: () => void;
  readOnly: boolean;
}

// Helper function to extract file extension
const getFileType = (fileName: string): string => {
  const extension = fileName.split('.').pop();
  return extension ? extension.toUpperCase() : 'Unknown';
};

// REFACTORED

export function SharedFileSidebar({ file, isOpen, onClose, readOnly }: FileSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && file && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Sliding Panel */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200,
              duration: 0.3 
            }}
            className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-50"
          >
            <div className="p-6 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{file.file_name}</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <IconX className="h-4 w-4" />
                </Button>
              </div>

              {/* File Details */}
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground font-bold">Size:</span>
                    <span className="text-sm">{file.size}kb</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground font-bold">Created:</span>
                    <span className="text-sm">{(new Date(file.created_at)).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground font-bold">Type:</span>
                    <span className="text-sm">{getFileType(file.file_name)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 flex-1">
                <SharedDownloadFileButton file={file}/>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}