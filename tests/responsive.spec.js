const { test, expect } = require("@playwright/test");

const PAGINA = { ruta: "/", nombre: "formulario-registro" };

const VISTAS = [
  { nombre: "movil-375x667", ancho: 375, alto: 667 },
  { nombre: "tablet-768x1024", ancho: 768, alto: 1024 },
  { nombre: "escritorio-1280x800", ancho: 1280, alto: 800 },
];

test(`${PAGINA.nombre}: se adapta sin desbordes horizontales`, async ({ page }) => {
  for (const vista of VISTAS) {
    await page.setViewportSize({ width: vista.ancho, height: vista.alto });
    await page.goto(PAGINA.ruta, { waitUntil: "networkidle" });
    const dimensiones = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      dimensiones.scrollWidth,
      `${PAGINA.nombre} debe adaptarse en ${vista.nombre} sin desborde (scrollWidth=${dimensiones.scrollWidth}, ancho=${dimensiones.clientWidth})`
    ).toBeLessThanOrEqual(dimensiones.clientWidth);
    await page.screenshot({
      path: `test-results/${PAGINA.nombre}-${vista.nombre}.png`,
      fullPage: true,
    });
  }
});