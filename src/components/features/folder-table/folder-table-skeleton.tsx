/**
 * @fileoverview Skeleton loader for the FolderTable component.
 * 
 * Displays a loading state with skeleton rows while folder contents are being fetched.
 * 
 * @module components/features/folder-table
 */

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader component for FolderTable.
 * 
 * Displays a table structure with animated skeleton rows to indicate
 * that folder contents are loading.
 * 
 * @param props - Component props
 * @param props.rows - Number of skeleton rows to display (default: 5)
 * @returns Skeleton table matching FolderTable structure
 * 
 * @example
 * ```tsx
 * <FolderTableSkeleton rows={8} />
 * ```
 */
export default function FolderTableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <Table className="mt-10">
            <TableCaption>Loading folder contents...</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Content Type</TableHead>
                    <TableHead className="w-[100px]">Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Created At</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: rows }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell>
                            <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="text-right">
                            <Skeleton className="h-4 w-24 ml-auto" />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

