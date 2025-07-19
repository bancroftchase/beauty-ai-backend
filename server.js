async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;
    input.value = '';

    clearProducts();
    appendMessage('user', message);
    appendMessage('bot', 'Searching...');

    try {
        const response = await fetch(`${BACKEND_URL}/ask-claude`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: message })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        
        // Handle both direct array and {products: array} responses
        const products = Array.isArray(result) ? result : 
                        (result.products || []);
        
        if (products.length === 0) {
            throw new Error('No products found');
        }

        displayProducts(products);
        
    } catch (error) {
        console.error('Error:', error);
        updateLastBotMessage(`Error: ${error.message}`);
    }
}

function displayProducts(products) {
    const chatArea = document.getElementById('chatArea');
    updateLastBotMessage(`Found ${products.length} products:`);
    
    products.slice(0, PAGE_SIZE).forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-name">${p.name || 'Unnamed Product'}</div>
            <div class="product-price">${p.price || 'Price not available'}</div>
            <div>${p.description || ''}</div>
            ${p.country ? `<div class="product-country">${p.country}</div>` : ''}
            <button class="add-cart-btn" 
                    onclick="addToCart('${escapeHtml(p.name)}','${escapeHtml(p.price)}')">
                Add to Cart
            </button>
        `;
        chatArea.appendChild(card);
    });
    
    document.getElementById('showMoreBtn').style.display = 
        products.length > PAGE_SIZE ? 'block' : 'none';
    chatArea.scrollTop = chatArea.scrollHeight;
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
