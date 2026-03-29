import { query } from '../lib/db';

export async function getServerSideProps({ res }) {
  const baseUrl = 'https://uae-car-marketplace.vercel.app';

  try {
    const vehicles = await query(`
      SELECT id, updated_at FROM vehicles WHERE status = 'active'
    `).catch(() => []);

    const markets = await query(`
      SELECT id FROM markets WHERE status = 'active'
    `).catch(() => []);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${markets.map(m => `
  <url>
    <loc>${baseUrl}/market/${m.id}</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`).join('')}
  ${vehicles.map(v => `
  <url>
    <loc>${baseUrl}/vehicle/${v.id}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    res.write(sitemap);
    res.end();

    return { props: {} };
  } catch (error) {
    console.error('Sitemap error:', error);
    
    // Fallback sitemap if DB fails
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    res.write(fallbackSitemap);
    res.end();
    
    return { props: {} };
  }
}

export default function Sitemap() {
  return null;
}
