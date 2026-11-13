import { NextRequest, NextResponse } from "next/server";
import { createClassOnServer, listClassesFromServer } from "@/lib/liveRoomServer";

export async function GET() {
  return NextResponse.json({
    classes: listClassesFromServer(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const subject = String(body.subject || "Mathematics").trim();
    const topic = String(body.topic || "Term 2 Interactive Revision").trim();
    const classLevel = String(body.classLevel || "SSS 2 Science").trim();
    const timeWat = String(body.timeWat || "10:00 AM – 11:00 AM WAT").trim();
    const teacher = String(body.teacher || "Mrs. Funke Adewale").trim();
    const startNow = Boolean(body.startNow);

    if (!title) {
      return NextResponse.json(
        { error: "Please provide a class title." },
        { status: 400 }
      );
    }

    const created = createClassOnServer({
      title,
      topic,
      subject,
      classLevel,
      timeWat,
      teacher,
      startNow,
    });

    return NextResponse.json({ classItem: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
