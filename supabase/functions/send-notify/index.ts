import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { topic, title, body } = await req.json();
    if (!topic) return new Response(JSON.stringify({ error: "no topic" }), { status: 400, headers: corsHeaders });

    const res = await fetch("https://ntfy.sh/" + encodeURIComponent(topic), {
      method: "POST",
      headers: { "Title": title || "แจ้งเตือน", "Priority": "default", "Tags": "bell" },
      body: body || "",
    });

    return new Response(JSON.stringify({ status: res.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
