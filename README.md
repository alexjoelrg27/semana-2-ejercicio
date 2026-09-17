# Ejercicio 2 - Formulario de registro accesible

Formulario de registro con validación en JavaScript y mensajes de error accesibles.

## Sitio publicado

Disponible en GitHub Pages: `https://alexjoelrg27.github.io/semana-2-ejercicio/`

## CI/CD con GitHub Actions

El repositorio incluye un flujo (`.github/workflows/ci-cd.yml`) que, en cada push a `main`, ejecuta:

| Verificación | Herramienta | Comando |
| --- | --- | --- |
| HTML5 y HTML semántico | `html-validate` | `npm run test:html` |
| Accesibilidad WCAG 2.1 AA | `pa11y` | `npm run test:a11y` |
| Seguridad de enlaces externos (HTTPS, rel noopener, alcance) | script Node | `npm run test:links` |
| Adaptabilidad y responsividad (375, 768 y 1280 px) | Playwright | `npm run test:responsive` |

Si todas las pruebas pasan, se publica el sitio en **GitHub Pages**.

## Ejecutar las pruebas en local

```bash
npm install
npx playwright install chromium
npm run test:html
npm run test:a11y
npm run test:links
npm run test:responsive
```