import { serve } from "https://deno.land/std@0.159.0/http/server.ts";

type Command = {
  cmd: string;
  [k: string]: unknown;
};

const DefaultHost = "wss://hack.chat/chat-ws";

function newBot(channel: string, nick: string) {
  return new Promise<WebSocket>((resolve, reject) => {
    const host = Deno.env.get("HOST") || DefaultHost;
    const ws = new WebSocket(host);
    ws.addEventListener("message", (e) => {
      const data = JSON.parse(e.data) as Command;

      if (data.cmd == "onlineSet") {
        resolve(ws);
      }
    });
    ws.addEventListener("open", () => {
      sendCmd(ws, { cmd: "join", channel, nick: nick + "_bot" });
    });
    ws.addEventListener("error", (e) => {
      reject(e);
    });
  });
}

function sendCmd(ws: WebSocket, msg: Command) {
  ws.send(JSON.stringify(msg));
}

function sendText(ws: WebSocket, text: string) {
  return sendCmd(ws, { cmd: "chat", text });
}

const wsMap = new Map<string, WebSocket>();

const HelpResponse = new Response(
  `Usage:
  POST or PUT /:channel/:nick
  Authorization: Bearer <token> # if seted

Your data`,
  {
    headers: { "content-type": "text/plain" },
  },
);

const ForbiddenResponse = new Response("Forbidden", { status: 403 });
const EmptyResponse = new Response(null, { status: 204 });

serve(async (req) => {
  if (req.method == "GET") {
    return HelpResponse;
  }

  if (req.method == "POST" || req.method == "PUT") {
    const token = Deno.env.get("TOKEN");
    if (token) {
      const rt = req.headers.get("authorization");
      if (rt && rt.split(" ")[1] != token || !rt) {
        return ForbiddenResponse;
      }
    }
    const key = new URL(req.url).pathname.slice(1);
    const params = key.split("/");
    if (params.length != 2) {
      return HelpResponse;
    }

    const text = await req.text();
    console.log(`[${new Date()}] ${key} length=${text.length}`);
    const ws = wsMap.get(key);
    if (ws) {
      sendText(ws, text);
      return EmptyResponse;
    } else {
      const w = await newBot(params[0], params[1]);
      wsMap.set(key, w);
      const tm = setInterval(() => {
        sendCmd(w, { cmd: "ping" });
      }, 10000);
      w.addEventListener("close", () => {
        wsMap.delete(key);
        clearInterval(tm);
      });

      sendText(w, text);
      return EmptyResponse;
    }
  }
  return EmptyResponse;
});
