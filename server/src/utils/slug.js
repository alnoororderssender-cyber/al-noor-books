export function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Returns a slug that is unique in `Model`, adding -2, -3... when needed. */
export async function uniqueSlug(Model, name, excludeId = null) {
  const base = slugify(name) || 'item';
  let candidate = base;
  let n = 1;
  // Tiny catalogue (~20 products): a simple loop is fine.
  for (;;) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    // eslint-disable-next-line no-await-in-loop
    const exists = await Model.exists(query);
    if (!exists) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}
