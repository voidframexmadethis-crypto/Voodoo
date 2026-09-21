/**
 * Client-Side Image Optimizer for Voodoo Boomin Services Directory
 * Resizes and compresses uploaded images using Canvas to minimize bandwidth usage.
 */
export async function optimizeImageFile(
  file: File, 
  maxWidth: number = 320, 
  maxHeight: number = 320, 
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed WebP or JPEG
        try {
          const optimizedDataUrl = canvas.toDataURL('image/webp', quality);
          if (optimizedDataUrl.startsWith('data:image/webp')) {
            resolve(optimizedDataUrl);
            return;
          }
        } catch (err) {
          // Fallback to JPEG
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
