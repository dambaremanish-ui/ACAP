let allApplied = { headers: [], rows: [] };
let filteredApplied = [];
let currentPage = 1;
const ROWS_PER_PAGE = 50;
let sortCol = -1;
let sortAsc = true;

window.onload = async () => {
    buildNavigation('applied');
    
    // Attach listeners
    document.getElementById('syncBtn').addEventListener('click', fetchAppliedData);
    document.getElementById('appliedSearchBox').addEventListener('input', handleAppliedSearch);
    ['filterGender', 'filterCategory', 'filterSeatType', 'minCET', 'maxCET'].forEach(id => {
        document.getElementById(id).addEventListener('input', handleAppliedSearch);
    });

    await fetchAppliedData();
};

async function fetchAppliedData() {
    document.getElementById('appliedResults').innerHTML = '<p>Loading database and calculating Merit...</p>';
    try {
        const data = await callAPI('getAppliedData');
        
        if (!data.rows || data.rows.length <= 1) {
            document.getElementById('appliedResults').innerHTML = '<p>No data yet.</p>';
            return;
        }

        let headers = data.rows.shift();
        headers[47] = "State Merit"; 
        headers[48] = "AI Merit";

        // Generate Merit Numbers
        let meritCalc = data.rows.map((r, i) => ({ 
            idx: i, 
            cet: parseFloat(r[19]) || 0, 
            maxScore: Math.max(parseFloat(r[19])||0, parseFloat(r[23])||0) 
        }));

        meritCalc.sort((a,b) => b.cet - a.cet);
        meritCalc.forEach((item, rank) => data.rows[item.idx][47] = rank + 1);

        meritCalc.sort((a,b) => b.maxScore - a.maxScore);
        meritCalc.forEach((item, rank) => data.rows[item.idx][48] = rank + 1);

        allApplied = { headers: headers, rows: data.rows };
        populateAdvancedFilters(data.rows);
        handleAppliedSearch();
    } catch (e) {
        document.getElementById('appliedResults').innerHTML = `<p style="color:red; font-weight:bold;">Error: ${e.message}</p>`;
    }
}

function populateAdvancedFilters(data) {
    const getUnq = (idx) => [...new Set(data.map(r => r[idx]).filter(v => v && v.toString().trim()!==""))].sort();
    
    const fillSel = (id, opts, def) => { 
        const el = document.getElementById(id);
        const curr = el.value; 
        el.innerHTML = `<option value="">${def}</option>` + opts.map(o => `<option value="${o}">${o}</option>`).join(''); 
        el.value = curr || ""; 
    };
    
    fillSel('filterGender', getUnq(3), 'All Genders'); 
    fillSel('filterCategory', getUnq(8), 'All Categories'); 
    fillSel('filterSeatType', getUnq(9), 'All Seat Types');
}

function handleAppliedSearch() {
    const q = document.getElementById('appliedSearchBox').value.toLowerCase();
    const g = document.getElementById('filterGender').value;
    const c = document.getElementById('filterCategory').value;
    const st = document.getElementById('filterSeatType').value;
    const minC = parseFloat(document.getElementById('minCET').value) || -Infinity;
    const maxC = parseFloat(document.getElementById('maxCET').value) || Infinity;

    filteredApplied = allApplied.rows.filter(r => {
        let cet = parseFloat(r[19]) || 0;
        return (r[2]||'').toString().toLowerCase().includes(q) && 
               (!g || r[3]===g) && 
               (!c || r[8]===c) && 
               (!st || r[9]===st) && 
               (cet >= minC && cet <= maxC);
    });

    currentPage = 1;
    document.getElementById('actionModalApplied').innerHTML = '';
    sortAppliedData();
    renderAppliedTable();
}

function setSort(idx) { 
    if (sortCol === idx) {
        sortAsc = !sortAsc;
    } else {
        sortCol = idx; 
        sortAsc = true; 
    }
    sortAppliedData(); 
    renderAppliedTable(); 
}

function sortAppliedData() {
    if(sortCol === -1) return;
    filteredApplied.sort((a, b) => {
        let vA = a[sortCol], vB = b[sortCol];
        if (vA !== "" && vB !== "" && !isNaN(vA) && !isNaN(vB)) { 
            vA = Number(vA); vB = Number(vB); 
        } else { 
            vA = vA ? vA.toString().toLowerCase() : ''; 
            vB = vB ? vB.toString().toLowerCase() : ''; 
        }
        if(vA < vB) return sortAsc ? -1 : 1; 
        if(vA > vB) return sortAsc ? 1 : -1; 
        return 0;
    });
}

