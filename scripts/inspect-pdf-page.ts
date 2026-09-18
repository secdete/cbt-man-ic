import fs from "fs";
import path from "path";

async function inspectPDFPage() {
  const pdfModule = require("pdf-parse");
  const buffer = fs.readFileSync(
    path.join(process.cwd(), "modul", "Modul MAN IC.pdf"),
  );

  // Kita cari teks di halaman 53 (0-indexed: page 52 atau 53)
  let pageNum = 0;
  const options = {
    pagerender: function (pageData: any) {
      pageNum++;
      if (pageNum >= 52 && pageNum <= 56) {
        return pageData.getTextContent().then(function (textContent: any) {
          let lastY,
            text = `--- HALAMAN ${pageNum} ---\n`;
          for (let item of textContent.items) {
            text += item.str + " ";
          }
          return text + "\n";
        });
      }
      return "";
    },
  };

  const data = await pdfModule(buffer, options);
  console.log(data.text);
}

inspectPDFPage().catch(console.error);
