import { removeBackground } from '@imgly/background-removal';

// In-memory cache for processed cutout blob URLs
const cutoutCache = new Map<string, string>();
const processingPromises = new Map<string, Promise<string | null>>();

/**
 * Gets a transparent PNG cutout URL for a player image.
 * Uses Cloudinary background removal transformation if available,
 * or falls back to client-side @imgly/background-removal processing.
 */
export async function getPlayerCutout(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;

  // 1. Check in-memory cache first
  if (cutoutCache.has(imageUrl)) {
    return cutoutCache.get(imageUrl)!;
  }

  // 2. If already processing this image, return the existing promise
  if (processingPromises.has(imageUrl)) {
    return processingPromises.get(imageUrl)!;
  }

  // 3. Check Cloudinary URL fast-path
  if (imageUrl.includes('res.cloudinary.com')) {
    const cloudinaryCutoutUrl = imageUrl.includes('e_background_removal')
      ? imageUrl
      : imageUrl.replace('/upload/', '/upload/e_background_removal/');
    
    cutoutCache.set(imageUrl, cloudinaryCutoutUrl);
    return cloudinaryCutoutUrl;
  }

  // 4. Client-Side @imgly/background-removal processing
  const processPromise = (async () => {
    try {
      // Set a 12-second timeout fail-safe
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Cutout processing timed out')), 12000)
      );

      const removalPromise = (async () => {
        const imageBlob = await removeBackground(imageUrl, {
          output: {
            format: 'image/png',
            quality: 0.85
          }
        });
        return URL.createObjectURL(imageBlob);
      })();

      const resultUrl = await Promise.race([removalPromise, timeoutPromise]);
      if (resultUrl) {
        cutoutCache.set(imageUrl, resultUrl);
        return resultUrl;
      }
      return null;
    } catch (error) {
      console.warn('Client-side background removal fallback to raw image:', error);
      return null;
    } finally {
      processingPromises.delete(imageUrl);
    }
  })();

  processingPromises.set(imageUrl, processPromise);
  return processPromise;
}
