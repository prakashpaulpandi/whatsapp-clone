package com.chatapp.chatapp.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class FileUploadController {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @Value("${server.port:8080}")
    private String serverPort;

    /**
     * POST /api/upload
     * Accepts a multipart file, saves it to the uploads directory,
     * and returns the publicly accessible URL.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        }

        // Validate file type — only images and common files allowed
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid file name"));
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        // Allowed extensions
        java.util.Set<String> allowedExtensions = java.util.Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp",   // images
            ".pdf", ".txt", ".doc", ".docx",                     // documents
            ".mp4", ".mov", ".avi",                              // video
            ".mp3", ".wav", ".ogg"                               // audio
        );

        if (!allowedExtensions.contains(extension)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File type not allowed: " + extension));
        }

        // Validate size (max 20 MB)
        if (file.getSize() > 20 * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File too large. Maximum size is 20MB"));
        }

        // Save file with a unique name to avoid collisions
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);

        String uniqueFilename = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Return the URL that can be used to retrieve this file
        String fileUrl = "/api/files/" + uniqueFilename;

        return ResponseEntity.ok(Map.of(
            "url", fileUrl,
            "filename", uniqueFilename,
            "originalName", originalFilename,
            "size", file.getSize(),
            "type", file.getContentType() != null ? file.getContentType() : "application/octet-stream"
        ));
    }

    /**
     * GET /api/files/{filename}
     * Serves a previously uploaded file.
     */
    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) throws MalformedURLException {
        // Sanitize filename to prevent path traversal
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }

        Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        // Try to determine content type
        String contentType = "application/octet-stream";
        String lowerFilename = filename.toLowerCase();
        if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (lowerFilename.endsWith(".png")) {
            contentType = "image/png";
        } else if (lowerFilename.endsWith(".gif")) {
            contentType = "image/gif";
        } else if (lowerFilename.endsWith(".webp")) {
            contentType = "image/webp";
        } else if (lowerFilename.endsWith(".pdf")) {
            contentType = "application/pdf";
        } else if (lowerFilename.endsWith(".mp4")) {
            contentType = "video/mp4";
        } else if (lowerFilename.endsWith(".mp3")) {
            contentType = "audio/mpeg";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
