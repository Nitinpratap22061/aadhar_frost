const express = require("express");
const multer = require("multer");
const Tesseract = require("tesseract.js");

const app = express();
const PORT = 9001;

// Multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📌 Verhoeff Algorithm for Aadhar Number Validation
const verhoeffTableD = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const verhoeffTableP = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

const verhoeffTableInv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function validateAadharNumber(aadharNumber) {
    let c = 0;
    let reversedArray = aadharNumber.split("").reverse().map(Number);

    for (let i = 0; i < reversedArray.length; i++) {
        c = verhoeffTableD[c][verhoeffTableP[i % 8][reversedArray[i]]];
    }

    return c === 0;
}

// 📌 OCR Route for Aadhar Card
app.post("/extract-aadhar", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Perform OCR using Tesseract.js
        const { data: { text } } = await Tesseract.recognize(req.file.buffer, "eng");

        // Extract Aadhar Number (Assumes 12-digit number)
        const aadharNumberMatch = text.match(/\b\d{4}\s\d{4}\s\d{4}\b/);
        if (!aadharNumberMatch) {
            return res.status(400).json({ error: "Aadhar number not found in the image" });
        }

        const aadharNumber = aadharNumberMatch[0].replace(/\s/g, ""); // Remove spaces

        // Validate using Verhoeff Algorithm
        const isValid = validateAadharNumber(aadharNumber);

        res.json({
            aadharNumber,
            valid: isValid ? "Valid Aadhar Number ✅" : "Invalid or Fake Aadhar Number ❌"
        });

    } catch (error) {
        console.error("Error processing Aadhar image:", error);
        res.status(500).json({ error: "Failed to process Aadhar card" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
