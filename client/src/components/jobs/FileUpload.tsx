import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileIcon, 
  Download, 
  Trash2, 
  Share2,
  Upload,
  Image,
  FileText,
  File,
  FileSpreadsheet
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FileWithDetails } from "@/lib/types";

interface FileUploadProps {
  jobId: string;
}

export function FileUpload({ jobId }: FileUploadProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileLabel, setFileLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch files
  const { data: files, isLoading } = useQuery({
    queryKey: [`/api/jobs/${jobId}/files`],
  });

  // Create file mutation
  const createFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // In a real implementation, this would upload to Supabase Storage
      // For now, we'll simulate by creating a file record
      const fileData = {
        jobId,
        url: URL.createObjectURL(selectedFile!),
        filename: selectedFile!.name,
        filesize: selectedFile!.size,
        mimetype: selectedFile!.type,
        label: fileLabel,
        uploadedBy: 1 // Default admin user
      };
      
      return apiRequest("POST", "/api/files", fileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/files`] });
      setIsUploadOpen(false);
      setSelectedFile(null);
      setFileLabel("");
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/files`] });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Use filename as default label, removing extension
      setFileLabel(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
    }
  };

  // Handle file upload
  const handleUpload = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('label', fileLabel);
    formData.append('jobId', jobId);
    
    createFileMutation.mutate(formData);
  };

  // Handle file deletion
  const handleDeleteFile = (id: string) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      deleteFileMutation.mutate(id);
    }
  };

  // Get icon for file type
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (mimetype === 'application/pdf') {
      return <File className="h-5 w-5 text-red-500" />;
    } else if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    } else {
      return <FileText className="h-5 w-5 text-slate-500" />;
    }
  };

  // Format filesize
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Files</h3>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed border-slate-200 rounded-md p-6 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileIcon className="h-8 w-8 mx-auto text-primary" />
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-slate-400" />
                    <p className="text-sm text-slate-500">Click to select a file or drag and drop</p>
                    <p className="text-xs text-slate-400">Max file size: 20MB</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              <div>
                <Label htmlFor="fileLabel">File Label</Label>
                <Input
                  id="fileLabel"
                  value={fileLabel}
                  onChange={(e) => setFileLabel(e.target.value)}
                  placeholder="Enter a descriptive label"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsUploadOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || !fileLabel || createFileMutation.isPending}
              >
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="py-10 text-center text-slate-500">Loading files...</div>
      ) : files?.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file: FileWithDetails) => (
              <TableRow key={file.id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-9 w-9 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center mr-3">
                      {getFileIcon(file.mimetype)}
                    </div>
                    <div>
                      <div className="font-medium">{file.label || file.filename}</div>
                      {file.label && <div className="text-xs text-slate-500">{file.filename}</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {file.mimetype.split('/')[1]?.toUpperCase() || file.mimetype}
                </TableCell>
                <TableCell>{formatFileSize(file.filesize)}</TableCell>
                <TableCell>{new Date(file.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(file.url, '_blank')}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Share"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="sr-only">Share</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deleteFileMutation.isPending}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="py-10 text-center text-slate-500 border border-dashed border-slate-200 rounded-md">
          No files uploaded yet. Click 'Upload File' to add your first file.
        </div>
      )}
    </div>
  );
}