function renderAppliedTable() {
    const data = filteredApplied.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
    if(data.length === 0) {
        document.getElementById('appliedResults').innerHTML = '<p>No records match your criteria.</p>';
        document.getElementById('appliedPagination').innerHTML = '';
        return;
    }

    let html = '<div style="overflow-x:auto;"><table><tr><th>Sr No</th>';
    
    const displayCols = [1, 2, 9, 19, 23, 47, 48]; 
    displayCols.forEach(i => {
        let arrow = sortCol === i ? (sortAsc ? ' &uarr;' : ' &darr;') : '';
        html += `<th style="cursor:pointer;" onclick="setSort(${i})">${allApplied.headers[i]}${arrow}</th>`;
    });
    for(let i=40; i<=46; i++) html += `<th>Pref ${i-39}</th>`;
    html += '<th>Actions</th></tr>';

    data.forEach((row, idx) => {
        const srNo = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
        html += `<tr><td>${srNo}</td>`;
        displayCols.forEach(i => {
           if(i===2) html += `<td><b>${row[i]}</b></td>`;
           else if (i===9) html += `<td><span class="badge">${row[i]}</span></td>`;
           else html += `<td>${row[i] || '-'}</td>`;
        });
        for(let i=40; i<=46; i++) html += `<td>${row[i] || '-'}</td>`;
        
        const absoluteIndex = allApplied.rows.indexOf(row);
        html += `<td>
                    <button style="background:var(--primary); padding:6px 12px; font-size:0.8rem;" onclick="openEditForm(${absoluteIndex})">Edit</button>
                    <button style="background:#059669; padding:6px 12px; font-size:0.8rem;" onclick="openAdmitForm('${row[1]}')">Admit</button>
                 </td></tr>`;
    });
    
    document.getElementById('appliedResults').innerHTML = html + '</table></div>';
    renderPagination(filteredApplied.length);
}

// --- ADMIT LOGIC ---
async function openAdmitForm(appId) {
    const student = allApplied.rows.find(r => r[1] === appId);
    document.getElementById('actionModalApplied').innerHTML = `<p style="padding:15px; font-weight:bold; color:var(--primary);">Loading real-time availability from servers...</p>`; 
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        const data = await callAPI('getAdmitOptions', { appId: appId });
        
        let html = `<div style="background:#f0fdf4; padding:20px; border-radius:8px; border:1px solid #bbf7d0; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0;">Admit: <span style="color:#166534">${data.name}</span> <span class="badge">${data.seatType}</span></h4>
                        <button style="background:#dc2626; margin:0;" onclick="document.getElementById('actionModalApplied').innerHTML=''">Cancel</button>
                    </div>
                    
                    <div style="background:#fff; padding:10px; border-radius:6px; margin: 15px 0; font-size:0.9rem; border:1px solid #d1d5db;">
                        <b>CET Score:</b> ${student[19] || 'N/A'} &nbsp;|&nbsp; <b>JEE Score:</b> ${student[23] || 'N/A'} <br>
                        <b>State Merit:</b> ${student[47] || 'N/A'} &nbsp;|&nbsp; <b>AI Merit:</b> ${student[48] || 'N/A'}
                    </div>
                    <p style="font-weight:600; margin-bottom:10px;">Select preference (Checking against exact Seat Type inventory):</p>`;
        
        if(data.options.length === 0) {
            html += `<p style="color:red;">No preferences allocated for this student!</p>`;
        } else {
            data.options.forEach(opt => {
                if (opt.available > 0) {
                    html += `<label style="display:block; margin:8px 0; cursor:pointer;"><input type="radio" name="admitPref" value="${opt.pref}"> ${opt.pref} <span style="color:#059669; font-weight:bold;">(${opt.available} seats remaining)</span></label>`;
                } else {
                    html += `<label style="display:block; margin:8px 0; color:#9ca3af; text-decoration:line-through;"><input type="radio" disabled> ${opt.pref} <span style="color:#dc2626; font-size:0.85em;">(0 seats left)</span></label>`;
                }
            });
            html += `<button onclick="submitAdmit('${data.appId}', event)" style="margin-top:15px; background:#059669; width:100%; padding:12px;">Confirm & Admit Student</button>`;
        }
        document.getElementById('actionModalApplied').innerHTML = html + `</div>`;
    } catch (err) {
        document.getElementById('actionModalApplied').innerHTML = `<div style="background:#fee2e2; padding:15px; border-radius:6px; color:#b91c1c;">Error: ${err.message}</div>`;
    }
}

