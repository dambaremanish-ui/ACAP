let allApplied = { headers: [], rows: [] }, filteredApplied = [], currentPage = 1;
const ROWS_PER_PAGE = 50; let sortCol = -1, sortAsc = true;

window.onload = async () => {
    const actionBar = `
        <div style="display:flex; gap:10px; width:100%;">
            <input type="text" id="appliedSearchBox" placeholder="Search applied list..." style="flex-grow:1;">
            <button id="syncBtn">↻ Sync Database</button>
        </div>
        <div class="filter-grid" id="advancedFilters" style="width: 100%; margin-top: 15px; margin-bottom: 0;">
            <select id="filterGender"><option value="">All Genders</option></select>
            <select id="filterCategory"><option value="">All Categories</option></select>
            <select id="filterSeatType"><option value="">All Seat Types</option></select>
            <div class="score-range">
                <input type="number" id="minCET" placeholder="Min PCM CET">
                <input type="number" id="maxCET" placeholder="Max PCM CET">
            </div>
        </div>
    `;
    loadMasterLayout('Applied List', 'applied', actionBar);
    
    document.getElementById('syncBtn').addEventListener('click', fetchAppliedData);
    ['appliedSearchBox', 'filterGender', 'filterCategory', 'filterSeatType', 'minCET', 'maxCET'].forEach(id => {
        document.getElementById(id).addEventListener('input', handleAppliedSearch);
    });
    await fetchAppliedData();
};

async function fetchAppliedData() {
    document.getElementById('appliedResults').innerHTML = '<p>Loading database...</p>';
    try {
        const data = await callAPI('getAppliedData');
        if (!data.rows || data.rows.length <= 1) { document.getElementById('appliedResults').innerHTML = '<p>No data.</p>'; return; }
        let headers = data.rows.shift(); headers[47] = "State Merit"; headers[48] = "AI Merit";
        
        let meritCalc = data.rows.map((r, i) => ({ idx: i, cet: parseFloat(r[19]) || 0, maxScore: Math.max(parseFloat(r[19])||0, parseFloat(r[23])||0) }));
        meritCalc.sort((a,b) => b.cet - a.cet); meritCalc.forEach((item, rank) => data.rows[item.idx][47] = rank + 1);
        meritCalc.sort((a,b) => b.maxScore - a.maxScore); meritCalc.forEach((item, rank) => data.rows[item.idx][48] = rank + 1);

        allApplied = { headers: headers, rows: data.rows };
        populateAdvancedFilters(data.rows); handleAppliedSearch();
    } catch (e) { document.getElementById('appliedResults').innerHTML = `<p style="color:red; font-weight:bold;">Error: ${e.message}</p>`; }
}

function populateAdvancedFilters(data) {
    const getUnq = (idx) => [...new Set(data.map(r => r[idx]).filter(v => v && v.toString().trim()!==""))].sort();
    const fillSel = (id, opts, def) => { const el = document.getElementById(id); const curr = el.value; el.innerHTML = `<option value="">${def}</option>` + opts.map(o => `<option value="${o}">${o}</option>`).join(''); el.value = curr || ""; };
    fillSel('filterGender', getUnq(3), 'All Genders'); fillSel('filterCategory', getUnq(8), 'All Categories'); fillSel('filterSeatType', getUnq(9), 'All Seat Types');
}

function handleAppliedSearch() {
    const q = document.getElementById('appliedSearchBox').value.toLowerCase();
    const g = document.getElementById('filterGender').value, c = document.getElementById('filterCategory').value, st = document.getElementById('filterSeatType').value;
    const minC = parseFloat(document.getElementById('minCET').value) || -Infinity, maxC = parseFloat(document.getElementById('maxCET').value) || Infinity;

    filteredApplied = allApplied.rows.filter(r => {
        let cet = parseFloat(r[19]) || 0;
        return (r[2]||'').toString().toLowerCase().includes(q) && (!g || r[3]===g) && (!c || r[8]===c) && (!st || r[9]===st) && (cet >= minC && cet <= maxC);
    });
    currentPage = 1; document.getElementById('actionModalApplied').innerHTML = ''; sortAppliedData(); renderAppliedTable();
}

