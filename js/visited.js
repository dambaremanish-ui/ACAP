let allVisited = { headers: [], rows: [] }, filteredVisited = [], currentPage = 1;
const ROWS_PER_PAGE = 50; let sortCol = 5, sortAsc = true; // Default sort by Index 5 (Merit No)

window.onload = async () => {
    const actionBar = `
        <div style="display:flex; gap:10px; width:100%;">
            <input type="text" id="visitedSearchBox" placeholder="Search visited students..." style="flex-grow:1;"><button id="syncBtn">↻ Sync</button>
        </div>
        <div class="filter-grid" id="advancedFilters" style="width:100%; margin-top:15px; margin-bottom:0;">
            <select id="filterQuota"><option value="">All Quotas</option></select><select id="filterStatus"><option value="">All Statuses</option></select>
            <div class="score-range"><input type="number" id="minCET" placeholder="Min CET"><input type="number" id="maxCET" placeholder="Max CET"></div>
        </div>`;
    loadMasterLayout('Visited List', 'visited', actionBar);
    document.getElementById('syncBtn').addEventListener('click', fetchVisitedData);
    ['visitedSearchBox', 'filterQuota', 'filterStatus', 'minCET', 'maxCET'].forEach(id => { document.getElementById(id).addEventListener('input', handleVisitedSearch); });
    await fetchVisitedData();
};

