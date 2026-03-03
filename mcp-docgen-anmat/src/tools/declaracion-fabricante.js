import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, ImageRun
} from "docx";
import fs from "fs/promises";
import path from "path";

export async function generarDeclaracionFabricante(params) {
  const { fabricante, producto, firmaBase64, outputPath } = params;
  const fecha = new Date().toLocaleDateString("es-AR");

  const children = [
    // Título
    new Paragraph({ spacing: { before: 600 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "DECLARACIÓN DEL FABRICANTE",
          bold: true,
          size: 32,
          font: "Arial",
          color: "1B3A5C",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "MANUFACTURER'S DECLARATION / PRODUCT CERTIFICATE",
          size: 22,
          font: "Arial",
          color: "666666",
          italics: true,
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 400 } }),

    // Datos del fabricante
    new Paragraph({
      children: [
        new TextRun({ text: "Fabricante / Manufacturer: ", bold: true, size: 22, font: "Arial" }),
        new TextRun({ text: fabricante.razonSocial, size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Dirección / Address: ", bold: true, size: 22, font: "Arial" }),
        new TextRun({ text: fabricante.direccion, size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "País / Country: ", bold: true, size: 22, font: "Arial" }),
        new TextRun({ text: fabricante.pais, size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({ spacing: { after: 300 } }),

    // Datos del producto
    new Paragraph({
      children: [
        new TextRun({ text: "Producto / Product: ", bold: true, size: 22, font: "Arial" }),
        new TextRun({ text: producto.nombre, size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Material: ", bold: true, size: 22, font: "Arial" }),
        new TextRun({ text: producto.material, size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Uso previsto / Intended use: ", bold: true, size: 22, font: "Arial" }),
        new TextRun({ text: producto.usoDestino, size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({ spacing: { after: 400 } }),

    // Declaración
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: "Por medio de la presente, ",
          size: 22,
          font: "Arial",
        }),
        new TextRun({
          text: fabricante.razonSocial,
          bold: true,
          size: 22,
          font: "Arial",
        }),
        new TextRun({
          text: ` declara que el producto "${producto.nombre}" fabricado con ${producto.material}:`,
          size: 22,
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 100 } }),

    // Puntos de la declaración
    crearPunto("1. Es apto para estar en contacto con alimentos del tipo: " + producto.usoDestino),
    crearPunto("2. Cumple con las regulaciones aplicables para materiales en contacto con alimentos, incluyendo los requisitos del Código Alimentario Argentino (CAA), Capítulo IV."),
    crearPunto("3. No libera sustancias en cantidades que puedan representar un peligro para la salud humana, provocar una modificación inaceptable en la composición de los alimentos, o provocar una alteración de las características organolépticas de los mismos."),
    crearPunto("4. Los materiales utilizados en su fabricación se encuentran incluidos en las listas positivas de las regulaciones aplicables del MERCOSUR y/o Código Alimentario Argentino."),

    new Paragraph({ spacing: { after: 400 } }),

    // Fecha
    new Paragraph({
      children: [
        new TextRun({ text: `Fecha / Date: ${fecha}`, size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({ spacing: { before: 400 } }),
  ];

  // Firma
  if (firmaBase64) {
    const firmaBuffer = Buffer.from(firmaBase64, "base64");
    children.push(
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

  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "________________________", size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "Firma y Sello / Signature and Stamp", size: 18, font: "Arial", color: "666666" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: fabricante.razonSocial, size: 18, font: "Arial", color: "666666" }),
      ],
    }),
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 },
        },
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const finalPath = outputPath || path.join(process.cwd(), "declaracion_fabricante.docx");

  // Ensure output directory exists
  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.writeFile(finalPath, buffer);

  return { path: finalPath };
}

function crearPunto(texto) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: texto, size: 22, font: "Arial" }),
    ],
  });
}
