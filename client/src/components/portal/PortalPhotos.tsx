import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileWithDetails } from "@/lib/types";

interface PortalPhotosProps {
  files: FileWithDetails[];
}

export function PortalPhotos({ files }: PortalPhotosProps) {
  // Filter for image files only
  const imageFiles = files.filter(file => 
    file.mimetype.startsWith('image/')
  );
  
  // For demo purposes, if no real images available, use placeholders
  const demoImages = [
    {
      url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8a2l0Y2hlbiUyMHJlbW9kZWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
      alt: "Kitchen demo"
    },
    {
      url: "https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGtpdGNoZW4lMjByZW1vZGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
      alt: "Kitchen progress"
    },
    {
      url: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGtpdGNoZW4lMjByZW1vZGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
      alt: "Cabinets installation"
    },
    {
      url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGtpdGNoZW4lMjByZW1vZGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
      alt: "Flooring installation"
    }
  ];

  // Use real images if available, otherwise use demo images
  const displayImages = imageFiles.length > 0 
    ? imageFiles.map(file => ({ url: file.url, alt: file.label || file.filename }))
    : demoImages;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Project Photos</CardTitle>
      </CardHeader>
      <CardContent>
        {displayImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayImages.map((image, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                <img 
                  src={image.url} 
                  alt={image.alt} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            No project photos available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
