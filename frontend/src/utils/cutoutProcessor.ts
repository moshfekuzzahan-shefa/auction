import { removeBackground, type Config } from '@imgly/background-removal';

// In-memory cache for processed cutout blob URLs with PNG Alpha Transparency
const cutoutCache = new Map<string, string>();
const processingPromises = new Map<string, Promise<string | null>>();

const config: Config = {
  output: {
    format: 'image/png', // Must output PNG for alpha channel transparency
    quality: 1, // Full quality
  }
};

/**
 * Processes player image using @imgly/background-removal to generate a true 
 * transparent PNG cutout (Alpha channel) so the dynamic card gradient shows behind.
 */
export async function getPlayerCutout(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;

  // 1. Check in-memory cache first
  if (cutoutCache.has(imageUrl)) {
    return cutoutCache.get(imageUrl)!;
  }

  // 2. If already processing this image, return existing promise
  if (processingPromises.has(imageUrl)) {
    return processingPromises.get(imageUrl)!;
  }

  // 3. Process via @imgly/background-removal for true alpha channel transparency
  const processPromise = (async () => {
    try {
      // 15-second fail-safe timeout
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Background removal processing timed out')), 15000)
      );

      const removalPromise = (async () => {
        const imageBlob = await removeBackground(imageUrl, config);
        const transparentImageUrl = URL.createObjectURL(imageBlob);
        return transparentImageUrl;
      })();

      const resultUrl = await Promise.race([removalPromise, timeoutPromise]);
      if (resultUrl) {
        cutoutCache.set(imageUrl, resultUrl);
        return resultUrl;
      }
      return null;
    } catch (error) {
      console.error('Background removal failed:', error);
      return null;
    } finally {
      processingPromises.delete(imageUrl);
    }
  })();

  processingPromises.set(imageUrl, processPromise);
  return processPromise;
}
