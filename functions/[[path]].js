// Cloudflare Pages Function to inject Open Graph tags for articles
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  // Fetch the original static response (index.html or static assets)
  let response = await next();

  // Pass through static files (images, css, js, robots.txt) directly
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|css|js|txt|xml|ico)$/i)) {
    return response;
  }

  // Extract article slug from path (e.g., /2026-10-21-...) or query (?sak=...)
  let slug = url.searchParams.get("sak") || url.pathname.replace(/^\/+|\/+$/g, "");

  // If no article slug is present, return standard index.html
  if (!slug || slug === "index.html") {
    return response;
  }

  // If clean URL is accessed in browser without hash, serve index.html as base
  if (response.status === 404) {
    response = await context.env.ASSETS.fetch(new URL("/index.html", request.url));
  }

  try {
    // Fetch the raw markdown file from GitHub via jsDelivr CDN
    const mdUrl = `https://cdn.jsdelivr.net/gh/villmones/ibyn@main/content/artikler/${slug}.md`;
    const mdRes = await fetch(mdUrl);

    if (mdRes.ok) {
      const mdText = await mdRes.text();

      // Parse title, description, and image from Markdown frontmatter or content
      const titleMatch = mdText.match(/title:\s*["']?([^"'\r\n]+)["']?/i) || mdText.match(/^#\s+(.+)$/m);
      const descMatch = mdText.match(/(?:description|ingress|excerpt|summary):\s*["']?([^"'\r\n]+)["']?/i);
      const imgMatch = mdText.match(/(?:image|bilde|thumbnail):\s*["']?([^"'\r\n]+)["']?/i) || mdText.match(/!\[.*?\]\((.*?)\)/);

      const title = titleMatch ? titleMatch[1].trim() : "iByn.no – Mosjøen og Vefsn";
      const description = descMatch ? descMatch[1].trim() : "Uavhengig lokalavis og dokumentasjon for Mosjøen og Vefsn.";
      let image = imgMatch ? imgMatch[1].trim() : "https://www.ibyn.no/images/ibyn-logo.png";

      // Ensure image URL is absolute
      if (image && !image.startsWith("http")) {
        image = `https://www.ibyn.no/${image.replace(/^\/+/, "")}`;
      }

      let html = await response.text();

      // Replace existing Open Graph tags in index.html with article-specific tags
      html = html.replace(/<title>.*?<\/title>/i, `<title>${title} | iByn.no</title>`);
      html = html.replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:title" content="${title}">`);
      html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:description" content="${description}">`);
      html = html.replace(/<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image" content="${image}">`);
      html = html.replace(/<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:url" content="${url.href}">`);

      // Redirect browser visitors automatically to the #hash view so the article opens
      const redirectScript = `<script>if(!window.location.hash && "${slug}") { window.location.replace("/#${slug}"); }</script></head>`;
      html = html.replace(/<\/head>/i, redirectScript);

      return new Response(html, {
        status: 200,
        headers: { "content-type": "text/html;charset=UTF-8" }
      });
    }
  } catch (err) {
    // Ignore error and fall back to standard index.html
  }

  return response;
}
