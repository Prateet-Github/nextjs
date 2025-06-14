"use client";
import React, { useState } from "react";
import FileUpload from "./FileUpload"; // Adjust the path as needed

function VideoUploadForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleVideoUploadSuccess = (res: any) => {
    setVideoUrl(res.url); // or res.filePath depending on your config
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/videos/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description, videoUrl }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");
      alert("Video uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Upload New Video</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Video Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring"
          rows={4}
        />
        
        <FileUpload
          fileType="video"
          onSuccess={handleVideoUploadSuccess}
          onProgress={(p) => setUploadProgress(p)}
        />

        {uploadProgress > 0 && uploadProgress < 100 && (
          <p className="text-sm text-gray-600">Uploading: {uploadProgress}%</p>
        )}

        {videoUrl && (
          <video
            controls
            src={videoUrl}
            className="w-full mt-4 rounded-md border"
          />
        )}

        <button
          type="submit"
          disabled={loading || !videoUrl}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Submit Video"}
        </button>
      </form>
    </div>
  );
}

export default VideoUploadForm;