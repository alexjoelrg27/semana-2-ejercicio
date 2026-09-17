const pa11y = require("pa11y");
const { spawn } = require("child_process");
const path = require("path");

const PORT = 8080;
const TIMEOUT = 60000;
const RAIZ = ".";
const PAGES = ["/"];

function startServer() {
  const serverBin = path.join(__dirname, "..", "node_modules", "http-server", "bin", "http-server");
  return spawn(process.execPath, [serverBin, RAIZ, "-p", String(PORT), "-c-1", "-s"], {
    stdio: "ignore",
  });
}

function waitForServer(url, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(async () => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          clearInterval(timer);
          resolve();
          return;
        }
      } catch {
        /* el servidor aun no responde */
      }
      if (Date.now() - start > timeout) {
        clearInterval(timer);
        reject(new Error("No se pudo iniciar el servidor estatico a tiempo"));
      }
    }, 500);
  });
}

async function main() {
  const server = startServer();
  let fallo = false;

  try {
    await waitForServer(`http://127.0.0.1:${PORT}/`);
    for (const pagina of PAGES) {
      const url = `http://127.0.0.1:${PORT}${pagina}`;
      let resultados;
      try {
        resultados = await pa11y(url, {
          standard: "WCAG2AA",
          level: "error",
          timeout: TIMEOUT,
          chromeLaunchConfig: {
            args: ["--no-sandbox", "--disable-dev-shm-usage"],
          },
        });
      } catch (err) {
        console.error(`\nError al ejecutar pa11y en ${pagina}:`);
        console.error(err.stack || err.message || err);
        process.exit(1);
      }
      const problemas = resultados.issues.filter((i) => i.type === "error");
      console.log(`\n== ${pagina} == (${problemas.length} errores WCAG 2.1 AA)`);
      for (const p of problemas) {
        console.log(`  - [${p.code}] ${p.message}`);
        if (p.selector) console.log(`    selector: ${p.selector}`);
      }
      if (problemas.length > 0) fallo = true;
    }
  } finally {
    server.kill();
  }

  if (fallo) {
    console.error("\nAccesibilidad WCAG AA: se encontraron errores.");
    process.exit(1);
  }
  console.log("\nAccesibilidad WCAG AA: sin errores.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});