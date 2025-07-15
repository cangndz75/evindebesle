import { useCallback, useState } from "react";

type FileWithPreview = {
  id: string;
  file: File;
  preview: string;
};

type UseFileUploadOptions = {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  maxFiles?: number;
};

export function useFileUpload(options: UseFileUploadOptions) {
  const {
    accept = "image/*",
    maxSize = 5 * 1024 * 1024, // 5MB
    multiple = true,
    maxFiles = 6,
  } = options;

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return "Sadece resim dosyaları yüklenebilir.";
    }
    if (file.size > maxSize) {
      return `Dosya boyutu ${maxSize / 1024 / 1024}MB'den büyük olamaz.`;
    }
    return null;
  };

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithPreview[] = [];
    const newErrors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      if (files.length + newFiles.length >= maxFiles) {
        newErrors.push(`En fazla ${maxFiles} dosya yükleyebilirsiniz.`);
        return;
      }

      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
        return;
      }

      newFiles.push({
        id: `${file.name}-${file.lastModified}`,
        file,
        preview: URL.createObjectURL(file),
      });
    });

    setErrors(newErrors);
    if (newFiles.length) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const getInputProps = () => ({
    type: "file",
    accept,
    multiple,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      handleFiles(e.target.files),
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return [
    { files, isDragging, errors },
    {
      getInputProps,
      handleDrop,
      handleDragEnter: () => setIsDragging(true),
      handleDragLeave: () => setIsDragging(false),
      handleDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
      },
      openFileDialog: () => {
        const input = document.createElement("input");
        Object.assign(input, getInputProps());
        input.click();
      },
      removeFile: (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
      },
    },
  ] as const;
}
