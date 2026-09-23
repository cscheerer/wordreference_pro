document.getElementById('translateBtn').addEventListener('click', async () => {
    const textInput = document.getElementById('wordList').value;
    const direction = document.getElementById('direction').value;
    const resultsTable = document.getElementById('resultsTable');
    const resultsBody = document.getElementById('resultsBody');
    const loading = document.getElementById('loading');

    // Split by newlines and remove empty lines
    const words = textInput.split('\n').map(w => w.trim()).filter(w => w.length > 0);

    if (words.length === 0) {
        alert("Please enter some words to translate.");
        return;
    }

    // UI Updates
    resultsTable.classList.add('hidden');
    loading.classList.remove('hidden');
    resultsBody.innerHTML = '';

    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ words, direction })
        });

        const data = await response.json();

        if (response.ok) {
            data.results.forEach(item => {
                const row = document.createElement('tr');
                
                const wordCell = document.createElement('td');
                wordCell.textContent = item.word;
                
                const transCell = document.createElement('td');
                transCell.textContent = item.translation;

                row.appendChild(wordCell);
                row.appendChild(transCell);
                resultsBody.appendChild(row);
            });
            resultsTable.classList.remove('hidden');
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (err) {
        alert(`Failed to connect to the scraping API: ${err.message}`);
    } finally {
        loading.classList.add('hidden');
    }
});