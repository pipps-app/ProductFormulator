import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, File, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  isLoading?: boolean;
  className?: string;
}

export default function FileUpload({
  onUpload,
  accept = ".csv,.json,.pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  isLoading = false,
  className = "",
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === "file-too-large") {
        setError(`File is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        setError("File type not supported");
      } else {
        setError("Invalid file");
      }
      return;
    }

    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      setError(`Cannot upload more than ${maxFiles} files`);
      return;
    }

    const newFiles = [...uploadedFiles, ...acceptedFiles];
    setUploadedFiles(newFiles);
    
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          onUpload(newFiles);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  }, [uploadedFiles, maxFiles, maxSize, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize,
    maxFiles,
    disabled: isLoading,
  });

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? "border-primary-400 bg-primary-50"
            : "border-slate-300 hover:border-primary-400"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        
        <CloudUpload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-slate-600 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Supports {accept.split(',').join(', ')} up to {(maxSize / 1024 / 1024).toFixed(1)}MB
            </p>
            <Button type="button" disabled={isLoading}>
              Choose Files
            </Button>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-900">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-slate-500">Uploading... {uploadProgress}%</p>
            </div>
          )}

          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
