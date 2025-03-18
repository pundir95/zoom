export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const meetingId: string | undefined = body.meetingId;
        
        if (!meetingId) {
            return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
        }

        const accessTokenResponse = await fetch("/api/token");
        const accessToken = await accessTokenResponse.json();
        console.log(accessToken);

        return NextResponse.json({ message: "RTMP stream started successfully" });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}