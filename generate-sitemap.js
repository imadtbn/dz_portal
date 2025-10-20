/**
 * dz_portal Sitemap Generator
 * توليد تلقائي لملف sitemap.xml متوافق مع Google و Bing
 */

const fs = require('fs');
const path = require('path');

// الإعدادات العامة
const BASE_URL = 'https://imadtbn.github.io/dz_portal';
const ROOT_DIR = path.join(__dirname, '.');
const OUTPUT_FILE = path.join(ROOT_DIR, 'sitemap.xml');

// دالة لاسترجاع كل ملفات HTML داخل المشروع
function getHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  let urls = [];

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      urls = urls.concat(getHtmlFiles(fullPath)); // بحث عميق
    } else if (file.endsWith('.html') && !file.startsWith('error')) {
      const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');
      urls.push({
        loc: `${BASE_URL}/${relPath}`,
        lastmod: stats.mtime.toISOString().split('T')[0],
      });
    }
  });

  return urls;
}

// توليد ملف sitemap.xml
function generateSitemap() {
  const urls = getHtmlFiles(ROOT_DIR);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.loc.includes('index.html') ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
</urlset>`;

  fs.writeFileSync(OUTPUT_FILE, xml.trim());
  console.log(`✅ Sitemap generated successfully: ${OUTPUT_FILE}`);
}

// تنفيذ
generateSitemap();
