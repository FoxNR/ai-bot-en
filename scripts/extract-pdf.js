const fs = require('fs');
const path = require('path');

// Polyfills for pdf-parse in Node.js
if (typeof global.DOMMatrix === 'undefined') {
    global.DOMMatrix = class DOMMatrix {
        constructor() {}
    };
}

let pdfModule = require('pdf-parse');
let PDFParse = pdfModule.PDFParse;

if (!PDFParse && pdfModule.default && pdfModule.default.PDFParse) {
    PDFParse = pdfModule.default.PDFParse;
}

const docsDir = path.join(__dirname, '..', 'docs');
const outputDir = path.join(__dirname, '..', 'data');

async function extractTextFromPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    try {
        const parser = new PDFParse({});
        console.log('Parser instance keys:', Object.keys(parser));
        console.log('Parser prototype keys:', Object.keys(Object.getPrototypeOf(parser)));
        
        // Try common method names
        if (typeof parser.parse === 'function') {
            const data = await parser.parse(dataBuffer);
            return data.text;
        }
        
        // If it's a legacy version wrapped in a class
        if (typeof parser.load === 'function') {
            const data = await parser.load(dataBuffer);
            return data.text;
        }

        return "Could not find parse method";
    } catch (e) {
        console.error("Error in extractTextFromPdf:", e);
        throw e;
    }
}

async function main() {
    try {
        const files = fs.readdirSync(docsDir).filter(file => file.toLowerCase().endsWith('.pdf'));
        console.log(`Found ${files.length} PDF files.`);

        let allText = "";
        for (const file of files) {
            console.log(`Extracting text from: ${file}`);
            const filePath = path.join(docsDir, file);
            const text = await extractTextFromPdf(filePath);
            allText += `\n--- FILE: ${file} ---\n${text}\n`;
        }

        console.log("Extraction complete.");
        console.log(allText);

    } catch (error) {
        console.error("Error during extraction:", error);
    }
}

main();
