package com.securedms.service;

import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import java.io.InputStream;

@Service
public class OcrService {

    private final Tika tika = new Tika();

    /**
     * Extracts text metadata using Apache Tika.
     * In full production, Tesseract OCR can be integrated for scanned TIFF/JPEG images.
     */
    public String extractText(InputStream inputStream) {
        try {
            return tika.parseToString(inputStream);
        } catch (Exception e) {
            return "OCR extraction fallback: Text could not be parsed automatically. Reason: " + e.getMessage();
        }
    }
}
