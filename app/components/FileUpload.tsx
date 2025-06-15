"use client"

import {
  upload
} from "@imagekit/next";

import { useRef, useState } from "react";

interface FileUploadProps {
  onSuccess: (res: any) => void;
  onProgress?: (progress: number) => void;
  fileType?: "image" | "video";
}

const FileUpload = ({ onSuccess, onProgress, fileType }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    // Reset previous errors
    setError(null);

    // Validate file type
    if (fileType === "video") {
      if (!file.type.startsWith("video/")) {
        setError("Please upload a valid video file");
        return false;
      }
    } else if (fileType === "image") {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file");
        return false;
      }
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100 MB");
      return false;
    }

    return true;
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || !validateFile(file)) {
      resetFileInput();
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get authentication details from your API
      const authRes = await fetch("/api/auth/imagekit-auth");
      
      if (!authRes.ok) {
        throw new Error("Failed to get authentication details");
      }

      const auth = await authRes.json();

      // Upload file to ImageKit
      const res = await upload({
        file,
        fileName: file.name,
        publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY!,
        signature: auth.signature,
        expire: auth.expire,
        token: auth.token,
        onProgress: (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = (event.loaded / event.total) * 100;
            onProgress(Math.round(percent));
          }
        },
      });

      // Call success callback and reset input
      onSuccess(res);
      resetFileInput();
      
    } catch (error) {
      console.error("Upload failed", error);
      setError(
        error instanceof Error 
          ? `Upload failed: ${error.message}` 
          : "Upload failed. Please try again."
      );
      resetFileInput();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={fileType === "video" ? "video/*" : fileType === "image" ? "image/*" : "*/*"}
        onChange={handleFileChange}
        disabled={uploading}
        style={{ 
          opacity: uploading ? 0.6 : 1,
          cursor: uploading ? "not-allowed" : "pointer"
        }}
      />
      
      {uploading && (
        <div style={{ marginTop: "8px", color: "#007bff" }}>
          <span>Uploading...</span>
        </div>
      )}
      
      {error && (
        <div style={{ marginTop: "8px", color: "#dc3545" }}>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;