import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generarFichaTecnica } from "./tools/ficha-tecnica.js";
import { generarDeclaracionFabricante } from "./tools/declaracion-fabricante.js";

const server = new McpServer({
  name: "docgen-anmat",
  version: "1.0.0",
});

// ─── Tool: Generar Ficha Técnica Preliminar (JSON) ───
server.tool(
  "generar_ficha_preliminar",
  "Analiza datos del producto y genera una ficha técnica preliminar para revisión del usuario. NO genera documento final.",
  {
    fabricante: z.object({
      razonSocial: z.string().describe("Razón social del fabricante"),
      direccion: z.string().describe("Dirección completa"),
      pais: z.string().describe("País de origen"),
      contacto: z.string().optional().describe("Email o teléfono"),
    }),
    producto: z.object({
      nombre: z.string().describe("Nombre comercial del envase"),
      marca: z.string().describe("Marca"),
      modelo: z.string().describe("Modelo o referencia"),
      material: z.string().describe("Material principal (PE, PP, PET, vidrio, etc.)"),
      materialDetalle: z.string().optional().describe("Composición detallada del material"),
      usoDestino: z.string().describe("Tipo de alimento destino"),
      descripcion: z.string().describe("Descripción técnica del envase"),
      colores: z.array(z.string()).optional().describe("Colores disponibles"),
      capacidad: z.string().optional().describe("Capacidad/volumen"),
      dimensiones: z.string().optional().describe("Dimensiones"),
    }),
    cliente: z.object({
      razonSocial: z.string().describe("Importador en Argentina"),
      cuit: z.string().describe("CUIT del importador"),
    }),
    riesgo: z.enum(["1", "2", "3"]).default("2").describe("Nivel de riesgo del envase"),
  },
  async (params) => {
    // Genera estructura de ficha para revisión
    const ficha = {
      encabezado: {
        titulo: "FICHA TÉCNICA DE ENVASE",
        subtitulo: `Riesgo ${params.riesgo} - Código Alimentario Argentino`,
        fecha: new Date().toLocaleDateString("es-AR"),
      },
      seccion1_fabricante: {
        titulo: "1. DATOS DEL FABRICANTE/EXPORTADOR",
        ...params.fabricante,
      },
      seccion2_importador: {
        titulo: "2. DATOS DEL IMPORTADOR",
        ...params.cliente,
      },
      seccion3_producto: {
        titulo: "3. DESCRIPCIÓN DEL PRODUCTO",
        ...params.producto,
        clasificacionCAA: clasificarMaterialCAA(params.producto.material),
      },
      seccion4_composicion: {
        titulo: "4. COMPOSICIÓN DEL MATERIAL",
        materialBase: params.producto.material,
        detalle: params.producto.materialDetalle || "Pendiente de completar",
        aditivosDeclarados: "Pendiente de completar",
        cumpleCAA: true,
        normativaAplicable: getNormativaAplicable(params.producto.material),
      },
      seccion5_ensayos: {
        titulo: "5. ENSAYOS Y CERTIFICACIONES",
        migracionGlobal: "Pendiente - requiere informe de laboratorio",
        migracionEspecifica: "Pendiente - requiere informe de laboratorio",
        aptitudAlimentaria: "Pendiente de certificado",
      },
      seccion6_declaracion: {
        titulo: "6. DECLARACIÓN DE CONFORMIDAD",
        texto: `El fabricante ${params.fabricante.razonSocial} declara que el producto "${params.producto.nombre}" cumple con los requisitos establecidos en el Código Alimentario Argentino, Capítulo IV, para materiales en contacto con alimentos.`,
      },
      estado: "BORRADOR - PENDIENTE DE REVISIÓN",
      instrucciones: "Revisá cada sección. Completá los campos marcados como 'Pendiente'. Cuando esté todo OK, confirmá para generar el documento final.",
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(ficha, null, 2),
        },
      ],
    };
  }
);

