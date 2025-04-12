import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import axios from "axios";

// Import libraries for text extraction from the legacy build of pdf.js
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import mammoth from "mammoth";

// Set the PDF.js worker source to a local copy served from your public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/pdf.worker.min.mjs`;

// Google API constants
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

const UploadModal = ({
  setSummary,
  setOriginalText,
  setDocumentFile,
  theme,
}) => {
  // Local state variables
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [title, setTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Dropzone for file selection
  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setDocumentFile(acceptedFiles[0]);
    setTitle(acceptedFiles[0].name);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB max file size
  });

  // Extract text from PDF using pdfjs-dist (emulating pdf-parse in the backend)
  const extractTextFromPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let extractedText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      extractedText += pageText + "\n";
    }
    return extractedText;
  };

  // Extract text from DOCX using mammoth (same as backend)
  const extractTextFromDocx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  // Handle file upload: extract text using the same technique as backend, then send to backend
  const handleUpload = async () => {
    if (!file || !title) {
      setErrorMessage("Please select a file to upload and provide a title.");
      setOpenSnackbar(true);
      return;
    }

    try {
      setLoading(true);
      setProgressMessage("Extracting text...");
      let extractedText = "";

      if (file.type === "application/pdf") {
        extractedText = await extractTextFromPdf(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        extractedText = await extractTextFromDocx(file);
      } else {
        setErrorMessage("Unsupported file format");
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }

      setProgressMessage("Summarizing your document...");
      // Prepare payload with title and extracted text
      const payload = {
        title: title,
        text: extractedText,
      };

      const userId = localStorage.getItem("userId");
      if (userId) {
        payload.userId = userId;
      }

      // Send the extracted text to the backend endpoint
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/upload",
        payload,
      );
      setLoading(false);
      setProgressMessage("");
      const { summary, originalText } = response.data;
      setSummary(summary);
      setOriginalText(originalText);
      localStorage.setItem("originalText", originalText);
      setIsUploaded(true);
      setOpen(false);
    } catch (error) {
      setLoading(false);
      setProgressMessage("");
      console.error("Upload failed:", error);
      const errMsg = error.response?.data?.error || error.message;
      setErrorMessage("Upload failed: " + errMsg);
      setOpenSnackbar(true);
    }
  };

  // Handle closing the snackbar
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
  };

  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: "70%", md: "400px" },
            maxHeight: "90vh",
            padding: { xs: 2, sm: 4 },
            bgcolor: "white", // White background for the box
            textAlign: "center",
            borderRadius: "12px",
            transition: "background-color 0.3s ease",
            color: "black", // Black text
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            pointerEvents: "auto",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              marginBottom: 2,
              font: "inherit",
              fontSize: { xs: "16px", sm: "18px" },
              color: "black", // Black text
              transition: "color 0.3s ease",
              fontWeight: "bold",
            }}
          >
            Upload a document (PDF or DOCX)
          </Typography>

          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed #000", // Black dashed border
              padding: { xs: 2, sm: 4 },
              cursor: "pointer",
              marginBottom: 2,
              transition: "border-color 0.3s ease",
            }}
          >
            <input {...getInputProps()} />
            <Typography
              variant="body1"
              sx={{
                font: "inherit",
                color: "black", // Black text
                transition: "color 0.3s ease",
              }}
            >
              {file
                ? "Drag & drop a new file here, or click to select a new file"
                : "Drag & drop a file here, or click to select"}
            </Typography>
          </Box>

          {file && (
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                font: "inherit",
                color: "black", // Black text
                transition: "color 0.3s ease",
              }}
            >
              {file.name}
            </Typography>
          )}

          {file && (
            <TextField
              label="Document Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              sx={{ marginBottom: 2, font: "inherit" }}
              inputProps={{
                style: {
                  fontFamily: "Poppins, sans-serif",
                  color: "black", // Black text in the input
                },
              }}
              InputLabelProps={{
                style: {
                  fontFamily: "Poppins, sans-serif",
                  color: "black", // Black label text
                },
              }}
            />
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            fullWidth
            sx={{
              backgroundColor: "black", // Black button
              color: "white", // White text on button
              padding: 1.5,
              marginBottom: 2,
              "&:hover": {
                backgroundColor: "#333", // Darker black on hover
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Upload"}
          </Button>

          {progressMessage && (
            <Typography
              variant="body2"
              sx={{ color: "black", fontSize: "14px", fontWeight: "bold" }}
            >
              {progressMessage}
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{ color: "black", fontSize: "12px", marginTop: 2 }}
          >
            Avoid uploading large files. Max file size: 10MB
          </Typography>
        </Box>
      </div>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UploadModal;