function setSort(idx) { if (sortCol === idx) sortAsc = !sortAsc; else { sortCol = idx; sortAsc = true; } sortAppliedData(); renderAppliedTable(); }
function sortAppliedData() {
    if(sortCol === -1) return;
    filteredApplied.sort((a, b) => {
        let vA = a[sortCol], vB = b[sortCol];
        if (vA !== "" && vB !== "" && !isNaN(vA) && !isNaN(vB)) { vA = Number(vA); vB = Number(vB); } 
        else { vA = vA ? vA.toString().toLowerCase() : ''; vB = vB ? vB.toString().toLowerCase() : ''; }
        if(vA < vB) return sortAsc ? -1 : 1; if(vA > vB) return sortAsc ? 1 : -1; return 0;
    });
}

function renderAppliedTable() {
    const data = filteredApplied.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
    if(data.length === 0) return document.getElementById('appliedResults').innerHTML = '<p>No records match criteria.</p>';

    let html = '<div style="overflow-x:auto;"><table><tr><th>Sr No</th>';
    const displayCols = [1, 2, 9, 19, 23, 47, 48]; 
    displayCols.forEach(i => { html += `<th style="cursor:pointer;" onclick="setSort(${i})">${allApplied.headers[i]}${sortCol === i ? (sortAsc ? ' &uarr;' : ' &darr;') : ''}</th>`; });
    for(let i=40; i<=46; i++) html += `<th>Pref ${i-39}</th>`;
    html += '<th>Actions</th></tr>';

    data.forEach((row, idx) => {
        html += `<tr><td>${(currentPage - 1) * ROWS_PER_PAGE + idx + 1}</td>`;
        displayCols.forEach(i => {
           if(i===2) html += `<td><b>${row[i]}</b></td>`; else if (i===9) html += `<td><span class="badge">${row[i]}</span></td>`; else html += `<td>${row[i] || '-'}</td>`;
        });
        for(let i=40; i<=46; i++) html += `<td>${row[i] || '-'}</td>`;
        const absoluteIndex = allApplied.rows.indexOf(row);
        html += `<td><button style="padding:6px; font-size:0.8rem;" onclick="openEditForm(${absoluteIndex})">Edit</button> <button class="btn-success" style="padding:6px; font-size:0.8rem;" onclick="openAdmitForm('${row[1]}')">Admit</button></td></tr>`;
    });
    document.getElementById('appliedResults').innerHTML = html + '</table></div>'; renderPagination(filteredApplied.length);
}

async function openAdmitForm(appId) {
    const student = allApplied.rows.find(r => r[1] === appId);
    document.getElementById('actionModalApplied').innerHTML = `<p style="padding:15px; color:var(--primary);">Loading servers...</p>`; window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const data = await callAPI('getAdmitOptions', { appId: appId });
        let html = `<div style="background:#f0fdf4; padding:20px; border-radius:8px; border:1px solid #bbf7d0; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0;">Admit: <span style="color:#166534">${data.name}</span> <span class="badge">${data.seatType}</span></h4>
                        <button class="btn-danger" style="margin:0;" onclick="document.getElementById('actionModalApplied').innerHTML=''">Cancel</button>
                    </div>
                    <div style="background:#fff; padding:10px; border-radius:6px; margin: 15px 0; border:1px solid #d1d5db;">
                        <b>State Merit:</b> ${student[47] || 'N/A'} &nbsp;|&nbsp; <b>AI Merit:</b> ${student[48] || 'N/A'}
                    </div>`;
        if(data.options.length === 0) html += `<p style="color:red;">No preferences allocated!</p>`;
        else {
            data.options.forEach(opt => {
                if (opt.available > 0) html += `<label style="display:block; margin:8px 0; cursor:pointer;"><input type="radio" name="admitPref" value="${opt.pref}"> ${opt.pref} <span style="color:#059669; font-weight:bold;">(${opt.available} left)</span></label>`;
                else html += `<label style="display:block; margin:8px 0; color:#9ca3af; text-decoration:line-through;"><input type="radio" disabled> ${opt.pref} <span style="color:#dc2626;">(0 left)</span></label>`;
            });
            html += `<button class="btn-success" onclick="submitAdmit('${data.appId}', event)" style="margin-top:15px; width:100%; padding:12px;">Confirm & Admit</button>`;
        }
        document.getElementById('actionModalApplied').innerHTML = html + `</div>`;
    } catch (err) { document.getElementById('actionModalApplied').innerHTML = `<div style="background:#fee2e2; padding:15px; color:#b91c1c;">Error: ${err.message}</div>`; }
}

