import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button'; // Import Button component
import { XCircle, Upload } from 'lucide-react'; // Add Upload icon

interface ImageUploadProps {
  field: {
    onChange: (files: File[] | null) => void; // Change type to accept array of File
    value: File[] | FileList | undefined | null; // Allow array or FileList for the value
    name: string; // Add name property
    // Add other field props if needed (e.g., onBlur, ref)
  };
}

const ImageUpload: React.FC<ImageUploadProps> = ({ field }) => {
  // We no longer manage selectedFiles as an internal state independent of field.value
  // const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null); // Add ref for hidden input

  // Convert field.value to a consistent array of Files for easier handling
  const currentFiles: File[] = useMemo(() => {
    if (Array.isArray(field.value)) {
      return field.value;
    } else if (field.value instanceof FileList) {
      return Array.from(field.value);
    }
    return [];
  }, [field.value]);

  // Effect to generate previews whenever currentFiles (derived from field.value) changes
  useEffect(() => {
    console.log('ImageUpload: currentFiles (from field.value) updated:', currentFiles);
    const imageUrls = currentFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(imageUrls);

    // Cleanup function to revoke object URLs
    return () => {
      console.log('ImageUpload: Revoking object URLs for:', imageUrls.length, 'images');
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [currentFiles]); // Depend on currentFiles (derived from field.value)

  // Removed the useEffect that was causing the loop

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const updatedFiles = [...currentFiles, ...newFiles]; // Combine with existing files
      console.log('ImageUpload: handleFileChange: Reporting updated files to react-hook-form:', updatedFiles);
      field.onChange(updatedFiles); // Report combined files back to react-hook-form

      // Clear the input value so the same file(s) can be selected again if needed
      event.target.value = '';
    }
  }, [currentFiles, field.onChange]); // currentFiles and field.onChange are dependencies

  const handleRemoveImage = useCallback((index: number) => {
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    console.log('ImageUpload: handleRemoveImage: Reporting files after removal to react-hook-form:', updatedFiles);
    field.onChange(updatedFiles.length > 0 ? updatedFiles : null); // Pass null if no files remain
  }, [currentFiles, field.onChange]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        name={field.name}
        style={{ display: 'none' }}
      />
      
      {/* Custom upload button with Chinese text */}
      <Button
        type="button"
        variant="outline"
        onClick={handleUploadClick}
        className="w-full flex items-center gap-2"
      >
        <Upload size={16} />
        {currentFiles.length > 0 ? `已選擇 ${currentFiles.length} 張圖片` : '選擇圖片'}
      </Button>

      {previewImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {previewImages.map((url, index) => (
            <div key={index} className="relative group border p-1 rounded-md flex items-center justify-center">
              <img src={url} alt={`預覽 ${index + 1}`} className="block w-full h-auto object-cover rounded-md" />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                // Make button always visible and position it clearly - added block and increased size slightly
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs flex items-center justify-center opacity-100"
                aria-label="移除圖片"
                style={{ width: '24px', height: '24px', zIndex: 10 }}
              >
                <XCircle size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Display error message if any */}
      {/* {form.formState.errors.images && (<p className="text-red-500 text-sm">{form.formState.errors.images.message as string}</p>)} */}
      {/* Note: Error message display should ideally be handled in the parent form component */}
    </div>
  );
};

export default ImageUpload; 