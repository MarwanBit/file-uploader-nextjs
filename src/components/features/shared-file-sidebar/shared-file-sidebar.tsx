/**
 * @fileoverview Sidebar for viewing shared file details.
 * 
 * This component is the read-only version of the FileSidebar, designed for
 * shared folders. It displays file metadata and only allows downloading
 * (no sharing or deletion).
 * 
 * @module components/features/shared-file-sidebar
 */
// src/components/features/file-sidebar/file-sidebar.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IconX } from "@tabler/icons-react";
import SharedDownloadFileButton from "../shared-download-file-button/shared-download-file-button";
import { type File } from "@/types/types";

/**
 * Props for the SharedFileSidebar component.
 */
interface FileSidebarProps {
  /** The file to display (null if no file selected) */
  file?: File | null;
  /** Whether the sidebar is visible */
  isOpen: boolean;
  /** Callback to close the sidebar */
  onClose: () => void;
  /** Read-only flag (always true for shared folders, kept for consistency) */
  readOnly: boolean;
  /** Share token for accessing shared folders */
  shareToken: string | null;
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
 * Animated sidebar component for shared file details.
 * 
 * Displays an animated slide-out panel from the right showing file metadata
 * (name, size, creation date, type) and a download button. This is a read-only
 * version of FileSidebar with no share or delete options.
 * 
 * @param props - Component props
 * @param props.file - The file to display (null if no file selected)
 * @param props.isOpen - Whether the sidebar is visible
 * @param props.onClose - Callback to close the sidebar
 * @param props.readOnly - Read-only flag (always true for shared folders)
 * @param props.shareToken - Share token for accessing shared folders
 * @returns Animated sidebar panel with file details and download button
 * 
 * @example
 * ```tsx
 * const [selectedFile, setSelectedFile] = useState<File | null>(null);
 * const [sidebarOpen, setSidebarOpen] = useState(false);
 * 
 * <SharedFileSidebar
 *   file={selectedFile}
 *   isOpen={sidebarOpen}
 *   onClose={() => setSidebarOpen(false)}
 *   readOnly={true}
 *   shareToken={shareToken}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // In a shared folder page
 * <SharedFileSidebar
 *   file={currentFile}
 *   isOpen={true}
 *   onClose={handleClose}
 *   readOnly={true}
 *   shareToken={shareToken}
 * />
 * ```
 * 
 * @remarks
 * - Only renders when `isOpen` is true and `file` is not null
 * - Shows a backdrop overlay that closes the sidebar when clicked
 * - Sidebar slides in from the right with spring animation
 * - Displays file name, size (in KB), creation date, and type
 * - Only provides download action (no share or delete)
 * - Close button (X) in the top-right corner
 * - Fixed width of 320px (w-80)
 * - Uses AnimatePresence for smooth mount/unmount
 * - Read-only: designed for shared folder views
 * 
 * @see {@link SharedDownloadFileButton} for download functionality
 * @see {@link FileSidebar} for the full-featured version
 */
export function SharedFileSidebar({ file, isOpen, onClose, readOnly, shareToken }: FileSidebarProps) {
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
                <SharedDownloadFileButton 
                  file={file}
                  shareToken={shareToken}
                  readOnly={readOnly}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}