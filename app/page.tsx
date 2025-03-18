"use client";

import { useEffect, useState } from "react";
import { ZoomMtg } from "@zoom/meetingsdk";
import ZoomMtgEmbedded from "@zoom/meetingsdk/embedded";

ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();

export default function ZoomMeeting() {
  const authEndpoint = "/api/generate-signature"; 
  const sdkKey = process.env.NEXT_PUBLIC_SDK_KEY;
  const role = 1;
  const userName = "React User";
  const userEmail = "";
  const leaveUrl = "http://localhost:3001"; 

  const [isClient, setIsClient] = useState<boolean>(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [meetingNumber, setMeetingNumber] = useState<string | null>(null);
  const [passWord, setPassWord] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      ZoomMtg.leaveMeeting({});
    };
  }, []);

  useEffect(() => {
    const fetchSignature = async () => {
      const sig = await getSignature();
      if (sig) setSignature(sig);
    };

    if (isClient) {
      fetchSignature();
    }
  }, [isClient]);

  const clearExistingMeetings = async (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const zmmtgRoot = document.getElementById("zmmtg-root");
        if (zmmtgRoot) {
          zmmtgRoot.style.display = "none";
        }
        ZoomMtg.leaveMeeting({});
        // Give some time for the meeting to clear
        setTimeout(resolve, 1000);
      } catch (error) {
        console.log("No active meeting to clear");
        resolve();
      }
    });
  };

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

  const startRTMPStream = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/start-rtmp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meetingId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start RTMP stream");
      }

      const data = await response.json();
      console.log("RTMP stream started:", data);
      // setIsStreaming(true);
    } catch (error) {
      console.error("Error starting RTMP stream:", error);
    }
  };

  const startMeeting = async () => {
    if (!isClient || !signature || !meetingNumber || !passWord) return;
    
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
            botMeeting(); // Call the bot function after joining
          },
          error: (error) => console.error("Join Error:", error),
        });
      },
      error: (error) => console.error("Init Error:", error),
    });
  };

  const botMeeting = async () => {
    let withBot = true;
    if (!signature || !meetingNumber || !passWord) return;

    console.log("Joining bot as a host...");
    // await startRTMPStream(meetingNumber);
    if (withBot) {
      setTimeout(autoJoin, 5000);
    }

  
  };

  useEffect(() => {
    if (isClient && signature && meetingNumber && passWord) {
      startMeeting();
    }
  }, [isClient, signature, meetingNumber, passWord]);

  const autoJoin = async (): Promise<void> => {
    if (!signature || !meetingNumber || !passWord) {
      console.error("No meeting details available");
      return;
    }

    try {
      // Use a separate element for the bot
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
        userName: "AI Notetaker"
      });

      // Enable video after joining
      await (client as any).getMediaStream().startVideo();

      console.log("Bot1 joined successfully!");
    } catch (error: any) {
      console.error("Error in auto join:", error);
      if (error.errorCode === 3000) {
        console.log("Attempting to retry bot join in 5 seconds...");
        setTimeout(autoJoin, 5000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Zoom Meeting ... </h1>
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
