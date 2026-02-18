const cache = new Map();

export async function loadTemplate(path, id) {
  const key = `${path}#${id}`;
  if (cache.has(key)) return cache.get(key);

  const res = await fetch(path);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const tpl = doc.getElementById(id);

  if (!tpl) {
    throw new Error(`Template ${id} no encontrado en ${path}`);
  }

  cache.set(key, tpl.innerHTML.trim());
  return cache.get(key);
}