async function fetchVisitedData() {
    document.getElementById('visitedResults').innerHTML = '<p>Loading Visited Database...</p>';
    try {
        const data = await callAPI('getVisitedData');
        if (!data.rows || data.rows.length <= 1) { document.getElementById('visitedResults').innerHTML = '<p>No data.</p>'; return; }
        let headers = data.rows.shift();
        
        allVisited = { headers: headers, rows: data.rows };
        populateAdvancedFilters(data.rows); handleVisitedSearch();
    } catch (e) { document.getElementById('visitedResults').innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}

function populateAdvancedFilters(data) {
    const getUnq = (idx) => [...new Set(data.map(r => r[idx]).filter(v => v && v.toString().trim()!==""))].sort();
    const fillSel = (id, opts, def) => { const el = document.getElementById(id); const curr = el.value; el.innerHTML = `<option value="">${def}</option>` + opts.map(o => `<option value="${o}">${o}</option>`).join(''); el.value = curr || ""; };
    fillSel('filterQuota', getUnq(47), 'All Quotas'); fillSel('filterStatus', getUnq(49), 'All Statuses'); 
}

function handleVisitedSearch() {
    const q = document.getElementById('visitedSearchBox').value.toLowerCase(), quota = document.getElementById('filterQuota').value, status = document.getElementById('filterStatus').value;
    const minC = parseFloat(document.getElementById('minCET').value) || -Infinity, maxC = parseFloat(document.getElementById('maxCET').value) || Infinity;
    filteredVisited = allVisited.rows.filter(r => {
        let cet = parseFloat(r[19]) || 0;
        return (r[2]||'').toString().toLowerCase().includes(q) && (!quota || r[47]===quota) && (!status || r[49]===status) && (cet >= minC && cet <= maxC);
    });
    currentPage = 1; sortVisitedData(); renderVisitedTable();
}

function setSort(idx) { if (sortCol === idx) sortAsc = !sortAsc; else { sortCol = idx; sortAsc = true; } sortVisitedData(); renderVisitedTable(); }
function sortVisitedData() {
    if(sortCol === -1) return;
    filteredVisited.sort((a, b) => {
        let vA = a[sortCol], vB = b[sortCol];
        if (vA !== "" && vB !== "" && !isNaN(vA) && !isNaN(vB)) { vA = Number(vA); vB = Number(vB); } else { vA = vA ? vA.toString().toLowerCase() : ''; vB = vB ? vB.toString().toLowerCase() : ''; }
        if(vA < vB) return sortAsc ? -1 : 1; if(vA > vB) return sortAsc ? 1 : -1; return 0;
    });
}

function renderVisitedTable() {
    const data = filteredVisited.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
    if(data.length === 0) return document.getElementById('visitedResults').innerHTML = '<p>No records match criteria.</p>';

    // Now securely reading and sorting by Index 5 (Column F)
    let html = `<div style="overflow-x:auto;"><table><tr><th style="cursor:pointer;" onclick="setSort(5)">Merit No ${sortCol === 5 ? (sortAsc ? "↑" : "↓") : ""}</th>`;
    const displayCols = [1, 2, 9, 19, 47, 49]; 
    const colNames = {1:'App ID', 2:'Name', 9:'Seat Type', 19:'CET', 47:'Quota', 49:'Status'};
    
    displayCols.forEach(i => { html += `<th style="cursor:pointer;" onclick="setSort(${i})">${colNames[i]} ${sortCol === i ? (sortAsc ? "↑" : "↓") : ""}</th>`; });
    html += '<th>Actions</th></tr>';

    data.forEach((row, idx) => {
        html += `<tr><td><strong>${row[5] || '-'}</strong></td>`; 
        displayCols.forEach(i => {
           if(i===2) html += `<td><b>${row[i]}</b></td>`; else if (i===9 || i===47) html += `<td><span class="badge">${row[i]}</span></td>`; else if (i===49) html += `<td><b>${row[i]}</b></td>`; else html += `<td>${row[i] || '-'}</td>`;
        });
        const absoluteIndex = allVisited.rows.indexOf(row);
        html += `<td>`;
        if (row[49] === "Visited") {
            html += `<button style="padding:6px; margin-right:5px; font-size:0.8rem;" onclick="openEditForm(${absoluteIndex})">Edit</button><button class="btn-danger" style="padding:6px; margin-right:5px; font-size:0.8rem;" onclick="markNotInterested('${row[1]}')">Not Interested</button><button class="btn-success" style="padding:6px; font-size:0.8rem;" onclick="openAdmitForm('${row[1]}')">Admit</button>`;
        } else { html += `<span style="color:#6b7280; font-size:0.8rem;">Locked</span>`; }
        html += `</td></tr>`;
    });
    document.getElementById('visitedResults').innerHTML = html + '</table></div>'; renderPagination(filteredVisited.length);
}

// -- Not Interested Logic --
async function markNotInterested(appId) {
    let reason = prompt("Enter reason for not taking admission (Remark):");
    if(!reason) return;
    try { await callAPI('markNotInterested', { appId: appId, remark: reason }); alert('Status Updated!'); await fetchVisitedData(); } 
    catch (err) { alert("Error: " + err.message); }
}

async function openAdmitForm(appId) {
    const student = allVisited.rows.find(r => r[1] === appId);
    document.getElementById('actionModalVisited').innerHTML = `<p style="padding:15px; color:var(--primary);">Loading real-time vacancy...</p>`; window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const data = await callAPI('getAdmitOptions', { appId: appId });
        let html = `<div style="background:#f0fdf4; padding:20px; border-radius:8px; border:1px solid #bbf7d0; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0;">Admit: <span style="color:#166534">${data.name}</span> <span class="badge">${data.seatType}</span> <span class="badge">${data.quota}</span></h4>
                        <button class="btn-danger" style="margin:0;" onclick="document.getElementById('actionModalVisited').innerHTML=''">Cancel</button>
                    </div>`;
        if(data.options.length === 0) html += `<p style="color:red;">No preferences allocated!</p>`;
        else {
            data.options.forEach(opt => {
                if (opt.available > 0) html += `<label style="display:block; margin:8px 0; cursor:pointer;"><input type="radio" name="admitPref" value="${opt.pref}"> ${opt.pref} <span style="color:#059669; font-weight:bold;">(${opt.available} left in ${data.quota})</span></label>`;
                else html += `<label style="display:block; margin:8px 0; color:#9ca3af; text-decoration:line-through;"><input type="radio" disabled> ${opt.pref} <span style="color:#dc2626;">(0 left in ${data.quota})</span></label>`;
            });
            html += `<button class="btn-success" onclick="submitAdmit('${data.appId}', '${data.quota}', event)" style="margin-top:15px; width:100%; padding:12px;">Confirm & Admit</button>`;
        }
        document.getElementById('actionModalVisited').innerHTML = html + `</div>`;
    } catch (err) { document.getElementById('actionModalVisited').innerHTML = `<div style="background:#fee2e2; padding:15px; color:#b91c1c;">Error: ${err.message}</div>`; }
}

