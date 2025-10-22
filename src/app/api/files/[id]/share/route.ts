import { NextResponse } from "next/server";
import { FileService } from "@/services/file-service";

// REFACTORED

export async function POST(
    request: Request, 
    { params }: { params : Promise<{ id : string }>}) {
        try {
            const { id } = await params;
            const { hours } = await request.json();
            if (!hours || hours <= 0) {
                return NextResponse.json(
                    {error: "Invalid expiration time"},
                    {status: 400},
                );
            }

            const res = await FileService.shareFile(id, hours);
            return NextResponse.json(res);

        } catch (error) {
            console.error("Error sharing file: ", error);
            throw new Error(`Failed to share file:  ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
 }
