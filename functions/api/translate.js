export async function onRequestPost(context) {
    try {
        const { request } = context;
        const { words, direction } = await request.json();

        if (!words || !Array.isArray(words)) {
            return new Response(JSON.stringify({ error: "Invalid word list provided." }), { status: 400 });
        }

        const dict = direction === 'iten' ? 'iten' : 'enit';

        const results = await Promise.all(words.map(async (word) => {
            if (!word.trim()) return null;
            
            const url = `https://www.wordreference.com/${dict}/${encodeURIComponent(word.trim())}`;

            try {
                const wrResponse = await fetch(url, {
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9,it;q=0.8",
        "Sec-Ch-Ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": "\"Windows\"",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
    }
});

if (!wrResponse.ok) return { word, translation: `Fetch error: ${wrResponse.status}` };

                if (!wrResponse.ok) return { word, translation: "Fetch error" };

                const html = await wrResponse.text();

                // Find all target cells instead of just the first one
                const regex = /<td class='ToWrd'[^>]*>([\s\S]*?)<\/td>/g;
                const matches = [...html.matchAll(regex)];

                let translation = "No direct translation found";

                for (const match of matches) {
                    let cleanText = match[1].replace(/<[^>]*>?/gm, '').trim();
                    cleanText = cleanText.replace(/\s+/g, ' '); 

                    // Skip the column headers to grab the first actual definition
                    if (cleanText && !['Italiano', 'English', 'Italian'].includes(cleanText)) {
                        translation = cleanText;
                        break; 
                    }
                }

                return { word, translation };

            } catch (e) {
                return { word, translation: "Error" };
            }
        }));

        const cleanResults = results.filter(r => r !== null);

        return new Response(JSON.stringify({ results: cleanResults }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}