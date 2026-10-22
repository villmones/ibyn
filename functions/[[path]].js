// Safe Cloudflare Pages Function for Open Graph tags
export async function onRequest(context) {
    const url = new URL(context.request.url);
    const slug = url.pathname.replace(/^\/+|\/+$/g, '');

    // Ignore static pages like ai / ai.html so they are not treated as article slugs
    if (!slug || slug === 'ai' || slug === 'ai.html' || slug.includes('.')) {
        return context.next();
    }

  try {
    // 2. Fetch the base index.html directly from static assets
    const indexResponse = await env.ASSETS.fetch(new URL("/index.html", request.url));
    let html = await indexResponse.text();

    // 3. Fetch article markdown from jsDelivr CDN
    const mdUrl = `https://cdn.jsdelivr.net/gh/villmones/ibyn@main/content/artikler/${path}.md`;
    const mdRes = await fetch(mdUrl);

    if (mdRes.ok) {
      const mdText = await mdRes.text();

      // Extract metadata safely
      const titleMatch = mdText.match(/title:\s*["']?([^"'\r\n]+)["']?/i) || mdText.match(/^#\s+(.+)$/m);
      const descMatch = mdText.match(/(?:description|ingress|excerpt|summary):\s*["']?([^"'\r\n]+)["']?/i);
      const imgMatch = mdText.match(/(?:image|bilde|thumbnail):\s*["']?([^"'\r\n]+)["']?/i) || mdText.match(/!\[.*?\]\((.*?)\)/);

      const title = (titleMatch ? titleMatch[1].trim() : "iByn.no").replace(/"/g, "&quot;");
      const description = (descMatch ? descMatch[1].trim() : "Uavhengig faktabasert kanal for Mosjøen og Vefsn.").replace(/"/g, "&quot;");
      let image = imgMatch ? imgMatch[1].trim() : "https://www.ibyn.no/images/ibyn-logo.png";

      if (image && !image.startsWith("http")) {
        image = `https://www.ibyn.no/${image.replace(/^\/+/, "")}`;
      }

      // Inject Open Graph tags for Facebook scraper
      html = html.replace(/<title>.*?<\/title>/i, `<title>${title} | iByn.no</title>`);
      html = html.replace(/<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title}">`);
      html = html.replace(/<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${description}">`);
      html = html.replace(/<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${image}">`);
      html = html.replace(/<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${url.href}">`);
    }

    // Set hash cleanly in browser history without triggering a page reload loop
    const hashScript = `<script>if(!window.location.hash){window.location.hash="${path}";}</script></head>`;
    html = html.replace(/<\/head>/i, hashScript);

    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  } catch (e) {
    // Fallback to standard static response if anything fails
    return next();
  }
}
