import type { IncomingMessage } from "http";
import type { WebSocket } from "ws";
import { Modality, type LiveServerMessage } from "@google/genai";
import { parse } from "url";
import { ai, GEMINI_MODELS } from "./geminiClient";
import {
  authenticateAccessToken,
  getSessionUserById,
  type AuthenticatedSessionUser,
} from "../services/authCore";
import { verifyLiveVoiceTicket } from "../services/wsTicket";
import {
  enforceAndConsumeNovaQuota,
  recordLiveVoiceSeconds,
} from "../services/rateLimitService";

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      result[key] = decodeURIComponent(val);
    } catch {
      result[key] = val;
    }
  }
  return result;
}

async function authenticateLiveWs(
  req: IncomingMessage,
  ticketParam?: string
): Promise<AuthenticatedSessionUser | null> {
  if (ticketParam) {
    const verified = verifyLiveVoiceTicket(ticketParam);
    if (verified?.userId) {
      const user = await getSessionUserById(verified.userId);
      if (user) return user;
    }
  }

  const cookies = parseCookieHeader(req.headers.cookie);
  const accessToken = cookies["learnova_access_token"];
  if (accessToken) {
    return authenticateAccessToken(accessToken);
  }
  return null;
}

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
    clientWs.close(1011, "Missing Gemini API key");
    return;
  }

  const { query } = parse(req.url || "", true);
  const ticketParam = typeof query.ticket === "string" ? query.ticket.trim() : "";

  const user = await authenticateLiveWs(req, ticketParam);
  if (!user) {
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: "Authentication required. Please sign in to use Nova Live Voice Tutor.",
        })
      );
    }
    clientWs.close(4401, "Authentication required");
    return;
  }

  if (user.status === "SUSPENDED") {
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: "Your account is currently suspended.",
        })
      );
    }
    clientWs.close(4403, "Account suspended");
    return;
  }

  const quota = await enforceAndConsumeNovaQuota(user, "live_voice");
  if (!quota.allowed) {
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: quota.reason || "Daily live voice quota exceeded.",
        })
      );
    }
    clientWs.close(4429, "Quota exceeded");
    return;
  }

  const remainingVoiceSeconds = Math.max(
    30,
    quota.voiceMinutesLimit * 60 - quota.voiceSecondsUsed
  );

  const subject =
    typeof query.subject === "string" ? query.subject.trim().slice(0, 120) : "";
  const voiceName =
    typeof query.voice === "string" &&
    ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(query.voice)
      ? query.voice
      : "Zephyr";

  let session: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
  let closed = false;
  const startedAtMs = Date.now();
  let capTimer: ReturnType<typeof setTimeout> | null = null;
  let recorded = false;

  const finalizeUsage = () => {
    if (capTimer) {
      clearTimeout(capTimer);
      capTimer = null;
    }
    if (!recorded) {
      recorded = true;
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAtMs) / 1000));
      recordLiveVoiceSeconds(user.id, elapsedSeconds).catch(() => {});
    }
  };

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
                remainingVoiceSeconds,
              })
            );

            capTimer = setTimeout(() => {
              if (!closed && clientWs.readyState === clientWs.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: "error",
                    error: "Your daily Nova Live Voice time allowance has been reached.",
                  })
                );
                clientWs.close(4429, "Voice duration limit reached");
              }
            }, remainingVoiceSeconds * 1000);
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
        onerror: (err: unknown) => {
          const msg = (err as { message?: string })?.message;
          if (!closed && clientWs.readyState === clientWs.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "error",
                error: msg || "Gemini Live connection error.",
              })
            );
          }
        },
        onclose: () => {
          finalizeUsage();
          if (!closed && clientWs.readyState === clientWs.OPEN) {
            clientWs.send(JSON.stringify({ type: "closed" }));
            clientWs.close();
          }
        },
      },
    });
  } catch (err: unknown) {
    finalizeUsage();
    const msg = (err as { message?: string })?.message;
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: msg || "Unable to connect to Nova Live API.",
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
      if (payload.audio && typeof payload.audio === "string" && payload.audio.length < 256_000) {
        session.sendRealtimeInput({
          audio: {
            data: payload.audio,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      } else if (payload.text && typeof payload.text === "string" && payload.text.length <= 2000) {
        session.sendRealtimeInput({
          text: payload.text,
        });
      }
    } catch {
      // Ignore malformed WebSocket frames
    }
  });

  clientWs.on("close", () => {
    closed = true;
    finalizeUsage();
    try {
      session?.close();
    } catch {
      // ignore close errors
    }
  });
}
