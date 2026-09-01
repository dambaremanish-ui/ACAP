window.onload = async () => {
    buildNavigation('settings');
    await loadCurrentSettings();
};

async function loadCurrentSettings() {
    try {
        // We can piggyback off getSearchData just to grab the settings object quickly
        const data = await callAPI('getSearchData'); 
        const settings = data.settings || {};
        
        document.getElementById('setLimitDate').value = settings.limitDate || '';
        document.getElementById('setMinCET').value = settings.minCET || '';
        document.getElementById('setMaxCET').value = settings.maxCET || '';
        document.getElementById('setMaxMerit').value = settings.maxMerit || '';
        
        document.getElementById('statusMsg').innerText = "Settings loaded.";
        setTimeout(() => document.getElementById('statusMsg').innerText = '', 2000);
    } catch (e) {
        document.getElementById('statusMsg').innerHTML = `<span style="color:red;">Error loading settings: ${e.message}</span>`;
    }
}

async function saveSettings(e) {
    const s = { 
        limitDate: document.getElementById('setLimitDate').value, 
        minCET: document.getElementById('setMinCET').value, 
        maxCET: document.getElementById('setMaxCET').value, 
        maxMerit: document.getElementById('setMaxMerit').value 
    };
    
    const btn = e.target;
    btn.innerText = "Saving Limits..."; 
    btn.disabled = true;
    
    try {
        await callAPI('saveSettings', s);
        alert("Limits successfully saved and applied to system."); 
        btn.innerText = "Save Constraints"; 
        btn.disabled = false;
    } catch (err) {
        alert("Error saving limits: " + err.message);
        btn.innerText = "Save Constraints"; 
        btn.disabled = false;
    }
}
