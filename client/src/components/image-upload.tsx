import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, X, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageUpload({ patientId, isOpen, onClose }: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageType, setImageType] = useState("x-ray");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const results = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("imageType", imageType);

        const response = await fetch(`/api/patients/${patientId}/images`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        results.push(await response.json());
      }
      return results;
    },
    onSuccess: () => {
      toast({
        title: "Images uploaded",
        description: `${selectedFiles.length} image(s) uploaded successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId] });
      setSelectedFiles([]);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    uploadMutation.mutate(selectedFiles);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-clinical-800">
            Upload Medical Images
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Image Type Selection */}
          <div className="space-y-2">
            <Label className="text-clinical-700 font-medium">Image Type</Label>
            <Select value={imageType} onValueChange={setImageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x-ray">X-Ray</SelectItem>
                <SelectItem value="intraoral">Intraoral Photo</SelectItem>
                <SelectItem value="extraoral">Extraoral Photo</SelectItem>
                <SelectItem value="progress">Progress Photo</SelectItem>
                <SelectItem value="before">Before Treatment</SelectItem>
                <SelectItem value="after">After Treatment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-clinical-300 hover:border-primary"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-clinical-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-primary">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-clinical-700 mb-2">
                  Drag & drop medical images here, or click to select
                </p>
                <p className="text-sm text-clinical-500">
                  Supports: JPEG, PNG, GIF, PDF (max 10MB each)
                </p>
              </div>
            )}
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-clinical-700 font-medium">
                Selected Files ({selectedFiles.length})
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-clinical-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileImage className="w-5 h-5 text-clinical-400" />
                      <div>
                        <p className="text-sm font-medium text-clinical-800">{file.name}</p>
                        <p className="text-xs text-clinical-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-clinical-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploadMutation.isPending}
              className="clinical-button-primary"
            >
              {uploadMutation.isPending
                ? `Uploading... (${selectedFiles.length})`
                : `Upload ${selectedFiles.length} Image(s)`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
