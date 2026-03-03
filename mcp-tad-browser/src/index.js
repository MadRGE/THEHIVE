import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { chromium } from "playwright";

const server = new McpServer({
  name: "tad-browser",
  version: "1.0.0",
});

let browser = null;
let page = null;

// ─── Tool: Login TAD ───
server.tool(
  "tad_login",
  "Inicia sesión en Trámites a Distancia (TAD) con CUIT y clave fiscal.",
  {
    cuit: z.string().describe("CUIT del usuario"),
    // La clave se maneja via prompt interactivo, NO se pasa como parámetro
  },
  async ({ cuit }) => {
    browser = await chromium.launch({ headless: false }); // visible para que el user meta la clave
    page = await browser.newPage();

    await page.goto("https://tramitesadistancia.gob.ar/tramitesadistancia/detalle-tipo?id=5043");
    await page.waitForLoadState("networkidle");

    // Navigate to AFIP login
    const loginBtn = page.locator('a:has-text("Iniciar trámite"), button:has-text("Iniciar")');
    if (await loginBtn.count() > 0) {
      await loginBtn.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Fill CUIT
    const cuitInput = page.locator('input[name="cuit"], #cuit, input[placeholder*="CUIT"]');
    if (await cuitInput.count() > 0) {
      await cuitInput.fill(cuit.replace(/-/g, ""));
    }

    return {
      content: [{
        type: "text",
        text: `Browser abierto en TAD. CUIT ${cuit} ingresado. El usuario debe completar la clave fiscal manualmente y confirmar el login. Avisame cuando haya iniciado sesión.`,
      }],
    };
  }
);

// ─── Tool: Navegar a Registro de Envase ───
server.tool(
  "tad_navegar_registro_envase",
  "Navega al formulario de registro de envase/producto en contacto con alimentos en TAD.",
  {},
  async () => {
    if (!page) throw new Error("Primero ejecutá tad_login");

    // Navigate to the specific tramite
    await page.goto("https://tramitesadistancia.gob.ar/tramitesadistancia/detalle-tipo?id=5043");
    await page.waitForLoadState("networkidle");

    const screenshot = await page.screenshot({ encoding: "base64" });

    return {
      content: [
        {
          type: "text",
          text: "Navegué al formulario de registro de envase. Screenshot adjunto.",
        },
        {
          type: "image",
          data: screenshot,
          mimeType: "image/png",
        },
      ],
    };
  }
);

// ─── Tool: Completar Formulario ───
server.tool(
  "tad_completar_formulario",
  "Completa los campos del formulario de registro de envase en TAD.",
  {
    campos: z.record(z.string()).describe("Diccionario campo:valor para completar en el formulario"),
  },
  async ({ campos }) => {
    if (!page) throw new Error("Primero ejecutá tad_login");

    const resultados = [];

    for (const [campo, valor] of Object.entries(campos)) {
      try {
        // Try multiple selectors
        const selectors = [
          `input[name="${campo}"]`,
          `textarea[name="${campo}"]`,
          `select[name="${campo}"]`,
          `input[placeholder*="${campo}"]`,
          `label:has-text("${campo}") + input`,
          `label:has-text("${campo}") ~ input`,
        ];

        let filled = false;
        for (const sel of selectors) {
          const el = page.locator(sel).first();
          if (await el.count() > 0) {
            const tagName = await el.evaluate(e => e.tagName.toLowerCase());
            if (tagName === "select") {
              await el.selectOption({ label: valor });
            } else {
              await el.fill(valor);
            }
            filled = true;
            resultados.push(`OK ${campo}: "${valor}"`);
            break;
          }
        }

        if (!filled) {
          resultados.push(`WARN ${campo}: No encontré el campo`);
        }
      } catch (err) {
        resultados.push(`ERR ${campo}: Error - ${err.message}`);
      }
    }

    const screenshot = await page.screenshot({ encoding: "base64" });

    return {
      content: [
        { type: "text", text: `Resultado de completar formulario:\n${resultados.join("\n")}` },
        { type: "image", data: screenshot, mimeType: "image/png" },
      ],
    };
  }
);

// ─── Tool: Subir Documento ───
server.tool(
  "tad_subir_documento",
  "Sube un documento (PDF/DOCX) al trámite actual en TAD.",
  {
    filePath: z.string().describe("Ruta al archivo a subir"),
    tipoDocumento: z.string().describe("Tipo de documento (ej: 'Ficha Técnica', 'Certificado', 'Ensayos')"),
  },
  async ({ filePath, tipoDocumento }) => {
    if (!page) throw new Error("Primero ejecutá tad_login");

    // Find upload button/area
    const uploadInput = page.locator('input[type="file"]').first();
    if (await uploadInput.count() === 0) {
      // Try clicking "Adjuntar" or "Subir" button first
      const adjuntarBtn = page.locator('button:has-text("Adjuntar"), button:has-text("Subir"), a:has-text("Adjuntar")');
      if (await adjuntarBtn.count() > 0) {
        await adjuntarBtn.first().click();
        await page.waitForTimeout(1000);
      }
    }

    await uploadInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);

    // Try to set document type if there's a selector
    const tipoSelect = page.locator('select:near(input[type="file"])').first();
    if (await tipoSelect.count() > 0) {
      try {
        await tipoSelect.selectOption({ label: tipoDocumento });
      } catch {
        // Tipo no encontrado en el select, continuar
      }
    }

    const screenshot = await page.screenshot({ encoding: "base64" });

    return {
      content: [
        { type: "text", text: `Documento "${tipoDocumento}" subido desde: ${filePath}` },
        { type: "image", data: screenshot, mimeType: "image/png" },
      ],
    };
  }
);

// ─── Tool: Screenshot actual ───
server.tool(
  "tad_screenshot",
  "Toma un screenshot de la página actual de TAD para verificar estado.",
  {},
  async () => {
    if (!page) throw new Error("Primero ejecutá tad_login");
    const screenshot = await page.screenshot({ encoding: "base64", fullPage: true });
    return {
      content: [
        { type: "image", data: screenshot, mimeType: "image/png" },
        { type: "text", text: `URL actual: ${page.url()}` },
      ],
    };
  }
);

// ─── Tool: Cerrar browser ───
server.tool(
  "tad_cerrar",
  "Cierra el browser de TAD.",
  {},
  async () => {
    if (browser) {
      await browser.close();
      browser = null;
      page = null;
    }
    return { content: [{ type: "text", text: "Browser cerrado." }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
