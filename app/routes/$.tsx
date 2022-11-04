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
    let callFrame = DailyIFrame.createFrame(
      document.getElementById("frame")
    );
    callFrame.join({ url: roomUrl })
  }, [roomUrl]);

  return (
    <div id="frame">
    </div>
  );
}
