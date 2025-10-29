/**
 * @fileoverview Skeleton loader for the DirectoryBreadcrumb component.
 * 
 * Displays a loading state while breadcrumb navigation is being fetched.
 * 
 * @module components/features/directory-breadcrumb
 */

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

/**
 * Skeleton loader component for DirectoryBreadcrumb.
 * 
 * Displays skeleton breadcrumb items to indicate that the folder
 * hierarchy is being loaded.
 * 
 * @param props - Component props
 * @param props.items - Number of breadcrumb items to show (default: 3)
 * @returns Skeleton breadcrumb matching DirectoryBreadcrumb structure
 * 
 * @example
 * ```tsx
 * <DirectoryBreadcrumbSkeleton items={4} />
 * ```
 */
export default function DirectoryBreadcrumbSkeleton({ items = 3 }: { items?: number }) {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                {Array.from({ length: items }).map((_, index) => (
                    <React.Fragment key={index}>
                        <BreadcrumbItem>
                            <Skeleton className="h-4 w-24" />
                        </BreadcrumbItem>
                        {index !== items - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

