/**
 * Upsert DATABASE_URL + chaves Supabase no projeto convergeo-front.
 * Uso (nunca commitar o token): VERCEL_TOKEN=… npm run vercel:env
 */
const PROJECT_ID = "prj_5EKlmx8L1mHg9Q3FMZP2upfHE4Vj";
const TEAM_ID = "team_HHPQeD15f2FGrAxKsEjOzBTN";
const NAMES = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_JWKS_URL",
];

const token = (process.env.VERCEL_TOKEN || "").trim();
if (!token) {
  console.error("VERCEL_TOKEN vazio — não dá para escrever no projeto Vercel.");
  process.exit(2);
}

const targets = ["production", "preview", "development"];

async function api(path, init = {}) {
  const url = new URL(`https://api.vercel.com${path}`);
  url.searchParams.set("teamId", TEAM_ID);
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${path}: ${body?.error?.message || text.slice(0, 200)}`);
  }
  return body;
}

const existing = await api(`/v9/projects/${PROJECT_ID}/env`);
const list = Array.isArray(existing?.envs) ? existing.envs : [];

for (const name of NAMES) {
  const value = (process.env[name] || "").trim();
  if (!value) {
    console.log(`skip ${name} (local vazio)`);
    continue;
  }
  const current = list.filter((row) => row.key === name);
  for (const row of current) {
    await api(`/v9/projects/${PROJECT_ID}/env/${row.id}`, { method: "DELETE" });
  }
  await api(`/v10/projects/${PROJECT_ID}/env`, {
    method: "POST",
    body: JSON.stringify({
      key: name,
      value,
      type: "encrypted",
      target: targets,
    }),
  });
  console.log(`upsert ${name} (${targets.join(",")})`);
}

const deploy = await api(`/v13/deployments`, {
  method: "POST",
  body: JSON.stringify({
    name: "convergeo-front",
    project: PROJECT_ID,
    gitSource: {
      type: "github",
      org: "peuavelar",
      repo: "converGeo",
      ref: "cursor/banco-modelo-thiago-aa24",
    },
    target: "production",
  }),
});
console.log(`deploy ${deploy?.id || "ok"} ${deploy?.url || ""}`.trim());