async function submitAdmit(appId, e) {
    const radios = document.getElementsByName('admitPref');
    let selected = null; 
    for(let r of radios) if(r.checked) selected = r.value;
    
    if(!selected) return alert("You must select a preference to admit the student.");
    
    e.target.innerText = 'Processing Admission...'; 
    e.target.disabled = true;
    
    try {
        await callAPI('admitStudent', { appId: appId, pref: selected });
        alert('Student admitted successfully! Data secured.'); 
        document.getElementById('actionModalApplied').innerHTML = ''; 
        await fetchAppliedData(); 
    } catch (err) {
        alert(err.message); 
        e.target.innerText = 'Confirm & Admit Student'; 
        e.target.disabled = false;
    }
}

// --- EDIT PREFS LOGIC ---
function openEditForm(idx) {
    const student = allApplied.rows[idx];
    let html = `<div style="background:#f8fafc; padding:20px; border-radius:8px; border:1px solid var(--border); margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="margin:0;">Edit Prefs: <span style="color:var(--primary)">${student[2]}</span></h4>
                    <button style="background:#dc2626; margin:0;" onclick="document.getElementById('actionModalApplied').innerHTML=''">Cancel</button>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:15px; margin:1.5rem 0;">`;
                
    for(let i=1; i<=7; i++) {
        html += `<div><label style="display:block; font-size:0.875rem; font-weight:600; margin-bottom:0.5rem;">Pref ${i}</label>
                 <select id="edit_pref${i}" class="edit-select"></select></div>`;
    }
    
    html += `</div><button onclick="submitEdit('${student[1]}', event)" style="width:100%; padding:12px;">Save Edited Preferences</button></div>`;
    document.getElementById('actionModalApplied').innerHTML = html;
    
    // We need to fetch options from masterOptions or existing data to populate edits
    // For simplicity, we create options based on current values. 
    // Ideally, masterOptions is available globally. If not, we just allow typing or fetch it.
    // Assuming options are currently loaded via a standard dropdown logic:
    for(let i=1; i<=7; i++) { 
        let sel = document.getElementById(`edit_pref${i}`); 
        let currentVal = student[i+39] || '';
        sel.innerHTML = `<option value="${currentVal}">${currentVal}</option>`; 
        // In a fully integrated setup, you'd populate this with your full `masterOptions` array.
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function submitEdit(appId, e) {
    let prefs = []; 
    if(!document.getElementById(`edit_pref1`).value) return alert('Preference 1 is required.');
    for(let i=1; i<=7; i++) prefs.push(document.getElementById(`edit_pref${i}`).value || "");
    
    e.target.innerText = 'Updating...'; 
    e.target.disabled = true;
    
    try {
        await callAPI('editPrefs', { appId: appId, prefs: prefs });
        alert('Preferences updated successfully!'); 
        document.getElementById('actionModalApplied').innerHTML = ''; 
        await fetchAppliedData();
    } catch (err) {
        alert("Update failed: " + err.message);
        e.target.innerText = 'Save Edited Preferences'; 
        e.target.disabled = false;
    }
}

// --- PAGINATION ---
function renderPagination(total) {
    const tPages = Math.ceil(total / ROWS_PER_PAGE); 
    const cId = 'appliedPagination';
    if(tPages <= 1) return document.getElementById(cId).innerHTML = '';
    
    let html = '';
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(tPages, currentPage + 2);
    
    if(currentPage > 1) html += `<button style="background:white; color:var(--text); border:1px solid var(--border);" onclick="changePage(1)">First</button>`;
    for(let i = start; i <= end; i++) {
        const activeStyle = i === currentPage ? 'background:var(--primary); color:white;' : 'background:white; color:var(--text); border:1px solid var(--border);';
        html += `<button style="${activeStyle}" onclick="changePage(${i})">${i}</button>`;
    }
    if(currentPage < tPages) html += `<button style="background:white; color:var(--text); border:1px solid var(--border);" onclick="changePage(${tPages})">Last</button>`;
    
    document.getElementById(cId).innerHTML = html;
}

function changePage(p) {
    currentPage = p;
    renderAppliedTable();
}
