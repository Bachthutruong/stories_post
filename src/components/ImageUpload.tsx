import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input'; // Assuming Input component is used
import { XCircle } from 'lucide-react'; // Assuming lucide-react is available for an icon

interface ImageUploadProps {
  field: {
    onChange: (files: File[] | null) => void; // Change type to accept array of File
    value: File[] | FileList | undefined | null; // Allow array or FileList for the value
    name: string; // Add name property
    // Add other field props if needed (e.g., onBlur, ref)
  };
}

const ImageUpload: React.FC<ImageUploadProps> = ({ field }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Effect to initialize state from form value (if any existing files are passed)
  // This is complex for FileList and usually not needed for typical file inputs.
  // We focus on handling new uploads and removals.

  // Effect to generate previews whenever selectedFiles changes
  useEffect(() => {
    console.log('ImageUpload: selectedFiles state updated:', selectedFiles);
    const imageUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(imageUrls);

    // Cleanup function to revoke object URLs
    return () => {
      console.log('ImageUpload: Revoking object URLs:', imageUrls);
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]); // Re-run when selectedFiles changes

  // Report changes back to react-hook-form whenever selectedFiles updates
  useEffect(() => {
    // Pass the array of Files back to react-hook-form
    // Explicitly create a new array instance just in case
    const filesToReport = selectedFiles.length > 0 ? [...selectedFiles] : null;
    console.log('ImageUpload: Reporting files to react-hook-form:', filesToReport);
    field.onChange(filesToReport);
  }, [selectedFiles, field.onChange]);


  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      console.log('ImageUpload: handleFileChange: Previous files (before update):', selectedFiles);
      console.log('ImageUpload: handleFileChange: New files selected:', newFiles);

      // Use functional update form to ensure we use the latest state
      setSelectedFiles(prevFiles => {
        const updatedFiles = [...prevFiles, ...newFiles];
        console.log('ImageUpload: handleFileChange: Updated files array (inside setSelectedFiles):', updatedFiles);
        return updatedFiles;
      });

      // Clear the input value so the same file(s) can be selected again if needed
      event.target.value = '';
    }
  }, [selectedFiles]);

  const handleRemoveImage = useCallback((index: number) => {
    // Use functional update form to ensure we use the latest state
    setSelectedFiles(prevFiles => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index);
      console.log('ImageUpload: handleRemoveImage: Files after removal:', updatedFiles);
      return updatedFiles;
    });
  }, []);


  return (
    <div>
      <Input
        id="images"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        name={field.name} // Pass the name from the controller field
      />
      {previewImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {previewImages.map((url, index) => (
            <div key={index} className="relative group border p-1 rounded-md flex items-center justify-center">
              <img src={url} alt={`Preview ${index + 1}`} className="block w-full h-auto object-cover rounded-md" />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                // Make button always visible and position it clearly - added block and increased size slightly
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs flex items-center justify-center opacity-100"
                aria-label="Remove image"
                style={{ width: '24px', height: '24px', zIndex: 10 }}
              >
                 X <XCircle size={14} />
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