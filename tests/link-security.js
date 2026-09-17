const fs = require("fs");
const path = require("path");

const TAG_RE = /<([a-z][a-z0-9-]*)\b[^>]*>/gi;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const ignorado = ["node_modules", ".git", "test-results", ".github", "playwright-report"];
    if (ignorado.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function parseAttrs(tag) {
  const attrs = {};
  const re = /([a-zA-Z-]+)\s*=\s*["']([^"']*)["']/g;
  let m;
  while ((m = re.exec(tag))) attrs[m[1].toLowerCase()] = m[2];
  return attrs;
}

function getRecursos(html) {
  const recursos = [];
  let tag;
  while ((tag = TAG_RE.exec(html))) {
    const attrs = parseAttrs(tag[0]);
    for (const attr of ["href", "src"]) {
      const url = attrs[attr];
      if (!url || !/^https?:/i.test(url)) continue;
      recursos.push({
        url,
        attr,
        targetBlank: (attrs.target || "").toLowerCase() === "_blank",
        rel: (attrs.rel || "").toLowerCase(),
        tag: tag[1].toLowerCase(),
      });
    }
  }
  return recursos;
}

async function checkReachable(url) {
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 403 || res.status === 405) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
        headers: { Range: "bytes=0-0" },
      });
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

(async () => {
  const archivos = walk(".");
  const recursos = [];
  for (const file of archivos) {
    const html = fs.readFileSync(file, "utf8");
    for (const r of getRecursos(html)) {
      recursos.push({ ...r, file: file.replace(/\\/g, "/") });
    }
  }

  if (recursos.length === 0) {
    console.log("No se encontraron enlaces o recursos externos. Seguridad superada.");
    process.exit(0);
  }

  let errores = 0;
  for (const r of recursos) {
    const problemas = [];
    if (/^http:/i.test(r.url)) {
      problemas.push("usa HTTP en lugar de HTTPS (conexion no segura)");
    }
    if (r.tag === "a" && r.targetBlank && !/noopener/.test(r.rel)) {
      problemas.push('target="_blank" requiere rel="noopener noreferrer"');
    }
    const estado = await checkReachable(r.url);
    if (!estado.ok) {
      problemas.push(`no accesible (HTTP ${estado.status}${estado.error ? " - " + estado.error : ""})`);
    }
    if (problemas.length > 0) {
      errores += problemas.length;
      console.error(`INSEGURO: ${r.url}  (en ${r.file})`);
      problemas.forEach((p) => console.error(`  - ${p}`));
    } else {
      console.log(
        `OK: ${r.url} (HTTP ${estado.status}, <${r.tag}> target=_blank=${r.targetBlank} rel="${r.rel}")`
      );
    }
  }

  if (errores > 0) {
    console.error(`\nSeguridad de enlaces externos: ${errores} problema(s).`);
    process.exit(1);
  }
  console.log("\nSeguridad de enlaces externos: sin problemas.");
})();