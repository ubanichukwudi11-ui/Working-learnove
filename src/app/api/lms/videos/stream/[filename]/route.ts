import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const MIME_BY_EXT: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".ogv": "video/ogg",
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    const safeName = path.basename(decodeURIComponent(filename || ""));
    if (!safeName) {
      return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
    }

    const filePath = path.join(
      process.cwd(),
      ".aistudio",
      "uploads",
      "videos",
      safeName
    );
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Video file not found." }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const totalSize = stat.size;
    const ext = path.extname(safeName).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "video/mp4";
    const range = req.headers.get("range");

    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      const start = match ? Number(match[1]) : 0;
      const end =
        match && match[2] ? Math.min(Number(match[2]), totalSize - 1) : totalSize - 1;

      if (start >= totalSize || end >= totalSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${totalSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      const readable = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
        cancel() {
          stream.destroy();
        },
      });

      return new NextResponse(readable, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
        },
      });
    }

    const fullBuffer = fs.readFileSync(filePath);
    return new NextResponse(fullBuffer, {
      status: 200,
      headers: {
        "Content-Length": String(totalSize),
        "Accept-Ranges": "bytes",
        "Content-Type": contentType,
      },
    });
  } catch (err) {
    console.error("Video stream error:", err);
    return NextResponse.json({ error: "Unable to stream video." }, { status: 500 });
  }
}
