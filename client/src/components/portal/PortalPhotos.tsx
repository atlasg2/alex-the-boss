import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, X, ZoomIn, ExternalLink } from "lucide-react";
import { FileWithDetails } from "@/lib/types";

interface PortalPhotosProps {
  files: FileWithDetails[];
}

export function PortalPhotos({ files }: PortalPhotosProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  
  // Filter for image files only
  const imageFiles = files.filter(file => 
    file.mimetype?.startsWith('image/')
  );
  
  // Use actual images - we'll no longer need placeholders with a database
  const displayImages = imageFiles.map(file => ({
    url: file.url,
    alt: file.label || file.filename,
    date: file.createdAt,
    id: file.id
  }));

  // Open gallery with selected image
  const openGallery = (index: number) => {
    setSelectedImage(index);
    setShowGallery(true);
  };

  // Navigate to previous image
  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? displayImages.length - 1 : selectedImage - 1);
    }
  };

  // Navigate to next image
  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % displayImages.length);
    }
  };

  // Group images by week
  const groupImagesByWeek = () => {
    const grouped: Record<string, typeof displayImages> = {};
    
    displayImages.forEach(image => {
      const date = new Date(image.date);
      // Get the week number
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      grouped[weekKey].push(image);
    });
    
    return Object.entries(grouped).sort((a, b) => {
      // Sort weeks in descending order (newest first)
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    });
  };

  const groupedImages = groupImagesByWeek();

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex justify-between items-center">
            <span>Project Photos</span>
            {displayImages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSelectedImage(0);
                  setShowGallery(true);
                }}
              >
                <ZoomIn className="mr-2 h-4 w-4" />
                View Gallery
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayImages.length > 0 ? (
            <div className="space-y-8">
              {groupedImages.map(([weekKey, images]) => (
                <div key={weekKey} className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center text-slate-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Week of {new Date(weekKey).toLocaleDateString()}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((image, index) => {
                      const globalIndex = displayImages.findIndex(img => img.id === image.id);
                      return (
                        <div 
                          key={image.id} 
                          className="aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer relative group"
                          onClick={() => openGallery(globalIndex)}
                        >
                          <img 
                            src={image.url} 
                            alt={image.alt} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="text-white h-6 w-6" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
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

      {/* Full screen gallery */}
      {displayImages.length > 0 && (
        <Dialog open={showGallery} onOpenChange={setShowGallery}>
          <DialogContent className="max-w-4xl w-full bg-black/95 text-white border-slate-800" onEscapeKeyDown={() => setShowGallery(false)}>
            <DialogTitle className="text-white flex justify-between items-center">
              <span>Project Photos</span>
              <Button variant="ghost" size="icon" onClick={() => setShowGallery(false)} className="text-white">
                <X className="h-5 w-5" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedImage !== null && displayImages[selectedImage]?.date && (
                <span>Taken on {new Date(displayImages[selectedImage].date).toLocaleDateString()}</span>
              )}
            </DialogDescription>
            
            <div className="relative">
              {selectedImage !== null && (
                <div className="flex items-center justify-center my-4">
                  <div className="relative w-full max-h-[60vh] flex items-center justify-center">
                    <img
                      src={displayImages[selectedImage]?.url}
                      alt={displayImages[selectedImage]?.alt}
                      className="max-h-[60vh] max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={prevImage}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={nextImage}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </div>
            
            <div className="mt-4 overflow-x-auto pb-2">
              <div className="flex space-x-2">
                {displayImages.map((image, index) => (
                  <div
                    key={image.id}
                    className={`w-16 h-16 flex-shrink-0 cursor-pointer rounded-md overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-primary' : 'opacity-60'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-slate-400">
                {selectedImage !== null && `${selectedImage + 1} of ${displayImages.length}`}
              </div>
              <Button variant="outline" size="sm" className="text-white border-slate-700">
                <ExternalLink className="mr-2 h-4 w-4" />
                Download Original
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
