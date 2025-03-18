// Mark this route as dynamic
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const CLIENT_ID = '7VPbpF9S2GAPxE_rQmkQ';
const CLIENT_SECRET = 'Ls4dhwQmHABPdnsA34PdCXVhTT0mFUc0';

// Define the expected request body type
interface SignatureRequestBody {
  meetingNumber: string;
  role?: number;
}

// Handle POST request
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: SignatureRequestBody = await req.json();
    console.log(body,"opp")

    if (!body.meetingNumber) {
      return NextResponse.json({ error: "Meeting number is required" }, { status: 400 });
    }

    const { meetingNumber, role = 1 } = body;
    
    // Validate meeting number (it should be a valid number)
    if (isNaN(Number(meetingNumber)) || Number(meetingNumber) <= 0) {
      return NextResponse.json({ error: "Invalid meeting number" }, { status: 400 });
    }

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60; // Expires in 1 hour

    const payload = {
      sdkKey: CLIENT_ID,
      mn: meetingNumber,
      role,
      iat,
      exp,
      appKey: CLIENT_ID,
      tokenExp: exp,
    };

    console.log("Payload:", payload); // Add logging to verify the payload

    const signature = jwt.sign(payload, CLIENT_SECRET, { algorithm: "HS256" });

    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Signature Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200 });
}
