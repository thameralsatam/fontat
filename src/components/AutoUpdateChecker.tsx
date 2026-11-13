import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobal } from '../contexts/GlobalContext';

/**
 * Extract asset URLs (/assets/*.js, /assets/*.css) from currently loaded document
 */
function getLoadedAssetUrls(): string[] {
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'))
    .map((s) => s.getAttribute('src'))
    .filter((src): src is string => typeof src === 'string' && src.includes('/assets/'));

  const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'))
    .map((l) => l.getAttribute('href'))
    .filter((href): href is string => typeof href === 'string' && href.includes('/assets/'));

  return [...scripts, ...links].sort();
}

/**
 * AutoUpdateChecker component:
 * - Checks for new deployments every 5 minutes and when the tab becomes visible again.
 * - Compares the asset hashes from a fresh `/index.html` with the ones currently loaded.
 * - Reloads only when it is safe: never while files are uploading and never while the user is in the Lab
 *   (unsaved edits / video export). A pending update is applied on the next navigation or when idle.
 * - A failed chunk import triggers at most one reload per minute (prevents reload loops).
 */
export function AutoUpdateChecker() {
  const location = useLocation();
  const { uploadQueue } = useGlobal();
  const busyRef = useRef(false);
  const updatePendingRef = useRef(false);
  const initialAssetsRef = useRef<string[] | null>(null);
  const isCheckingRef = useRef<boolean>(false);
  const hasReloadedRef = useRef<boolean>(false);

  // Capture initial loaded assets on mount
  useEffect(() => {
    initialAssetsRef.current = getLoadedAssetUrls();
  }, []);

  busyRef.current =
    location.pathname === '/lab' ||
    uploadQueue.some((task) => task.status === 'pending' || task.status === 'uploading');

  const applyUpdateIfSafe = () => {
    if (!updatePendingRef.current || busyRef.current || hasReloadedRef.current) return;
    hasReloadedRef.current = true;
    window.location.reload();
  };

  const checkForUpdate = async () => {
    if (isCheckingRef.current || hasReloadedRef.current) return;
    isCheckingRef.current = true;

    try {
      // Fetch /index.html with cache-busting timestamp and no-cache headers
      const response = await fetch(`/index.html?_v=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) return;

      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      const newScripts = Array.from(doc.querySelectorAll<HTMLScriptElement>('script[src]'))
        .map((s) => s.getAttribute('src'))
        .filter((src): src is string => typeof src === 'string' && src.includes('/assets/'));

      const newLinks = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'))
        .map((l) => l.getAttribute('href'))
        .filter((href): href is string => typeof href === 'string' && href.includes('/assets/'));

      const newAssets = [...newScripts, ...newLinks].sort();
      const currentAssets = initialAssetsRef.current || getLoadedAssetUrls();

      // If initialAssetsRef was empty (e.g. dev mode without /assets/ path), populate it
      if (currentAssets.length === 0 && newAssets.length > 0) {
        initialAssetsRef.current = newAssets;
        return;
      }

      // If we have asset lists and they differ, a new build was deployed
      if (currentAssets.length > 0 && newAssets.length > 0) {
        const isDifferent =
          newAssets.length !== currentAssets.length ||
          newAssets.some((asset, i) => asset !== currentAssets[i]);

        if (isDifferent) {
          updatePendingRef.current = true;
          applyUpdateIfSafe();
        }
      }
    } catch (error) {
      console.warn('[AutoUpdate] Failed to check for updates:', error);
    } finally {
      isCheckingRef.current = false;
    }
  };

  // 1. On navigation: apply a pending update if it is safe now (no network request here)
  useEffect(() => {
    applyUpdateIfSafe();
  }, [location.pathname, uploadQueue]);

  // 1b. Check when the tab becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // 2. Check every 5 minutes (300,000 ms)
  useEffect(() => {
    const FIVE_MINUTES = 5 * 60 * 1000;
    const intervalId = setInterval(() => {
      checkForUpdate().then(applyUpdateIfSafe);
    }, FIVE_MINUTES);

    return () => clearInterval(intervalId);
  }, []);

  // 3. Auto-recover from dynamic import / chunk missing errors
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const message =
        'reason' in event
          ? event.reason?.message || String(event.reason)
          : event.message || '';

      if (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes('Loading chunk')
      ) {
        let last = 0;
        try {
          last = Number(sessionStorage.getItem('fontat_chunk_reload') || 0);
        } catch {
          /* storage unavailable */
        }
        if (Date.now() - last < 60_000) return; // already reloaded recently: do not loop
        try {
          sessionStorage.setItem('fontat_chunk_reload', String(Date.now()));
        } catch {
          /* storage unavailable */
        }
        console.warn('[AutoUpdate] Chunk import error detected. Reloading to get new version...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  return null;
}
