import { Form } from "@remix-run/react";
import { redirect } from "@remix-run/node";

export async function action({ request }) {
  const body = await request.formData();
  const room = body.get("roomName");
  return redirect(`/${room}`);
}

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Meet with </h1>
      <Form method="post">
        <input type="text" name="roomName" />
        <input type="submit" />
      </Form>
    </div>
  );
}
