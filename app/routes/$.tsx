import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import DailyIFrame from "@daily-co/daily-js";

/*
This loader function is called when rendering the page server
side or when the component is rendered client side

Running the loader function on the server allows us to keep
the Daily API key from being exposed through the frontend
*/
export const loader: LoaderFunction = async ({ params }) => {
  const roomName = "meet-" + params["*"];
  const token = process.env.DAILY_TOKEN;
  const apiUrl = "https://api.daily.co/v1/rooms/";
  const beaconUrl = process.env.BEACON_URL;

  // Try to create a daily room
  let res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: `{"name": "${roomName}"}`
  });

  let data = await res.json();
  console.log(data)

  // If the room already exists, get its authoritative url
  if (data["error"] && data["info"].endsWith("already exists")) {
    let res = await fetch(`${apiUrl}${roomName}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    data = await res.json()
  }

  // If the API returned an error message, bubble it up to the UI
  if (data["error"]) {
    throw new Error(data["info"]);
  }

  // Setting this in the loader function because only server side has
  // access to ENV variables
  data["beaconUrl"] = beaconUrl;

  return json( data );
}

export default function Room() {

  const roomSettings = useLoaderData();
  const roomUrl = roomSettings["url"];
  const beaconUrl = roomSettings["beaconUrl"];

  // Initializing the iframe requires a mutation / side-effect
  useEffect(() => {
    const DAILY_IFRAME = document.getElementById("frame")
    let callFrame = DailyIFrame.wrap(DAILY_IFRAME);

    // join returns a promise that contains information about the current participant
    callFrame.join({ url: roomUrl }).then((participants) => {
      
      // To disambiguate this call from other calls in the same room, grab the
      // meeting session id
      callFrame.getMeetingSession().then((meetingSession) => {

        // Start a timer to collect stats every 15 seconds
        setInterval(() => {
          callFrame.getNetworkStats().then((stats) => {
            let payload = {
              room: roomUrl,
              meetingSessionId: meetingSession.meetingSession.id,
              sessionId: participants.local.session_id,
              stats: stats.stats
            }

            // Probably could initialize this function on
            // slightly different events so that this is never 0,
            // but for now, just filter out empty data
            if(payload.stats.latest.recvBitsPerSecond > 0) {
              navigator.sendBeacon(beaconUrl, JSON.stringify(payload));
            }
          })
        }, 15000);
      });
    });
  }, [roomUrl]);

  return (
    <iframe id="frame" allow="microphone; camera; autoplay; display-capture" style={{width: "99.6vw", height: "92vh"}}>
    </iframe>
  );
}