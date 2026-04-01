import { asanaFetch } from "./client";

export async function addComment(
  taskGid: string,
  text: string
): Promise<{ gid: string }> {
  return asanaFetch<{ gid: string }>(`/tasks/${taskGid}/stories`, {
    method: "POST",
    body: JSON.stringify({ data: { text } }),
  });
}
