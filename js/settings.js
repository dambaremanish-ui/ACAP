window.onload = async () => {
    loadMasterLayout('Limits & Constraints', 'settings', '');
    await loadCurrentSettings();
};

async function loadCurrentSettings() {
    try {
        const data = await callAPI('getSearchData'); 
        const settings = data.settings || {};
        
        // Settings come from sheet timestamp, parse it similarly to search
        if(settings.limitDate) {
            const sd = new Date(settings.limitDate);
            document.getElementById('setLimitDate').value = sd.getFullYear() + '-' + String(sd.getMonth()+1).padStart(2,'0') + '-' + String(sd.getDate()).padStart(2,'0');
        }
        document.getElementById('setMinCET').value = settings.minCET || '';
        document.getElementById('setMaxCET').value = settings.maxCET || '';
        document.getElementById('setMaxMerit').value = settings.maxMerit || '';
        
        document.getElementById('statusMsg').innerText = "Settings loaded.";
        setTimeout(() => document.getElementById('statusMsg').innerText = '', 2000);
    } catch (e) { document.getElementById('statusMsg').innerHTML = `<span style="color:red;">Error loading: ${e.message}</span>`; }
}

async function saveSettings(e) {
    const s = { limitDate: document.getElementById('setLimitDate').value, minCET: document.getElementById('setMinCET').value, maxCET: document.getElementById('setMaxCET').value, maxMerit: document.getElementById('setMaxMerit').value };
    const btn = e.target; btn.innerText = "Saving Limits..."; btn.disabled = true;
    try { await callAPI('saveSettings', s); alert("Limits saved."); btn.innerText = "Save Constraints"; btn.disabled = false;
    } catch (err) { alert("Error: " + err.message); btn.innerText = "Save Constraints"; btn.disabled = false; }
}
async function triggerMeritGeneration(e) {
    if (!confirm("This will permanently re-sort the database and lock Merit Numbers. Proceed?")) return;
    const btn = e.target; btn.innerText = "Processing Merit Logic (Please wait)..."; btn.disabled = true;
    try {
        const res = await callAPI('generateMerit');
        alert(res);
        btn.innerText = "⚡ Generate & Lock Global Merit"; btn.disabled = false;
    } catch (err) {
        alert("Error: " + err.message);
        btn.innerText = "⚡ Generate & Lock Global Merit"; btn.disabled = false;
    }
}
