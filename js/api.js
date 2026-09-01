const API_URL = "https://script.google.com/macros/s/AKfycbzkZ5-hE8EYWxJ0s0JXMKfOYXSRey6TVeGShOR02mxJVwWCG-61AZibJRsvNosv8I-S/exec"; 

async function callAPI(action, data = {}) {
    const payloadObj = { action: action, data: data };
    const encodedPayload = encodeURIComponent(JSON.stringify(payloadObj));
    const finalUrl = `${API_URL}?payload=${encodedPayload}`;
    
    try {
        const response = await fetch(finalUrl, { method: 'GET' });
        const result = await response.json();
        
        if (result.status === 'success') return result.data;
        throw new Error(result.message);
    } catch (err) {
        console.error("API Error:", err);
        throw err;
    }
}

// Quick Test Execution
window.onload = async () => {
    try {
        const test = await callAPI('ping');
        console.log("System Status:", test);
    } catch (e) {
        console.error("Bridge failed:", e);
    }
};
