import axios from "axios";

interface RequestBody {
    zoomAuthToken: string;
    meetingPayload: {
        topic: string;
        type: number;
        duration: number;
        start_time: string;
        password: string;
    };
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { zoomAuthToken }: RequestBody = await req.json(); // Get token from request body
    console.log('-----------zoomAuthToken---------', zoomAuthToken);

    if (!zoomAuthToken) {
      return new Response(
        JSON.stringify({ error: "Zoom authentication token is missing" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: "AI Interview Bot",
        type: 2, // Scheduled meeting
        start_time: "2025-02-20T15:00:00Z",
        duration: 30,
        password:"912091",
        settings: {
          join_before_host: true,
          host_video: true,
          participant_video: true,
          auto_recording: "cloud",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${zoomAuthToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return new Response(
      JSON.stringify({ join_url: response.data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Zoom API Error:", error.response?.data || error.message);
    return new Response(
      JSON.stringify({ error: "Failed to create Zoom meeting" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
