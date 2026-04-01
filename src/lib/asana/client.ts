const ASANA_BASE = "https://app.asana.com/api/1.0";

export class AsanaError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "AsanaError";
  }
}

export async function asanaFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const pat = process.env.ASANA_PAT;
  if (!pat) {
    throw new AsanaError(0, "ASANA_PAT não configurado nas variáveis de ambiente");
  }

  const res = await fetch(`${ASANA_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AsanaError(
      res.status,
      `Asana API ${res.status} em ${path}: ${body.slice(0, 300)}`
    );
  }

  const json = await res.json();
  return json.data as T;
}
