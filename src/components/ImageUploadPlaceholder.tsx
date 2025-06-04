
"use client";

import React, { useState, useCallback } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ImageUploadPlaceholderProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  existingImages?: { url: string; alt: string }[];
}

const ImageUploadPlaceholder: React.FC<ImageUploadPlaceholderProps> = ({ 
  onFilesChange, 
  maxFiles = 5,
  existingImages = []
}) => {
  const [previews, setPreviews] = useState<(string | { url: string; alt: string })[]>(existingImages);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFilesArray = Array.from(event.target.files);
      const totalFiles = files.length + newFilesArray.length;
      
      if (totalFiles > maxFiles) {
        alert(`You can only upload a maximum of ${maxFiles} images.`);
        return;
      }
      
      const newImageFiles = [...files, ...newFilesArray];
      setFiles(newImageFiles);
      onFilesChange(newImageFiles);

      const newPreviews = newFilesArray.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  }, [files, maxFiles, onFilesChange]);

  const removeImage = useCallback((indexToRemove: number) => {
    setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    
    // If the removed image was an existing one (object), we don't remove it from files list.
    // If it was a new preview (string), we remove the corresponding file.
    const removedItem = previews[indexToRemove];
    if (typeof removedItem === 'string') {
      const newFiles = files.filter((_, i) => {
        // This logic needs refinement if mixing existing and new and then removing.
        // For simplicity, if it's a string URL, it's a new file.
        // This assumes existingImages are first in previews array if mixed.
        const fileIndexToRemove = previews.slice(0, indexToRemove).filter(p => typeof p === 'string').length;
        return i !== fileIndexToRemove;
      });
      setFiles(newFiles);
      onFilesChange(newFiles);
    } else {
      // Handle removal of existing images if needed (e.g., by passing a callback for existing image removal)
      // For now, this only affects the preview. The parent form would need to handle actual deletion of existing images.
      console.log("Removed an existing image preview. Actual deletion needs to be handled by parent.");
    }

  }, [previews, files, onFilesChange]);

  const inputId = React.useId();

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
        <input
          type="file"
          id={inputId}
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={previews.length >= maxFiles}
        />
        <label htmlFor={inputId} className="cursor-pointer">
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Drag & drop images here, or click to select files
          </p>
          <p className="text-xs text-muted-foreground">
            (Max {maxFiles} images)
          </p>
        </label>
      </div>
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {previews.map((previewSrc, index) => (
            <div key={index} className="relative group aspect-square">
              <Image
                src={typeof previewSrc === 'string' ? previewSrc : previewSrc.url}
                alt={typeof previewSrc === 'string' ? `Preview ${index + 1}` : previewSrc.alt}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
                data-ai-hint="photo gallery"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  