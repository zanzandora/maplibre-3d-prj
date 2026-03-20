/**
 * Simple registry to track loaded 3D assets and avoid redundant network requests.
 */
const assetRegistry = new Set();

/**
 * Logs the cache status of an asset.
 * @param url The URL of the asset being accessed.
 */
export const trackAssetCache = (url) => {
  if (assetRegistry.has(url)) {
    console.log(
      `%c📦 [Asset Cache] HIT: ${url}`,
      "color: #4CAF50; font-weight: bold;",
    );
    return true;
  } else {
    console.log(
      `%c🌐 [Asset Cache] MISS (First Load): ${url}`,
      "color: #2196F3; font-weight: bold;",
    );
    assetRegistry.add(url);
    return false;
  }
};
