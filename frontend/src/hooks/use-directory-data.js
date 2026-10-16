import { useCallback, useEffect, useRef, useState } from 'react';

export function useDirectoryData(loader, token) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const loaderRef = useRef(loader);
  const request = useRef(0);

  useEffect(() => { loaderRef.current = loader; }, [loader]);

  const refresh = useCallback(async () => {
    const requestId = ++request.current;
    setLoading(true);
    setError('');
    try {
      const rows = await loaderRef.current();
      if (requestId === request.current) {
        setData(rows);
        setUpdatedAt(new Date());
      }
    } catch (failure) {
      if (requestId === request.current) setError(failure.message || 'Unable to load records.');
    } finally {
      if (requestId === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) refresh();
    return () => { request.current += 1; };
  }, [token, refresh]);

  return { data, setData, loading, error, updatedAt, refresh };
}
