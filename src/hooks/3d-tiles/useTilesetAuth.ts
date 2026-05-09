import { useState, useEffect, useRef, useMemo } from 'react';

interface UseTilesetAuthProps {
  assetId: string;
  ionToken: string;
  onLoad?: () => void;
}

/**
 * Hook to handle Cesium Ion pre-fetch authentication.
 */
export const useTilesetAuth = ({
  assetId,
  ionToken,
  onLoad,
}: UseTilesetAuthProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const loadingResolved = useRef(false);

  useEffect(() => {
    setUrl(null);
    setToken(null);
    loadingResolved.current = false;
  }, [assetId, ionToken]);

  useEffect(() => {
    if (url || isFetching) return;

    setIsFetching(true);
    console.log(`[useTilesetAuth] Pre-fetching Auth: ${assetId}`);

    const fetchEndpoint = async () => {
      try {
        const response = await fetch(
          `https://api.cesium.com/v1/assets/${assetId}/endpoint?access_token=${ionToken}`,
        );
        if (!response.ok)
          throw new Error(`Cesium API error: ${response.status}`);
        const data = await response.json();
        if (data) {
          setToken(`Bearer ${data.accessToken}`);
          setUrl(data.url);
          console.log(`[useTilesetAuth] Auth ready for Headers.`);
        }
      } catch (err) {
        console.error('[useTilesetAuth] Auth failed:', err);
        setIsFetching(false);
      } finally {
        setIsFetching(false);
      }
    };

    fetchEndpoint();

    const timer = setTimeout(() => {
      if (!loadingResolved.current) {
        if (onLoad) onLoad();
        loadingResolved.current = true;
      }
    }, 15000);

    return () => {
      clearTimeout(timer);
    };
  }, [assetId, ionToken, url, isFetching, onLoad]);

  const fetchOptions = useMemo(() => {
    if (!token) return undefined;
    return {
      headers: { Authorization: token },
    };
  }, [token]);

  const handleLoad = () => {
    if (!loadingResolved.current) {
      if (onLoad) onLoad();
      loadingResolved.current = true;
    }
  };

  return {
    url,
    token,
    fetchOptions,
    handleLoad,
  };
};
