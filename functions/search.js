export async function onRequestPost(context) {
    try {
        const { query } = await context.request.json();
        const apiKey = context.env.GEMINI_API_KEY; // Hentastes trygt fra Cloudflare miljøvariabler

        // Kall Gemini API (eller Vertex AI med dokumentene dine)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Svar på følgende spørsmål basert på kildearkivet for styredokumenter (2018-2026): ${query}` }]
                }]
            })
        });

        const data = await response.json();
        const aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Beklager, fant ikke svar.';

        return new Response(JSON.stringify({ answer: aiAnswer }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