async function submitAdmit(appId, e) {
    const radios = document.getElementsByName('admitPref'); let selected = null; 
    for(let r of radios) if(r.checked) selected = r.value;
    if(!selected) return alert("Select a preference.");
    e.target.innerText = 'Processing...'; e.target.disabled = true;
    try { await callAPI('admitStudent', { appId: appId, pref: selected }); alert('Admitted!'); document.getElementById('actionModalApplied').innerHTML = ''; await fetchAppliedData(); 
    } catch (err) { alert(err.message); e.target.innerText = 'Confirm & Admit'; e.target.disabled = false; }
}

function openEditForm(idx) {
    const student = allApplied.rows[idx];
    let html = `<div style="background:#f8fafc; padding:20px; border-radius:8px; border:1px solid var(--border); margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="margin:0;">Edit Prefs: <span style="color:var(--primary)">${student[2]}</span></h4>
                    <button class="btn-danger" style="margin:0;" onclick="document.getElementById('actionModalApplied').innerHTML=''">Cancel</button>
                </div>
                <div class="pref-grid">`;
    for(let i=1; i<=7; i++) html += `<div><label style="display:block; font-weight:600; margin-bottom:0.5rem;">Pref ${i}</label><select id="edit_pref${i}" class="edit-select"></select></div>`;
    html += `</div><button onclick="submitEdit('${student[1]}', event)" style="width:100%; padding:12px;">Save Edited Preferences</button></div>`;
    document.getElementById('actionModalApplied').innerHTML = html;
    for(let i=1; i<=7; i++) { 
        let sel = document.getElementById(`edit_pref${i}`); let currentVal = student[i+39] || '';
        sel.innerHTML = `<option value="${currentVal}">${currentVal}</option>`; 
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function submitEdit(appId, e) {
    let prefs = []; if(!document.getElementById(`edit_pref1`).value) return alert('Preference 1 is required.');
    for(let i=1; i<=7; i++) prefs.push(document.getElementById(`edit_pref${i}`).value || "");
    e.target.innerText = 'Updating...'; e.target.disabled = true;
    try { await callAPI('editPrefs', { appId: appId, prefs: prefs }); alert('Updated!'); document.getElementById('actionModalApplied').innerHTML = ''; await fetchAppliedData();
    } catch (err) { alert("Update failed: " + err.message); e.target.innerText = 'Save Edited Preferences'; e.target.disabled = false; }
}

function renderPagination(total) {
    const tPages = Math.ceil(total / ROWS_PER_PAGE); const cId = 'appliedPagination';
    if(tPages <= 1) return document.getElementById(cId).innerHTML = '';
    let html = '', start = Math.max(1, currentPage - 2), end = Math.min(tPages, currentPage + 2);
    if(currentPage > 1) html += `<button style="background:white; color:var(--text); border:1px solid var(--border);" onclick="changePage(1)">First</button>`;
    for(let i = start; i <= end; i++) {
        const activeStyle = i === currentPage ? 'background:var(--primary); color:white;' : 'background:white; color:var(--text); border:1px solid var(--border);';
        html += `<button style="${activeStyle}" onclick="changePage(${i})">${i}</button>`;
    }
    if(currentPage < tPages) html += `<button style="background:white; color:var(--text); border:1px solid var(--border);" onclick="changePage(${tPages})">Last</button>`;
    document.getElementById(cId).innerHTML = html;
}
function changePage(p) { currentPage = p; renderAppliedTable(); }
