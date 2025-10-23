import * as React from "react"

/**
 * @fileoverview Custom React hook for detecting mobile viewport.
 * 
 * This module provides a responsive hook that detects whether the user is
 * viewing the application on a mobile device based on viewport width.
 * It uses window.matchMedia for efficient media query matching.
 * 
 * @module hooks/use-mobile
 */

/**
 * The viewport width threshold (in pixels) for determining mobile vs desktop.
 * Screens narrower than this are considered mobile.
 * @constant {number}
 */
const MOBILE_BREAKPOINT = 768

/**
 * Custom hook to detect if the viewport is mobile-sized.
 * 
 * This hook uses the matchMedia API to efficiently detect when the viewport
 * width is below the mobile breakpoint (768px). It automatically updates when
 * the viewport is resized, making it ideal for responsive layouts.
 * 
 * @returns {boolean} True if the viewport width is less than 768px, false otherwise
 * 
 * @example
 * ```typescript
 * import { useIsMobile } from '@/hooks/use-mobile';
 * 
 * function ResponsiveNav() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <nav>
 *       {isMobile ? (
 *         <MobileMenu />
 *       ) : (
 *         <DesktopMenu />
 *       )}
 *     </nav>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Conditionally render components
 * function FileExplorer() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div>
 *       {isMobile ? (
 *         <div>
 *           <CompactFileList />
 *           <BottomSheet />
 *         </div>
 *       ) : (
 *         <div className="grid grid-cols-[250px_1fr]">
 *           <Sidebar />
 *           <FileList />
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Adjust behavior based on screen size
 * function FileUploader() {
 *   const isMobile = useIsMobile();
 *   const maxFiles = isMobile ? 5 : 20;
 *   
 *   return (
 *     <div>
 *       <input 
 *         type="file" 
 *         multiple 
 *         onChange={handleUpload}
 *       />
 *       <p>Max files: {maxFiles}</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Use with Tailwind CSS classes
 * function Card() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div className={cn(
 *       "rounded-lg p-4",
 *       isMobile ? "w-full" : "w-96"
 *     )}>
 *       <h2>Card Content</h2>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @remarks
 * - Uses window.matchMedia for efficient media query matching
 * - Automatically adds/removes event listeners for resize events
 * - Initial state is undefined, then updates to boolean after mount
 * - Returns false for undefined state (using !!isMobile)
 * - Breakpoint is set at 768px (standard tablet/mobile threshold)
 * - Listens to media query changes rather than resize events for better performance
 * - Cleans up event listeners on component unmount
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia | matchMedia API}
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
