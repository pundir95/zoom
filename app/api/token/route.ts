import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(): Promise<NextResponse> {
    const ZOOM_ACCOUNT_ID = "UO0CA2Y6RlOXnYUf5TdmyQ" as string;
    const ZOOM_CLIENT_ID = "Vbipl4XoRVOmuJILjkMR0Q" as string;
    const ZOOM_CLIENT_SECRET ="OsM2GBSm0QAm07LsERkd4XMmJzbCykeU" as string;

    try {
        // Request OAuth token from Zoom
        const authResponse = await axios.post(
            `https://zoom.us/oauth/token`,
            new URLSearchParams({
                grant_type: "account_credentials",
                account_id: ZOOM_ACCOUNT_ID,
            }).toString(),
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64")}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const accessToken = authResponse.data.access_token;

        return NextResponse.json({ access_token: accessToken });
    } catch (error: any) {
        return NextResponse.json({ error: error.response?.data || error.message }, { status: 500 });
    }
}
