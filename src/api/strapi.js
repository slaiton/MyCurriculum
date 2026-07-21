const STRAPI_URL = process.env.REACT_APP_STRAPI_URL;
const STRAPI_TOKEN = process.env.REACT_APP_STRAPI_TOKEN;

const normalizeItem = (item) => {
  if (item && item.attributes) {
    return { id: item.id, ...item.attributes };
  }
  return item;
};

export const strapiGet = async (endpoint) => {
  const headers = { 'Content-Type': 'application/json' };
  if (STRAPI_TOKEN) headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;

  const res = await fetch(`${STRAPI_URL}/api/${endpoint}`, { headers });
  if (!res.ok) throw new Error(`Strapi ${res.status}`);

  const json = await res.json();

  if (Array.isArray(json.data)) return json.data.map(normalizeItem);
  return normalizeItem(json.data);
};

export const isStrapiEnabled = () => !!STRAPI_URL;
