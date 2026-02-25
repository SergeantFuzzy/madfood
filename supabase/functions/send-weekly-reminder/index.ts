import { corsHeaders } from "../_shared/cors.ts";

const encodeBasicAuth = (username: string, password: string) => {
  const credentials = `${username}:${password}`;
  return `Basic ${btoa(credentials)}`;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phoneNumber, message } = await request.json();

    if (typeof phoneNumber !== "string" || !phoneNumber.trim()) {
      return new Response(JSON.stringify({ error: "phoneNumber is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      return new Response(
        JSON.stringify({
          error: "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER for this function."
        }),
        {
          status: 501,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const twilioBody = new URLSearchParams({
      To: phoneNumber.trim(),
      From: fromNumber,
      Body: message.trim()
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: encodeBasicAuth(accountSid, authToken),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: twilioBody.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data?.message ?? "Twilio send failed", details: data }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({
        sid: data.sid,
        status: data.status,
        message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
