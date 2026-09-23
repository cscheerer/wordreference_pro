export async function onRequestPost(context) {
    try {
        const { request } = context;
        const { words, direction } = await request.json();

        if (!words || !Array.isArray(words)) {
            return new Response(JSON.stringify({ error: "Invalid word list provided." }), { status: 400 });
        }

        // Convert the frontend direction string into MyMemory's required pipe-separated format
        const langpair = direction === 'iten' ? 'it|en' : 'en|it';

        const results = await Promise.all(words.map(async (word) => {
            if (!word.trim()) return null;
            
            // Build the MyMemory API GET request
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word.trim())}&langpair=${langpair}`;

            try {
                const apiResponse = await fetch(url);
                
                if (!apiResponse.ok) return { word, translation: `API error: ${apiResponse.status}` };

                const data = await apiResponse.json();
                
                // Extract the translated text directly from the API response
                if (data?.responseData?.translatedText) {
                    return { word, translation: data.responseData.translatedText };
                } else {
                    return { word, translation: "No translation found" };
                }

            } catch (e) {
                return { word, translation: "Request failed" };
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