// ─── Tool: Generar Documento Final (DOCX) ───
server.tool(
  "generar_documento_final",
  "Genera el documento Word final de la Ficha Técnica de Envase, listo para subir a ANMAT/TAD. Solo llamar después de que el usuario confirmó la ficha preliminar.",
  {
    fichaConfirmada: z.string().describe("JSON de la ficha técnica confirmada por el usuario"),
    plantilla: z.enum(["riesgo_2_anmat", "declaracion_fabricante", "silo"]).default("riesgo_2_anmat"),
    firmaBase64: z.string().optional().describe("Imagen de firma en base64"),
    logoBase64: z.string().optional().describe("Logo del fabricante en base64"),
    outputPath: z.string().describe("Ruta donde guardar el documento generado"),
  },
  async (params) => {
    const ficha = JSON.parse(params.fichaConfirmada);
    const result = await generarFichaTecnica(ficha, {
      plantilla: params.plantilla,
      firma: params.firmaBase64,
      logo: params.logoBase64,
      outputPath: params.outputPath,
    });
    return {
      content: [
        {
          type: "text",
          text: `Documento generado exitosamente en: ${result.path}\nFormato: DOCX\nPáginas estimadas: ${result.pages}\nListo para subir a TAD.`,
        },
      ],
    };
  }
);

// ─── Tool: Generar Declaración del Fabricante ───
server.tool(
  "generar_declaracion_fabricante",
  "Genera el documento de Declaración del Fabricante / Product Certificate para adjuntar al trámite.",
  {
    fabricante: z.object({
      razonSocial: z.string(),
      direccion: z.string(),
      pais: z.string(),
    }),
    producto: z.object({
      nombre: z.string(),
      material: z.string(),
      usoDestino: z.string(),
    }),
    firmaBase64: z.string().optional(),
    outputPath: z.string(),
  },
  async (params) => {
    const result = await generarDeclaracionFabricante(params);
    return {
      content: [
        {
          type: "text",
          text: `Declaración del Fabricante generada en: ${result.path}`,
        },
      ],
    };
  }
);

// ─── Helpers ───
function clasificarMaterialCAA(material) {
  const mat = material.toUpperCase();
  const clasificaciones = {
    PE: "Polietileno - CAA Art. 184-202",
    PP: "Polipropileno - CAA Art. 184-202",
    PET: "Polietilentereftalato - CAA Art. 184-202",
    PS: "Poliestireno - CAA Art. 184-202",
    PVC: "Policloruro de vinilo - CAA Art. 184-202",
    VIDRIO: "Vidrio - CAA Art. 183",
    ALUMINIO: "Aluminio - CAA Art. 182",
    HOJALATA: "Hojalata - CAA Art. 180-181",
    PAPEL: "Papel/Cartón - CAA Art. 203-205",
    CERAMICA: "Cerámica - CAA Art. 183",
  };
  for (const [key, value] of Object.entries(clasificaciones)) {
    if (mat.includes(key)) return value;
  }
  return `Material: ${material} - Verificar clasificación CAA`;
}

function getNormativaAplicable(material) {
  const normas = [
    "Código Alimentario Argentino - Capítulo IV",
    "Resolución GMC N° 03/92 (MERCOSUR)",
  ];
  const mat = material.toUpperCase();
  if (["PE", "PP", "PET", "PS", "PVC"].some((p) => mat.includes(p))) {
    normas.push("Resolución GMC N° 02/12 - Lista positiva de polímeros");
    normas.push("Resolución GMC N° 32/07 - Migración total y específica");
  }
  if (mat.includes("VIDRIO") || mat.includes("CERAMICA")) {
    normas.push("Resolución GMC N° 01/05 - Materiales cerámicos y vítreos");
  }
  return normas;
}

// ─── Start Server ───
const transport = new StdioServerTransport();
await server.connect(transport);
