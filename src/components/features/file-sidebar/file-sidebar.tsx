/**
 * @fileoverview Sidebar component displaying file details and actions.
 * 
 * This component renders an animated slide-out sidebar showing file information
 * and action buttons. Uses Framer Motion for smooth animations and provides
 * a backdrop overlay for better UX.
 * 
 * @module components/features/file-sidebar
 */
// src/components/features/file-sidebar/file-sidebar.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IconX } from "@tabler/icons-react";
import DownloadFileButton from "@/components/features/download-file-button/download-file-button";
import ShareFileButton from "../share-file-button/share-file-button";
import DeleteFileButton from "../delete-file-button/delete-file-button";
import { type File } from "@/types/types";

/**
 * Props for the FileSidebar component.
 */
interface FileSidebarProps {
  /** The file to display (null if no file selected) */
  file?: File | null;
  /** Whether the sidebar is visible */
  isOpen: boolean;
  /** Callback to close the sidebar */
  onClose: () => void;
  /** If true, disables write actions (share, delete) */
  readOnly: boolean;
}

/**
 * Helper function to extract file extension.
 * 
 * @param fileName - The full filename with extension
 * @returns Uppercase file extension or "Unknown"
 */
const getFileType = (fileName: string): string => {
  const extension = fileName.split('.').pop();
  return extension ? extension.toUpperCase() : 'Unknown';
};

/**
 * Animated sidebar component for file details and actions.
 * 
 * Displays an animated slide-out panel from the right showing file metadata
 * (name, size, creation date, type) and action buttons (download, share, delete).
 * Uses Framer Motion for smooth entrance/exit animations.
 * 
 * @param props - Component props
 * @param props.file - The file to display (null if no file selected)
 * @param props.isOpen - Whether the sidebar is visible
 * @param props.onClose - Callback to close the sidebar
 * @param props.readOnly - If true, disables write actions (share, delete)
 * @returns Animated sidebar panel with file details
 * 
 * @example
 * ```tsx
 * const [selectedFile, setSelectedFile] = useState<File | null>(null);
 * const [sidebarOpen, setSidebarOpen] = useState(false);
 * 
 * <FileSidebar
 *   file={selectedFile}
 *   isOpen={sidebarOpen}
 *   onClose={() => setSidebarOpen(false)}
 *   readOnly={false}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Read-only mode for shared folders
 * <FileSidebar
 *   file={currentFile}
 *   isOpen={true}
 *   onClose={handleClose}
 *   readOnly={true}
 * />
 * ```
 * 
 * @remarks
 * - Only renders when `isOpen` is true and `file` is not null
 * - Shows a backdrop overlay that closes the sidebar when clicked
 * - Sidebar slides in from the right with spring animation
 * - Displays file name, size (in KB), creation date, and type
 * - Provides download, share, and delete action buttons
 * - Close button (X) in the top-right corner
 * - Fixed width of 320px (w-80)
 * - Uses AnimatePresence for smooth mount/unmount
 * 
 * @see {@link DownloadFileButton} for download functionality
 * @see {@link ShareFileButton} for sharing functionality
 * @see {@link DeleteFileButton} for deletion functionality
 */
export function FileSidebar({ file, isOpen, onClose, readOnly }: FileSidebarProps) {
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
            data-testid="file-sidebar"
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
                <DownloadFileButton file={file} readOnly={readOnly}/>
                <ShareFileButton file={file} readOnly={readOnly}/>
                <DeleteFileButton file={file} readOnly={readOnly}/>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}