"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  onUploadComplete: (urls: string[]) => void;
}

interface PreviewItem {
  file: File;
  url: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

export default function ImageUploader({ onUploadComplete }: ImageUploaderProps) {
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const fileArray = Array.from(selectedFiles);
    const validImageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (validImageFiles.length === 0) return;

    const newPreviews: PreviewItem[] = validImageFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      status: 'pending'
    }));

    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setPreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadImages = async () => {
    if (previews.length === 0) return;
    
    setIsUploading(true);
    setProgress(0);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < previews.length; i++) {
        // Skip already uploaded or failed if needed, but here we upload all in queue
        setPreviews(prev => {
          const next = [...prev];
          next[i].status = 'uploading';
          return next;
        });

        const formData = new FormData();
        formData.append("file", previews[i].file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
          setPreviews(prev => {
            const next = [...prev];
            next[i].status = 'success';
            return next;
          });
        } else {
          setPreviews(prev => {
            const next = [...prev];
            next[i].status = 'error';
            return next;
          });
        }

        setProgress(Math.round(((i + 1) / previews.length) * 100));
      }

      onUploadComplete(uploadedUrls);
      
      // Clear after a short delay to show success
      setTimeout(() => {
        setPreviews([]);
        setProgress(0);
        setIsUploading(false);
      }, 1500);

    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative group border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ease-in-out ${
          dragActive 
            ? "border-primary bg-primary/5 scale-[1.01]" 
            : "border-muted-foreground/20 bg-muted/5 hover:border-primary/50 hover:bg-muted/10"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
          <div className="p-4 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">
              Click or drag images to upload
            </p>
            <p className="text-sm text-muted-foreground">
              Supports JPG, PNG, WebP (Max 5MB each)
            </p>
          </div>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Selected Images ({previews.length})
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPreviews([])}
              disabled={isUploading}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((item, index) => (
              <div 
                key={index} 
                className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border shadow-sm hover:shadow-md transition-all duration-300"
              >
                <img
                  src={item.url}
                  alt={`Preview ${index}`}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                    item.status === 'uploading' ? 'opacity-50 grayscale' : ''
                  }`}
                />
                
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}

                {item.status === 'success' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-[1px]">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  disabled={isUploading}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-md rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive hover:text-destructive-foreground z-20 shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                   <p className="text-[10px] text-white truncate font-medium">
                     {item.file.name}
                   </p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Section */}
          {isUploading && (
            <div className="space-y-2 p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Uploading images...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={uploadImages}
            disabled={isUploading || previews.length === 0}
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 group overflow-hidden relative"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                Upload All Images
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
