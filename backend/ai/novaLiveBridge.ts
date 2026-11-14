import type { IncomingMessage } from "http";
import type { WebSocket } from "ws";
import { Modality, type LiveServerMessage } from "@google/genai";
import { parse } from "url";
import { ai, GEMINI_MODELS } from "./geminiClient";

export async function handleNovaLiveConnection(
  clientWs: WebSocket,
  req: IncomingMessage
) {
  if (!process.env.GEMINI_API_KEY) {
    clientWs.send(
      JSON.stringify({
        type: "error",
        error:
          "GEMINI_API_KEY is not set on the server. Live voice conversations require a configured Gemini API key.",
      })
    );
    clientWs.close();
    return;
  }

  const { query } = parse(req.url || "", true);
  const subject = typeof query.subject === "string" ? query.subject.trim() : "";
  const voiceName =
    typeof query.voice === "string" &&
    ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(query.voice)
      ? query.voice
      : "Zephyr";

  let session: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
  let closed = false;

  try {
    session = await ai.live.connect({
      model: GEMINI_MODELS.LIVE_VOICE,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: `You are Nova, a warm, encouraging real-time voice tutor for Learnova (Nigerian JSS/SSS, WAEC, NECO, and JAMB curriculum).${
          subject ? ` The student wants to practice ${subject}.` : ""
        } Keep spoken answers clear, conversational, step-by-step, and concise so students can follow aloud easily.`,
      },
      callbacks: {
        onopen: () => {
          if (!closed && clientWs.readyState === clientWs.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "ready",
                model: GEMINI_MODELS.LIVE_VOICE,
                voiceName,
              })
            );
          }
        },
        onmessage: (message: LiveServerMessage) => {
          if (closed || clientWs.readyState !== clientWs.OPEN) return;

          const content = message.serverContent;
          if (content?.inputTranscription?.text) {
            clientWs.send(
              JSON.stringify({
                type: "inputTranscript",
                text: content.inputTranscription.text,
              })
            );
          }

          if (content?.outputTranscription?.text) {
            clientWs.send(
              JSON.stringify({
                type: "outputTranscript",
                text: content.outputTranscription.text,
              })
            );
          }

          for (const part of content?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(
                JSON.stringify({
                  type: "audio",
                  audio: part.inlineData.data,
                })
              );
            }
          }

          if (content?.interrupted) {
            clientWs.send(JSON.stringify({ type: "interrupted" }));
          }

          if (content?.turnComplete) {
            clientWs.send(JSON.stringify({ type: "turnComplete" }));
          }
        },
        onerror: (err: any) => {
          if (!closed && clientWs.readyState === clientWs.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "error",
                error: err?.message || "Gemini Live connection error.",
              })
            );
          }
        },
        onclose: () => {
          if (!closed && clientWs.readyState === clientWs.OPEN) {
            clientWs.send(JSON.stringify({ type: "closed" }));
            clientWs.close();
          }
        },
      },
    });
  } catch (err: any) {
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: err?.message || "Unable to connect to Nova Live API.",
        })
      );
      clientWs.close();
    }
    return;
  }

  clientWs.on("message", (raw) => {
    if (closed || !session) return;
    try {
      const payload = JSON.parse(raw.toString());
      if (payload.audio) {
        session.sendRealtimeInput({
          audio: {
            data: String(payload.audio),
            mimeType: "audio/pcm;rate=16000",
          },
        });
      } else if (payload.text) {
        session.sendRealtimeInput({
          text: String(payload.text),
        });
      }
    } catch {
      // Ignore malformed WebSocket frames
    }
  });

  clientWs.on("close", () => {
    closed = true;
    try {
      session?.close();
    } catch {
      // ignore close errors
    }
  });
}
