export async function onRequestPost(context) {
    try {
        const { request } = context;
        const { words, direction } = await request.json();

        if (!words || !Array.isArray(words)) {
            return new Response(JSON.stringify({ error: "Invalid word list provided." }), { status: 400 });
        }

        const langpair = direction === 'iten' ? 'it|en' : 'en|it';
        
        // UPDATE THIS: MyMemory increases your rate limit if you provide an email
        const email = encodeURIComponent("your.email@example.com");

        const results = [];
        const chunkSize = 3; // Process 3 words at a time to prevent 429 burst limits

        for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize);
            
            const chunkPromises = chunk.map(async (word) => {
                if (!word.trim()) return null;
                
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word.trim())}&langpair=${langpair}&de=${email}`;

                try {
                    const apiResponse = await fetch(url);
                    if (!apiResponse.ok) return { word, translation: `API error: ${apiResponse.status}` };

                    const data = await apiResponse.json();
                    
                    if (data?.responseData?.translatedText) {
                        return { word, translation: data.responseData.translatedText };
                    } else {
                        return { word, translation: "No translation found" };
                    }
                } catch (e) {
                    return { word, translation: "Request failed" };
                }
            });

            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults.filter(r => r !== null));
            
            // Add a 300ms pause between chunks to let the API breathe
            if (i + chunkSize < words.length) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        return new Response(JSON.stringify({ results }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}