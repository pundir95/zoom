"use client";

import { useEffect, useState } from "react";

export default function ZoomMeeting() {
  const authEndpoint = "/api/generate-signature";
  const sdkKey = process.env.NEXT_PUBLIC_SDK_KEY;
  const role = 1;
  const userName = "React User";
  const userEmail = "";
  const leaveUrl = "http://localhost:3001";

  const [isClient, setIsClient] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [meetingNumber, setMeetingNumber] = useState<string | null>(null);
  const [passWord, setPassWord] = useState<string | null>(null);
  const [ZoomMtg, setZoomMtg] = useState<any>(null);
  const [ZoomMtgEmbedded, setZoomMtgEmbedded] = useState<any>(null);

  // Load Zoom SDK dynamically
  useEffect(() => {
    setIsClient(true);
  
    if (typeof window !== "undefined") {
      Promise.all([
        import("@zoom/meetingsdk").then((Zoom) => {
          setZoomMtg(Zoom.ZoomMtg);
          Zoom.ZoomMtg.preLoadWasm();
          Zoom.ZoomMtg.prepareWebSDK();
        }),
        import("@zoom/meetingsdk/embedded").then((Zoom) => {
          console.log(Zoom.default, "zoom");
          setZoomMtgEmbedded(() => Zoom.default); // Store function reference correctly
        }),


      ]).catch((error) => console.error("Error loading Zoom SDK:", error));
    }
  }, []);


  
  

  useEffect(() => {
    if (isClient) {
      const fetchSignature = async () => {
        const sig = await getSignature();
        if (sig) setSignature(sig);
      };

      fetchSignature();
    }
  }, [isClient]);

  // Get meeting details from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const meetingNum = params.get("meetingNumber");
    const password = params.get("password");

    if (meetingNum) setMeetingNumber(meetingNum);
    if (password) setPassWord(password);
  }, []);

  const getSignature = async (): Promise<string | null> => {
    try {
      if (!meetingNumber || !role) return null;
      const req = await fetch(authEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingNumber, role }),
      });
      const res = await req.json();
      return res.signature;
    } catch (e) {
      console.error("Error getting signature:", e);
      return null;
    }
  };

  const clearExistingMeetings = async (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const zmmtgRoot = document.getElementById("zmmtg-root");
        if (zmmtgRoot) {
          zmmtgRoot.style.display = "none";
        }
        if (ZoomMtg) ZoomMtg.leaveMeeting({});
        setTimeout(resolve, 1000);
      } catch (error) {
        console.log("No active meeting to clear");
        resolve();
      }
    });
  };

  const startRTMPStream = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/start-rtmp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start RTMP stream");
      }

      const data = await response.json();
      console.log("RTMP stream started:", data);
    } catch (error) {
      console.error("Error starting RTMP stream:", error);
    }
  };

  const startMeeting = async () => {
    if (!isClient || !signature || !meetingNumber || !passWord || !ZoomMtg) return;

    await clearExistingMeetings();

    let rootElement = document.getElementById("zmmtg-root");
    while (!rootElement) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      rootElement = document.getElementById("zmmtg-root");
    }

    rootElement.style.display = "block";

    ZoomMtg.init({
      leaveUrl: leaveUrl,
      patchJsMedia: true,
      leaveOnPageUnload: true,
      success: () => {
        ZoomMtg.join({
          signature,
          sdkKey,
          meetingNumber,
          passWord,
          userName,
          userEmail,
          success: () => {
            console.log("Joined successfully");
            botMeeting();
          },
          error: (error: any) => console.error("Join Error:", error),
        });
      },
      error: (error: any) => console.error("Init Error:", error),
    });
  };

  const botMeeting = async () => {
    if (!signature || !meetingNumber || !passWord || !ZoomMtgEmbedded) return;

    console.log("Joining bot as a host...");
    await startRTMPStream(meetingNumber);
    setTimeout(autoJoin, 5000);
  };

  useEffect(() => {
    if (isClient && signature && meetingNumber && passWord && ZoomMtg && ZoomMtgEmbedded) {
      startMeeting();
    }
  }, [isClient, signature, meetingNumber, passWord, ZoomMtg,ZoomMtgEmbedded]);

  const autoJoin = async (): Promise<void> => {
    if (!signature || !meetingNumber || !passWord || !ZoomMtgEmbedded) {
      console.error("No meeting details available");
      return;
    }


    try {
      const botMeetingElement = document.getElementById("botMeetingElement");
      if (botMeetingElement) {
        botMeetingElement.innerHTML = "";
      }

      if (!signature) {
        throw new Error("Failed to retrieve signature");
      }

      if (!botMeetingElement) {
        throw new Error("Bot meeting element not found");
      }

      const client = ZoomMtgEmbedded.createClient();

      await client.init({
        zoomAppRoot: botMeetingElement,
        language: "en-US",
        patchJsMedia: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await client.join({
        sdkKey,
        signature,
        meetingNumber,
        password: passWord,
        userName: "AI Notetaker",
      });

      await (client as any).getMediaStream().startVideo();

      console.log("Bot joined successfully!");
    } catch (error: any) {
      console.error("Error in auto join:", error);
      if (error.errorCode === 3000) {
        console.log("Retrying bot join in 5 seconds...");
        setTimeout(autoJoin, 5000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Zoom Meeting</h1>
      <div id="zmmtg-root" className="hidden"></div>
      <div
        id="botMeetingElement"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          visibility: "hidden",
          zIndex: -1,
        }}
      />
    </div>
  );
}
