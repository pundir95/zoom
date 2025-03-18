"use client";
import React, { useEffect, useState } from "react";

const CreateMeeting: React.FC = () => {
  
  const [isLoading, setIsLoading] = useState(false);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAccessToken=()=>{
    fetch("/api/token")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      localStorage.setItem("zoomAuthToken",data.access_token)
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  }

  useEffect(()=>{
    getAccessToken()
  },[])

  const handleCreateMeeting = async () => {
    
    setIsLoading(true);
    setError(null);
    try {
      let zoomAuthToken=localStorage.getItem("zoomAuthToken")
      // Replace this URL with your API endpoint
      const response = await fetch("/api/create-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zoomAuthToken: zoomAuthToken, // replace with the actual Zoom auth token
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create meeting");
      }

      const data = await response.json();
      
      if (data.join_url) {
        setJoinUrl(data.join_url);
      }
    } catch (err) {
      setError("Failed to create Zoom meeting.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Create Zoom Meeting</h2>
      <button onClick={handleCreateMeeting} disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Meeting"}
      </button>

      {joinUrl && (
        <div>
          <p>Meeting created successfully!</p>
          <p>Join URL: <a href={joinUrl} target="_blank" rel="noopener noreferrer">Join Now</a></p>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default CreateMeeting;
