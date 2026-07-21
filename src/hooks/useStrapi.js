import { useEffect, useState } from 'react';
import { strapiGet, isStrapiEnabled } from '../api/strapi';

const useStrapi = (endpoint) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isStrapiEnabled()) return;

    let cancelled = false;

    strapiGet(endpoint)
      .then((result) => { if (!cancelled) setData(result); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [endpoint]);

  return data;
};

export default useStrapi;
