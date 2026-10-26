/**
 * Seeds the BOLD catalog (8 collections from mybold.com + launch products)
 * into the POS backend at pos-api.codmentor.com.
 *
 * Contract (discovered 2026-07-19): JSON bodies only; categories require a
 * slug; image_url is a plain string column — we store app-bundle asset paths
 * (assets/bold/...) which the storefront resolves locally.
 *
 * Usage:
 *   ADMIN_EMAIL=<username> ADMIN_PASSWORD=<password> node tools/seed/seed-bold-catalog.mjs
 */
const API = process.env.API_URL || 'https://pos-api.codmentor.com/api/v1';
const USERNAME = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars first.');
  process.exit(1);
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

const CATEGORIES = [
  { name: 'Foot Washer', description: 'The first of its kind in the world — the fully patented BOLD Foot Washer, conceived for every generation.', image_url: 'assets/bold/foot-washer.jpg' },
  { name: 'Mixer Collection', description: 'Bath mixers combining award-winning design with the finest materials and industry-leading technologies.', image_url: 'assets/bold/mixer.jpg' },
  { name: 'Sanitary Collection', description: 'Water closets and wash basins — single piece, coupled and wall mounted, with dual-flush technology.', image_url: 'assets/bold/sanitary.jpg' },
  { name: 'Shower Systems', description: 'Shower systems that combine industry-leading technologies for outstanding performance.', image_url: 'assets/bold/shower-systems.jpg' },
  { name: 'Kitchen Mixers', description: 'Kitchen faucets with a focus on design, material and everyday precision.', image_url: 'assets/bold/kitchen-mixers.jpg' },
  { name: 'Bidet Sprays - Shattaf', description: 'Handheld sprays for enhanced cleansing, finished to the Maison standard.', image_url: 'assets/bold/bidet.jpg' },
  { name: 'Plumbing Fittings', description: 'Angle valves, traps, hoses and drainers — the quiet essentials.', image_url: 'assets/bold/plumbing.jpg' },
  { name: 'Water Heaters', description: 'Electric water heaters with exclusive design and distinctive features.', image_url: 'assets/bold/water-heater.jpg' },
];

const PRODUCTS = [
  { name: 'Opale Vessel Basin - Stone Ivory', category: 'Sanitary Collection', selling_price: 18500, mrp: 21000, image_url: 'assets/bold/prod-opale-vessel-basin.jpg', description: 'Sculpted oval vessel basin in matte stone ivory, paired naturally with polished gold fittings.' },
  { name: 'Marbre Vessel Basin - Polished White', category: 'Sanitary Collection', selling_price: 16900, mrp: 19500, image_url: 'assets/bold/prod-marbre-vessel-basin.jpg', description: 'Soft-square vessel basin in polished marble-veined ceramic with gold waste.' },
  { name: 'Float Vanity Basin - Oak & Porcelain', category: 'Sanitary Collection', selling_price: 32500, mrp: 36000, image_url: 'assets/bold/prod-float-vanity-basin.jpg', description: 'Wall-hung oak vanity with wide porcelain basin and halo lighting.' },
  { name: 'Wave Counter Basin - Sand Matte', category: 'Sanitary Collection', selling_price: 21500, mrp: 24000, image_url: 'assets/bold/prod-wave-counter-basin.jpg', description: 'Low-profile wave basin in sand matte finish, composed for warm minimal schemes.' },
  { name: 'Atelier Double Basin - Porcelain & Oak', category: 'Sanitary Collection', selling_price: 38900, mrp: 42500, image_url: 'assets/bold/prod-atelier-double-basin.jpg', description: 'Wide double-width porcelain basin over a floating oak drawer unit.' },
  { name: 'Sovereign Tall Mixer - Polished Gold', category: 'Mixer Collection', selling_price: 12900, mrp: 14500, image_url: 'assets/bold/prod-sovereign-tall-mixer.jpg', description: 'Tall single-lever basin mixer in polished gold, square-cut silhouette.' },
  { name: 'Sovereign Mixer - Emerald Edition', category: 'Mixer Collection', selling_price: 13900, mrp: 15500, image_url: 'assets/bold/prod-sovereign-mixer-emerald.jpg', description: 'The Sovereign tall mixer, staged on green marble — polished gold, sculptural stance.' },
  { name: 'Cascade Basin Mixer - Gold', category: 'Mixer Collection', selling_price: 11500, mrp: 12900, image_url: 'assets/bold/prod-cascade-basin-mixer.jpg', description: 'Slender arc-spout basin mixer with wall-mounted control, polished gold.' },
];

async function api(token, method, ep, body) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${ep}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  const login = await api(null, 'POST', '/auth/login', { username: USERNAME, password: PASSWORD });
  const token = login.json?.data?.token || login.json?.token;
  if (!token) throw new Error(`Login failed: ${JSON.stringify(login.json).slice(0, 200)}`);
  console.log('Logged in.');

  const existing = await api(token, 'GET', '/categories?limit=200');
  const rows = existing.json?.data?.data || existing.json?.data || [];
  const catByName = new Map(rows.map((c) => [c.name.trim().toLowerCase(), c]));
  console.log(`Existing categories: ${catByName.size}`);

  let sort = catByName.size;
  for (const cat of CATEGORIES) {
    const key = cat.name.trim().toLowerCase();
    if (catByName.has(key)) {
      console.log(`= category exists, skipping: ${cat.name}`);
      continue;
    }
    const res = await api(token, 'POST', '/categories', {
      name: cat.name,
      slug: slugify(cat.name),
      description: cat.description,
      image_url: cat.image_url,
      is_active: 1,
      sort_order: ++sort,
    });
    console.log(`+ category ${cat.name}: ${res.status} ${res.ok ? 'ok' : JSON.stringify(res.json).slice(0, 200)}`);
    const created = res.json?.data;
    if (res.ok && created?.id) catByName.set(key, created);
  }

  const existingProducts = await api(token, 'GET', '/products?limit=200');
  const prodRows = existingProducts.json?.data?.data || existingProducts.json?.data || [];
  const prodNames = new Set(
    (Array.isArray(prodRows) ? prodRows : []).map((p) => p.name?.trim().toLowerCase()),
  );
  console.log(`Existing products: ${prodNames.size}`);

  for (const p of PRODUCTS) {
    if (prodNames.has(p.name.trim().toLowerCase())) {
      console.log(`= product exists, skipping: ${p.name}`);
      continue;
    }
    const cat = catByName.get(p.category.trim().toLowerCase());
    if (!cat) {
      console.log(`! no category for ${p.name} — skipping`);
      continue;
    }
    const res = await api(token, 'POST', '/products', {
      name: p.name,
      sku: slugify(p.name),
      description: p.description,
      category_id: cat.id,
      selling_price: p.selling_price,
      mrp: p.mrp,
      purchase_price: Math.round(p.selling_price * 0.6),
      tax_rate: 0,
      tax_included: 1,
      is_active: 1,
      is_service: 0,
      alert_quantity: 2,
      image_url: p.image_url,
    });
    console.log(`+ product ${p.name}: ${res.status} ${res.ok ? 'ok' : JSON.stringify(res.json).slice(0, 250)}`);
    const created = res.json?.data;
    if (res.ok && created?.id) {
      const stock = await api(token, 'POST', '/inventory/adjust', {
        product_id: created.id,
        store_id: created.store_id,
        quantity_change: 25,
        movement_type: 'adjustment',
        reason: 'Opening stock — BOLD catalog seed',
      });
      console.log(`  stock 25 -> ${stock.ok ? 'ok' : JSON.stringify(stock.json).slice(0, 120)}`);
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
