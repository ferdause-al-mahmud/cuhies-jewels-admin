"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import Image from "next/image";
import imageCompression from "browser-image-compression";

export default function ImageManager() {
  const [images, setImages] = useState([]);
  const [newImageFile, setNewImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      const res = await axios.get(`/api/banner`);
      if (res.data?.success) {
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        setImages(list);
      } else {
        toast.error("Failed to fetch images.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching images.");
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const onSelectFile = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      toast.error("Please select only one image.");
      e.target.value = "";
      return;
    }
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      e.target.value = "";
      return;
    }
    setNewImageFile(file);
  };

  const optimizeImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error("Error compressing image:", error);
      return file;
    }
  };

  const handleUpload = async () => {
    if (!newImageFile) return;

    setIsUploading(true);
    try {
      const optimized = await optimizeImage(newImageFile);

      const formData = new FormData();
      formData.append("file", optimized);
      formData.append("upload_preset", "CuhiesJewels");
      formData.append("folder", "CuhiesJewels");

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/dvktrl9as/image/upload`;
      const uploadRes = await axios.post(cloudinaryUrl, formData);
      console.log(uploadRes);
      const secureUrl = uploadRes.data.secure_url;
      const publicId = uploadRes.data.public_id;
      const originalFileName = uploadRes.data.original_filename;

      await axios.post(`/api/banner`, {
        url: secureUrl,
        publicId,
        name: originalFileName,
      });

      await fetchImages();
      setNewImageFile(null);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    confirmAlert({
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this image?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            setIsDeleting(true);
            try {
              await axios.delete(`/api/banner`, { data: { _id: id } });
              toast.success("Image deleted successfully!");
              await fetchImages();
            } catch (error) {
              console.error("Error deleting image:", error);
              toast.error("Failed to delete image.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
        { label: "No" },
      ],
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Banner Manager</h1>

      {/* Upload */}
      <div className="mb-6">
        <label className="block mb-2 text-lg font-semibold">
          Add a Banner Image
        </label>

        <input
          type="file"
          accept="image/*"
          multiple={false} // <-- only one file at a time
          onChange={onSelectFile}
          className="border rounded px-3 py-2 w-full mb-4"
        />

        <button
          onClick={handleUpload}
          disabled={!newImageFile || isUploading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image._id}
            className="relative border rounded-lg overflow-hidden group"
          >
            <Image
              src={image.url}
              alt={image.name || "Banner"}
              width={1200}
              height={600}
              className="w-full h-auto object-cover"
              priority
            />
            <button
              onClick={() => handleDelete(image._id)}
              disabled={isDeleting}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              title="Delete"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
