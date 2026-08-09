import { useState, useEffect, useCallback, useRef } from 'react';

export function useDataFetch(fetchFn, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = options.maxRetries || 2;

  const execute = useCallback(async (isRefresh = false) => {
    if (!isRefresh && fetchedRef.current) return;
    if (!isRefresh) fetchedRef.current = true;

    try {
      setLoading(!isRefresh);
      const result = await fetchFn();
      setData(result);
      setError(null);
      retryCount.current = 0;
    } catch (err) {
      console.error('Fetch error:', err.message);
      
      // Only retry a few times
      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        setTimeout(() => execute(isRefresh), 2000 * retryCount.current);
        return;
      }
      
      setError(err.message || 'Failed to load data');
      
      // Only show toast on initial load, not refreshes
      if (!isRefresh && options.showToast !== false) {
        // Toast handled by the component
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, maxRetries]);

  useEffect(() => {
    execute();
    return () => {
      fetchedRef.current = false;
    };
  }, [execute]);

  const refresh = useCallback(() => {
    fetchedRef.current = false;
    return execute(true);
  }, [execute]);

  return { data, loading, error, refresh, setData };
}