import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/use-files";
import { Upload, FileIcon, ImageIcon, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUploaded?: (fileId: number) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  maxFiles?: number;
  className?: string;
}

interface FilePreview {
  file: File;
  preview?: string;
  id: string;
  error?: string;
}

export default function FileUpload({
  onFileUploaded,
  acceptedTypes = ["image/*", ".pdf", ".doc", ".docx", ".txt"],
  maxSizeMB = 10,
  maxFiles = 5,
  className
}: FileUploadProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileUpload = useFileUpload();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      const errorMessages = errors.map((e: any) => {
        switch (e.code) {
          case 'file-too-large':
            return `File is too large (max ${maxSizeMB}MB)`;
          case 'file-invalid-type':
            return 'File type not supported';
          case 'too-many-files':
            return `Too many files (max ${maxFiles})`;
          default:
            return 'File rejected';
        }
      }).join(', ');
      
      toast({
        variant: "destructive",
        title: "File rejected",
        description: `${file.name}: ${errorMessages}`,
      });
    });

    // Process accepted files
    const newFiles = acceptedFiles.map(file => {
      const id = Math.random().toString(36).substr(2, 9);
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      
      return {
        file,
        preview,
        id
      };
    });

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxSizeMB, maxFiles, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles,
    multiple: true
  });

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const filePreview of files) {
        const { file } = filePreview;
        
        // Convert file to base64 for storage (in production, use proper file storage)
        const fileUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Create thumbnail for images
        let thumbnailUrl: string | undefined;
        if (file.type.startsWith('image/')) {
          thumbnailUrl = fileUrl; // In production, generate actual thumbnails
        }

        const fileData = {
          fileName: `${Date.now()}_${file.name}`,
          originalName: file.name,
          fileUrl,
          fileType: file.type.split('/')[0], // 'image', 'application', etc.
          mimeType: file.type,
          fileSize: file.size,
          thumbnailUrl,
          description: '',
          tags: []
        };

        const uploadedFile = await fileUpload.mutateAsync(fileData);
        
        if (onFileUploaded && uploadedFile?.id) {
          onFileUploaded(uploadedFile.id);
        }
      }

      // Clear files after successful upload
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setFiles([]);

      toast({
        title: "Upload successful",
        description: `${files.length} file(s) uploaded successfully`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop files here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Max {maxFiles} files, up to {maxSizeMB}MB each
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {acceptedTypes.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type.replace('*', '').replace('.', '').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-3">
            {files.map((filePreview) => (
              <Card key={filePreview.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {filePreview.preview ? (
                      <img 
                        src={filePreview.preview} 
                        alt={filePreview.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        {filePreview.file.type.startsWith('image/') ? (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        ) : (
                          <FileIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {filePreview.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(filePreview.file.size)}
                    </p>
                    {filePreview.error && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 text-destructive" />
                        <p className="text-xs text-destructive">{filePreview.error}</p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(filePreview.id)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={uploadFiles}
              disabled={uploading || files.length === 0}
              className="flex-1"
            >
              {uploading ? "Uploading..." : `Upload ${files.length} file(s)`}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                files.forEach(f => {
                  if (f.preview) URL.revokeObjectURL(f.preview);
                });
                setFiles([]);
              }}
              disabled={uploading}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}