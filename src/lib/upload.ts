export async function uploadFile(
  file: File,
  folder: string
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);

  const res = await fetch("/api/lms/uploads", {
    method: "POST",
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to upload file to private storage.");
  }

  return data.storageRef || data.url;
}