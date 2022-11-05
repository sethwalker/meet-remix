import { json } from "@remix-run/node";

export async function action({ request }) {
    request.text().then((payload) => {
        console.log(payload);
    });
    return new Response({ status: 200 });
}