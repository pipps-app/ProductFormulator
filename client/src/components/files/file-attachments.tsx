import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAttachedFiles, useAttachFile, useDetachFile, useFiles } from "@/hooks/use-files";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "./file-upload";
import { Paperclip, FileIcon, ImageIcon, Download, Trash2, Plus, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { File } from "@shared/schema";

interface FileAttachmentsProps {
  entityType: "material" | "formulation";
  entityId: number;
  entityName: string;
  className?: string;
}

export default function FileAttachments({
  entityType,
  entityId,
  entityName,
  className
}: FileAttachmentsProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { data: attachedFiles = [], isLoading } = useAttachedFiles(entityType, entityId);
  const { data: allFiles = [] } = useFiles();
  const attachFile = useAttachFile();
  const detachFile = useDetachFile();
  const { toast } = useToast();

  const handleFileUploaded = async (fileId: number) => {
    if (!entityId) {
      toast({
        variant: "destructive",
        title: "Save required",
        description: "Please save the item first before attaching files.",
      });
      return;
    }

    try {
      await attachFile.mutateAsync({
        entityType,
        entityId,
        fileId
      });
      
      setShowUploadDialog(false);
      toast({
        title: "File attached",
        description: "File has been successfully attached",
      });
    } catch (error) {
      console.error("Error attaching file:", error);
      toast({
        variant: "destructive",
        title: "Attachment failed",
        description: "Failed to attach file. Please try again.",
      });
    }
  };

  const handleAttachExistingFile = async (fileId: number) => {
    if (!entityId) {
      toast({
        variant: "destructive",
        title: "Save required",
        description: "Please save the item first before attaching files.",
      });
      return;
    }

    try {
      await attachFile.mutateAsync({
        entityType,
        entityId,
        fileId
      });
      
      setShowLibraryDialog(false);
      toast({
        title: "File attached",
        description: "File has been successfully attached",
      });
    } catch (error) {
      console.error("Error attaching file:", error);
      toast({
        variant: "destructive",
        title: "Attachment failed",
        description: "Failed to attach file. Please try again.",
      });
    }
  };

  const handleDetachFile = async (fileId: number) => {
    try {
      await detachFile.mutateAsync({
        entityType,
        entityId,
        fileId
      });
      
      toast({
        title: "File detached",
        description: "File has been successfully detached",
      });
    } catch (error) {
      console.error("Error detaching file:", error);
      toast({
        variant: "destructive",
        title: "Detach failed",
        description: "Failed to detach file. Please try again.",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.fileType === 'image') {
      return file.thumbnailUrl ? (
        <img 
          src={file.thumbnailUrl} 
          alt={file.originalName}
          className="w-8 h-8 object-cover rounded"
        />
      ) : (
        <ImageIcon className="w-8 h-8 text-blue-500" />
      );
    }
    return <FileIcon className="w-8 h-8 text-gray-500" />;
  };

  const availableFiles = Array.isArray(allFiles) ? allFiles.filter((file: File) => 
    !Array.isArray(attachedFiles) ? true : !attachedFiles.some((attached: File) => attached.id === file.id)
  ) : [];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading files...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Files ({attachedFiles.length})
          </div>
          <div className="flex gap-2">
            <Dialog open={showLibraryDialog} onOpenChange={setShowLibraryDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Attach
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Attach File from Library</DialogTitle>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {availableFiles.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No files available to attach. Upload new files first.
                    </p>
                  ) : (
                    availableFiles.map(file => (
                      <Card key={file.id} className="p-3 hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleAttachExistingFile(file.id)}>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.originalName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.fileSize)} • {file.fileType}
                            </p>
                          </div>
                          <Badge variant="secondary">Click to attach</Badge>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload & Attach Files</DialogTitle>
                </DialogHeader>
                <FileUpload
                  onFileUploaded={handleFileUploaded}
                  maxFiles={3}
                  maxSizeMB={10}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attachedFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No files attached to {entityName}</p>
            <p className="text-sm">Upload or attach files to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attachedFiles.map(file => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getFileIcon(file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.originalName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span className="capitalize">{file.fileType}</span>
                      {file.description && (
                        <>
                          <span>•</span>
                          <span>{file.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {file.fileUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(file)}
                        title="Preview file"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {file.fileUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = file.fileUrl;
                          link.download = file.originalName;
                          link.click();
                        }}
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDetachFile(file.id)}
                      className="text-destructive hover:text-destructive"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* File Preview Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.originalName}</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="max-h-96 overflow-auto">
              {selectedFile.fileType === 'image' ? (
                <img 
                  src={selectedFile.fileUrl} 
                  alt={selectedFile.originalName}
                  className="max-w-full h-auto"
                />
              ) : (
                <div className="text-center py-8">
                  <FileIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">{selectedFile.originalName}</p>
                  <p className="text-muted-foreground">
                    {formatFileSize(selectedFile.fileSize)} • {selectedFile.mimeType}
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedFile.fileUrl;
                      link.download = selectedFile.originalName;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}