export async function onRequestPost(context) {
    try {
        const { request } = context;
        const { words, direction } = await request.json();

        if (!words || !Array.isArray(words)) {
            return new Response(JSON.stringify({ error: "Invalid word list provided." }), { status: 400 });
        }

        // Set direction: 'enit' (English to Italian) or 'iten' (Italian to English)
        const dict = direction === 'iten' ? 'iten' : 'enit';

        // Fetch all translations concurrently for maximum speed
        const results = await Promise.all(words.map(async (word) => {
            if (!word.trim()) return null;
            
            const url = `https://www.wordreference.com/${dict}/${encodeURIComponent(word.trim())}`;

            try {
                // WordReference blocks obvious bots; a standard User-Agent is required
                const wrResponse = await fetch(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                });

                if (!wrResponse.ok) return { word, translation: "Fetch error" };

                const html = await wrResponse.text();

                // Regex to find the first translation target cell (<td class='ToWrd'>)
                // This is much faster than parsing the entire HTML DOM for an edge function
                const match = html.match(/<td class='ToWrd'[^>]*>([\s\S]*?)<\/td>/);

                if (match) {
                    // Strip inner HTML tags (like <em> or <a>) and clean up whitespace
                    let translation = match[1].replace(/<[^>]*>?/gm, '').trim();
                    translation = translation.replace(/\s+/g, ' '); 
                    return { word, translation };
                } else {
                    return { word, translation: "No direct translation found" };
                }

            } catch (e) {
                return { word, translation: "Error" };
            }
        }));

        // Filter out any blank lines that were mapped to null
        const cleanResults = results.filter(r => r !== null);

        return new Response(JSON.stringify({ results: cleanResults }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}