async function submitAdmit(appId, quota, e) {
    const radios = document.getElementsByName('admitPref'); let selected = null; 
    for(let r of radios) if(r.checked) selected = r.value;
    if(!selected) return alert("Select a preference.");
    e.target.innerText = 'Processing...'; e.target.disabled = true;
    try { await callAPI('admitStudent', { appId: appId, pref: selected, quota: quota }); alert('Admitted!'); document.getElementById('actionModalVisited').innerHTML = ''; await fetchVisitedData(); 
    } catch (err) { alert(err.message); e.target.innerText = 'Confirm & Admit'; e.target.disabled = false; }
}

function openEditForm(idx) {
    const student = allVisited.rows[idx];
    let html = `<div style="background:#f8fafc; padding:20px; border-radius:8px; border:1px solid var(--border); margin-bottom:20px;"><div style="display:flex; justify-content:space-between; align-items:center;"><h4 style="margin:0;">Edit Prefs: <span style="color:var(--primary)">${student[2]}</span></h4><button class="btn-danger" style="margin:0;" onclick="document.getElementById('actionModalVisited').innerHTML=''">Cancel</button></div><div class="pref-grid">`;
    for(let i=1; i<=7; i++) html += `<div><label style="display:block; font-weight:600; margin-bottom:0.5rem;">Pref ${i}</label><select id="edit_pref${i}" class="edit-select"></select></div>`;
    html += `</div><button onclick="submitEdit('${student[1]}', event)" style="width:100%; padding:12px;">Save Edited Preferences</button></div>`;
    document.getElementById('actionModalVisited').innerHTML = html;
    for(let i=1; i<=7; i++) { let sel = document.getElementById(`edit_pref${i}`); let currentVal = student[i+39] || ''; sel.innerHTML = `<option value="${currentVal}">${currentVal}</option>`; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function submitEdit(appId, e) {
    let prefs = []; if(!document.getElementById(`edit_pref1`).value) return alert('Preference 1 is required.');
    for(let i=1; i<=7; i++) prefs.push(document.getElementById(`edit_pref${i}`).value || "");
    e.target.innerText = 'Updating...'; e.target.disabled = true;
    try { await callAPI('editPrefs', { appId: appId, prefs: prefs }); alert('Updated!'); document.getElementById('actionModalVisited').innerHTML = ''; await fetchVisitedData(); } 
    catch (err) { alert("Update failed: " + err.message); e.target.innerText = 'Save Edited Preferences'; e.target.disabled = false; }
}

function renderPagination(total) {
    const tPages = Math.ceil(total / ROWS_PER_PAGE); const cId = 'visitedPagination'; if(tPages <= 1) return document.getElementById(cId).innerHTML = '';
    let html = '', start = Math.max(1, currentPage - 2), end = Math.min(tPages, currentPage + 2);
    if(currentPage > 1) html += `<button style="background:white; color:var(--text); border:1px solid var(--border);" onclick="changePage(1)">First</button>`;
    for(let i = start; i <= end; i++) html += `<button style="${i === currentPage ? 'background:var(--primary); color:white;' : 'background:white; color:var(--text); border:1px solid var(--border);'}" onclick="changePage(${i})">${i}</button>`;
    if(currentPage < tPages) html += `<button style="background:white; color:var(--text); border:1px solid var(--border);" onclick="changePage(${tPages})">Last</button>`;
    document.getElementById(cId).innerHTML = html;
}
function changePage(p) { currentPage = p; renderVisitedTable(); }
