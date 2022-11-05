import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import DailyIFrame from "@daily-co/daily-js";

export const loader: LoaderFunction = async ({ params }) => {
  let roomName = "meet-" + params["*"];
  let token = process.env.DAILY_TOKEN;
  let apiUrl = "https://api.daily.co/v1/rooms/";

  let res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: `{"name": "${roomName}"}`
  });

  let data = await res.json();
  console.log(data)

  if (data["error"] && data["info"].endsWith("already exists")) {
    let res = await fetch(`${apiUrl}${roomName}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    data = await res.json()
  }

  if (data["error"]) {
    throw new Error(data["info"]);
  }

  return json( data );
}

export default function Room() {

  const roomSettings = useLoaderData();
  const roomUrl = roomSettings["url"];

  useEffect(() => {
    const DAILY_IFRAME = document.getElementById("frame")
    let callFrame = DailyIFrame.wrap(DAILY_IFRAME);
    callFrame.join({ url: roomUrl }).then((participants) => {
      callFrame.getMeetingSession().then((meetingSession) => {
        setInterval(() => {
          callFrame.getNetworkStats().then((stats) => {
            let payload = {
              room: roomUrl,
              meetingSessionId: meetingSession.meetingSession.id,
              sessionId: participants.local.session_id,
              stats: stats.stats
            }
            if(payload.stats.latest.recvBitsPerSecond > 0) {
              navigator.sendBeacon("/beacon", JSON.stringify(payload));
            }
          })
        }, 1500);
      });
    });
  }, [roomUrl]);

  return (
    <iframe id="frame" allow="microphone; camera; autoplay; display-capture" style={{width: "99.6vw", height: "92vh"}}>
    </iframe>
  );
}
