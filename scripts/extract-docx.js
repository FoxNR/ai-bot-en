const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const docsDir = path.join(__dirname, '..', 'docs');

async function extractTextFromDocx(filePath) {
    const result = await mammoth.extractRawText({path: filePath});
    return result.value;
}

async function main() {
    try {
        const files = fs.readdirSync(docsDir).filter(file => file.toLowerCase().endsWith('.docx'));
        console.log(`Found ${files.length} DOCX files.`);

        let allText = "";
        for (const file of files) {
            console.log(`Extracting text from: ${file}`);
            const filePath = path.join(docsDir, file);
            const text = await extractTextFromDocx(filePath);
            allText += `\n--- FILE: ${file} ---\n${text}\n`;
        }

        console.log("Extraction complete.");
        console.log(allText);

    } catch (error) {
        console.error("Error during extraction:", error);
    }
}

main();
