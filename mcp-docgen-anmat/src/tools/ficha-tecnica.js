import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, AlignmentType, BorderStyle, WidthType,
  ShadingType, ImageRun
} from "docx";
import fs from "fs/promises";
import path from "path";

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const margins = { top: 80, bottom: 80, left: 120, right: 120 };

export async function generarFichaTecnica(ficha, options = {}) {
  const sections = [];

  // ─── Header con datos del fabricante ───
  const headerParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: ficha.seccion1_fabricante.razonSocial, bold: true, size: 28, font: "Arial" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: ficha.seccion1_fabricante.direccion, size: 18, font: "Arial" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: ficha.seccion1_fabricante.pais, size: 18, font: "Arial" }),
      ],
    }),
  ];

  // ─── Título principal ───
  sections.push(
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "FICHA TÉCNICA DE ENVASE",
          bold: true, size: 32, font: "Arial",
          color: "1B3A5C",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: ficha.encabezado.subtitulo,
          size: 22, font: "Arial", color: "666666",
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 300 } }),
  );

  // ─── Sección 1: Fabricante ───
  sections.push(crearSeccionTitulo("1. DATOS DEL FABRICANTE / EXPORTADOR"));
  sections.push(crearTablaKeyValue([
    ["Razón Social", ficha.seccion1_fabricante.razonSocial],
    ["Dirección", ficha.seccion1_fabricante.direccion],
    ["País", ficha.seccion1_fabricante.pais],
    ["Contacto", ficha.seccion1_fabricante.contacto || "N/A"],
  ]));

  // ─── Sección 2: Importador ───
  sections.push(crearSeccionTitulo("2. DATOS DEL IMPORTADOR"));
  sections.push(crearTablaKeyValue([
    ["Razón Social", ficha.seccion2_importador.razonSocial],
    ["CUIT", ficha.seccion2_importador.cuit],
  ]));

  // ─── Sección 3: Producto ───
  sections.push(crearSeccionTitulo("3. DESCRIPCIÓN DEL PRODUCTO"));
  sections.push(crearTablaKeyValue([
    ["Nombre", ficha.seccion3_producto.nombre],
    ["Marca", ficha.seccion3_producto.marca],
    ["Modelo", ficha.seccion3_producto.modelo],
    ["Material", ficha.seccion3_producto.material],
    ["Uso destino", ficha.seccion3_producto.usoDestino],
    ["Clasificación CAA", ficha.seccion3_producto.clasificacionCAA],
    ["Descripción", ficha.seccion3_producto.descripcion],
    ["Colores", (ficha.seccion3_producto.colores || []).join(", ") || "N/A"],
    ["Capacidad", ficha.seccion3_producto.capacidad || "N/A"],
    ["Dimensiones", ficha.seccion3_producto.dimensiones || "N/A"],
  ]));

  // ─── Sección 4: Composición ───
  sections.push(crearSeccionTitulo("4. COMPOSICIÓN DEL MATERIAL"));
  sections.push(crearTablaKeyValue([
    ["Material base", ficha.seccion4_composicion.materialBase],
    ["Detalle composición", ficha.seccion4_composicion.detalle],
    ["Aditivos declarados", ficha.seccion4_composicion.aditivosDeclarados],
    ["Normativa aplicable", ficha.seccion4_composicion.normativaAplicable.join("\n")],
  ]));

  // ─── Sección 5: Ensayos ───
  sections.push(crearSeccionTitulo("5. ENSAYOS Y CERTIFICACIONES"));
  sections.push(crearTablaKeyValue([
    ["Migración global", ficha.seccion5_ensayos.migracionGlobal],
    ["Migración específica", ficha.seccion5_ensayos.migracionEspecifica],
    ["Aptitud alimentaria", ficha.seccion5_ensayos.aptitudAlimentaria],
  ]));

  // ─── Sección 6: Declaración ───
  sections.push(crearSeccionTitulo("6. DECLARACIÓN DE CONFORMIDAD"));
  sections.push(
    new Paragraph({
      spacing: { before: 100, after: 200 },
      children: [
        new TextRun({ text: ficha.seccion6_declaracion.texto, size: 22, font: "Arial" }),
      ],
    })
  );

  // ─── Firma ───
  sections.push(new Paragraph({ spacing: { before: 600 } }));

  if (options.firma) {
    const firmaBuffer = Buffer.from(options.firma, "base64");
    sections.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({
            data: firmaBuffer,
            transformation: { width: 200, height: 80 },
            type: "png",
          }),
        ],
      })
    );
  }

  sections.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "________________________", size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "Firma y Sello del Fabricante", size: 18, font: "Arial", color: "666666" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `Fecha: ${ficha.encabezado.fecha}`, size: 18, font: "Arial", color: "666666" }),
      ],
    }),
  );

  // ─── Build Document ───
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 },
        },
      },
      headers: {
        default: new Header({ children: headerParagraphs }),
      },
      children: sections,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = options.outputPath || path.join(process.cwd(), "ficha_tecnica.docx");

  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);

  return { path: outputPath, pages: Math.ceil(sections.length / 15) };
}

// ─── Helpers ───
function crearSeccionTitulo(texto) {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    shading: { fill: "1B3A5C", type: ShadingType.CLEAR },
    children: [
      new TextRun({ text: `  ${texto}`, bold: true, size: 22, font: "Arial", color: "FFFFFF" }),
    ],
  });
}

function crearTablaKeyValue(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([key, value], i) =>
      new TableRow({
        children: [
          new TableCell({
            borders,
            margins,
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: "F0F4F8", type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [new TextRun({ text: key, bold: true, size: 20, font: "Arial" })],
              }),
            ],
          }),
          new TableCell({
            borders,
            margins,
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: i % 2 === 0 ? { fill: "FFFFFF", type: ShadingType.CLEAR } : { fill: "FAFBFC", type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [new TextRun({ text: value || "N/A", size: 20, font: "Arial" })],
              }),
            ],
          }),
        ],
      })
    ),
  });
}
