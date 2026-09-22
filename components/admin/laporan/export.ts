// Utilitas ekspor laporan ke Excel (.xlsx) dan PDF.
// Library berat (write-excel-file, jspdf) diimpor dinamis agar tidak membebani
// muatan awal halaman.

export type ExportBlock = {
  title: string;
  head: string[];
  // Sel angka ditulis sebagai number (agar bisa dijumlah di Excel); selain itu string.
  rows: (string | number)[][];
};

export type ExportModel = {
  fileBase: string; // nama berkas tanpa ekstensi
  docTitle: string; // judul di dalam dokumen
  subtitle?: string;
  blocks: ExportBlock[];
};

export async function exportExcel(model: ExportModel): Promise<void> {
  const writeXlsxFile = (await import("write-excel-file/browser")).default;

  type Cell = {
    value: string | number;
    type?: typeof String | typeof Number;
    fontWeight?: "bold";
  };
  // Sel kosong diwakili null (bukan objek), sesuai tipe library.
  type Row = (Cell | null)[];

  // Semua blok ditumpuk dalam satu sheet, dipisah judul & baris kosong.
  const rows: Row[] = [];
  rows.push([{ value: model.docTitle, type: String, fontWeight: "bold" }]);
  if (model.subtitle) rows.push([{ value: model.subtitle, type: String }]);
  rows.push([null]);

  model.blocks.forEach((block, index) => {
    if (index > 0) rows.push([null]);
    rows.push([{ value: block.title, type: String, fontWeight: "bold" }]);
    rows.push(block.head.map((h) => ({ value: h, type: String, fontWeight: "bold" })));
    for (const row of block.rows) {
      rows.push(
        row.map((cell) =>
          typeof cell === "number"
            ? { value: cell, type: Number }
            : { value: cell, type: String },
        ),
      );
    }
  });

  // Versi browser mengembalikan objek dengan toFile() untuk memicu unduhan.
  await writeXlsxFile(rows).toFile(`${model.fileBase}.xlsx`);
}

export async function exportPdf(model: ExportModel): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const forest: [number, number, number] = [22, 83, 60];

  doc.setFontSize(14);
  doc.text(model.docTitle, 14, 16);
  if (model.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(model.subtitle, 14, 22);
    doc.setTextColor(0);
  }

  let y = model.subtitle ? 30 : 24;

  for (const block of model.blocks) {
    doc.setFontSize(11);
    doc.text(block.title, 14, y);
    autoTable(doc, {
      head: [block.head],
      body: block.rows.map((row) =>
        row.map((cell) => (typeof cell === "number" ? cell.toLocaleString("id-ID") : cell)),
      ),
      startY: y + 3,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: forest, textColor: 255 },
      margin: { left: 14, right: 14 },
    });
    // finalY tersedia di objek doc setelah autoTable.
    const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    y = (lastY ?? y + 20) + 10;
  }

  doc.save(`${model.fileBase}.pdf`);
}
