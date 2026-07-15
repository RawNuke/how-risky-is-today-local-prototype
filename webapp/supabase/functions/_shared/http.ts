type RefreshJob = () => Promise<void>;

function configuredSecretKeys() {
  const keys = new Set<string>();
  const legacyServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (legacyServiceRole) keys.add(legacyServiceRole);

  const rawSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!rawSecretKeys) return keys;

  try {
    const visit = (value: unknown) => {
      if (typeof value === "string" && value.startsWith("sb_secret_")) {
        keys.add(value);
      } else if (Array.isArray(value)) {
        value.forEach(visit);
      } else if (value && typeof value === "object") {
        Object.values(value).forEach(visit);
      }
    };
    visit(JSON.parse(rawSecretKeys));
  } catch {
    console.error(JSON.stringify({ status: "failed", message: "Invalid SUPABASE_SECRET_KEYS configuration" }));
  }

  return keys;
}

function authorized(request: Request) {
  const presented = request.headers.get("apikey") ?? request.headers.get("x-ingestion-key");
  return Boolean(presented && configuredSecretKeys().has(presented));
}

export function serveRefreshJob(jobName: string, refresh: RefreshJob) {
  Deno.serve(async (request: Request) => {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    if (!authorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await refresh();
      return Response.json({ job: jobName, status: "complete" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(JSON.stringify({ job: jobName, status: "failed", message }));
      return Response.json({ job: jobName, status: "failed", message }, { status: 500 });
    }
  });
}
