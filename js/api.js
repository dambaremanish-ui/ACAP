const API_URL = "https://script.google.com/macros/s/AKfycbzkZ5-hE8EYWxJ0s0JXMKfOYXSRey6TVeGShOR02mxJVwWCG-61AZibJRsvNosv8I-S/exec"; 

async function callAPI(action, data = {}) {
    let userRole = null;
    const sessionStr = sessionStorage.getItem('admission_session');
    if (sessionStr) userRole = JSON.parse(sessionStr).role;
    
    const payloadObj = { action: action, role: userRole, data: data };
    const encodedPayload = encodeURIComponent(JSON.stringify(payloadObj));
    const finalUrl = `${API_URL}?payload=${encodedPayload}`;
    
    try {
        // THE FIX: 'credentials: omit' forces an anonymous request, bypassing the Google multi-account bug
        const response = await fetch(finalUrl, { 
            method: 'GET',
            credentials: 'omit' 
        });
        
        const textResponse = await response.text(); 
        let result;
        try { 
            result = JSON.parse(textResponse); 
        } catch (e) {
            console.error("Server returned non-JSON response:", textResponse);
            throw new Error("Server returned an HTML page. Check your Apps Script deployment permissions.");
        }
        
        if (result.status === 'success') return result.data;
        throw new Error(result.message);
    } catch (err) { 
        console.error("API Error:", err); 
        throw err; 
    }
}
