let allStudents = [];
let masterOptions = [];
let adminSettings = {};
let filteredStudents = [];
let currentPage = 1;
const ROWS_PER_PAGE = 50;
let sessionData = {};

window.onload = async () => {
    buildNavigation('search');
    sessionData = JSON.parse(sessionStorage.getItem('admission_session'));
    document.getElementById('syncBtn').addEventListener('click', fetchInitialData);
    document.getElementById('searchBox').addEventListener('input', handleSearch);
    await fetchInitialData();
};

async function fetchInitialData() {
    document.getElementById('results').innerHTML = '<p>Syncing securely from Google Servers...</p>';
    try {
        const data = await callAPI('getSearchData');
        allStudents = data.students || [];
        masterOptions = data.options || [];
        adminSettings = data.settings || {};
        handleSearch(); // Automatically applies filters and renders
    } catch (e) {
        document.getElementById('results').innerHTML = `<p style="color:#dc2626; font-weight:bold;">Error: ${e.message}</p>`;
    }
}

function generateSeatType(gender, category, candidatureType) {
    const cat = (category || '').toString().toUpperCase();
    const candType = (candidatureType || '').toString().toUpperCase();
    if (candType.includes('OMS') || (cat.includes('NOT APPLICABLE') && candType.includes('OMS'))) return 'OMS';

    const prefix = (gender && gender.toString().toLowerCase().startsWith('f')) ? 'L' : 'G';
    if (cat.includes('OBC')) return prefix + 'OBC';
    if (cat.includes('SC')) return prefix + 'SC';
    if (cat.includes('ST')) return prefix + 'ST';
    if (cat.includes('SBC')) return prefix + 'SBC';
    if (cat.includes('VJ') || cat.includes('DT')) return prefix + 'VJ';
    if (cat.includes('NT') && (cat.includes('1') || cat.includes('B'))) return prefix + 'NT1';
    if (cat.includes('NT') && (cat.includes('2') || cat.includes('C'))) return prefix + 'NT2';
    if (cat.includes('NT') && (cat.includes('3') || cat.includes('D'))) return prefix + 'NT3';
    if (cat.includes('OPEN')) return prefix + 'OPEN';
    return prefix + cat.replace(/[^A-Z0-9]/g, '');
}

function handleSearch() {
    const q = document.getElementById('searchBox').value.toLowerCase();
    
    // Limit Enforcement for Operator Role
    const enforceLimits = !sessionData.permissions.includes('settings');
    let limitDate = null, todayDate = null, minCET = null, maxCET = null;
    
    if (enforceLimits) {
        if (adminSettings.limitDate) {
            // FIX: Safely parse Google's ISO timestamp into YYYY-MM-DD
            const sd = new Date(adminSettings.limitDate);
            limitDate = sd.getFullYear() + '-' + String(sd.getMonth()+1).padStart(2,'0') + '-' + String(sd.getDate()).padStart(2,'0');
            
            const td = new Date();
            todayDate = td.getFullYear() + '-' + String(td.getMonth()+1).padStart(2,'0') + '-' + String(td.getDate()).padStart(2,'0');
        }
        minCET = adminSettings.minCET ? parseFloat(adminSettings.minCET) : null;
        maxCET = adminSettings.maxCET ? parseFloat(adminSettings.maxCET) : null;
    }

    filteredStudents = allStudents.filter(r => {
        if (enforceLimits) {
            if (limitDate && todayDate !== limitDate) return false;
            let cet = parseFloat(r[19]) || 0;
            if (minCET !== null && cet < minCET) return false;
            if (maxCET !== null && cet > maxCET) return false;
        }
        if (q && !(r[2]||'').toString().toLowerCase().includes(q)) return false;
        return true;
    });

    currentPage = 1;
    renderTable();
}

function renderTable() {
    const data = filteredStudents.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
    if(data.length === 0) {
        document.getElementById('results').innerHTML = '<p>No pending students found within your allowed constraints.</p>';
        document.getElementById('studentPagination').innerHTML = '';
        return;
    }
    
    let html = '<div style="overflow-x:auto;"><table><tr><th>Sr No</th><th>App ID</th><th>Name</th><th>Gender</th><th>Category</th><th>Seat Type</th><th>CET Score</th><th>JEE Score</th><th>Action</th></tr>';
    data.forEach((r, idx) => {
        const srNo = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
        const seatType = r[9] || generateSeatType(r[3], r[8], r[6]); 
        html += `<tr><td>${srNo}</td><td>${r[1]}</td><td><strong>${r[2]}</strong></td><td>${r[3]}</td><td>${r[8]}</td>
                 <td><span class="badge" style="background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:12px;">${seatType}</span></td>
                 <td>${r[19] || '-'}</td><td>${r[23] || '-'}</td>
                 <td><button onclick="openAllocation('${r[1]}')">Allocate</button></td></tr>`;
    });
    document.getElementById('results').innerHTML = html + '</table></div>';
    renderPagination(filteredStudents.length);
}

function openAllocation(appId) {
    const student = allStudents.find(r => r[1] === appId);
    if (!student) return;
    
    const autoSeatType = student[9] || generateSeatType(student[3], student[8], student[6]);
    
    let html = `<div style="background:#f8fafc; padding:20px; border-radius:8px; border:1px solid var(--border); margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h4 style="margin:0;">Allocate: <span style="color:var(--primary)">${student[2]}</span></h4>
                    <button style="background:#dc2626; margin:0;" onclick="document.getElementById('actionModal').innerHTML=''">Cancel</button>
                </div>
                
                <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap; background:#e0e7ff; padding:10px; border-radius:6px;">
                    <div style="flex-grow:1;"><label style="font-size:0.8rem; font-weight:bold;">Mobile No</label><input type="text" id="allocMobile" value="${student[4] || ''}"></div>
                    <div style="flex-grow:1;"><label style="font-size:0.8rem; font-weight:bold;">Email ID</label><input type="text" id="allocEmail" value="${student[5] || ''}"></div>
                    <div style="flex-grow:1;"><label style="font-size:0.8rem; font-weight:bold;">Seat Type <small>(Auto-Calc)</small></label><input type="text" id="allocSeatType" value="${autoSeatType}"></div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:15px; margin-bottom:1.5rem;">`;
                
    for(let i=1; i<=7; i++) {
        html += `<div style="margin-bottom:1rem;"><label style="display:block; font-size:0.875rem; font-weight:600; margin-bottom:0.5rem;">Pref ${i} ${i===1?'<span style="color:red">*</span>':''}</label>
                 <select id="pref${i}" class="alloc-select" onchange="updateDropdowns()"><option value="">-- Select --</option></select></div>`;
    }
    
    html += `</div><button onclick="submitAllocation('${appId}', event)" style="width:100%; padding:12px;">Confirm Details & Save to Applied</button></div>`;
    
    document.getElementById('actionModal').innerHTML = html; 
    updateDropdowns(); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateDropdowns() {
    const selects = document.querySelectorAll('.alloc-select');
    const selectedVals = Array.from(selects).map(s => s.value).filter(v => v !== "");
    
    selects.forEach(select => {
        const curr = select.value; 
        select.innerHTML = '<option value="">-- Select --</option>'; 
        masterOptions.forEach(opt => { 
            if (!selectedVals.includes(opt) || opt === curr) { 
                let el = document.createElement('option'); 
                el.value = opt; 
                el.text = opt; 
                if (opt === curr) el.selected = true; 
                select.appendChild(el); 
            }
        });
    });
}

async function submitAllocation(appId, e) {
    let prefs = []; 
    if(!document.getElementById('pref1').value) return alert('Preference 1 is required.');
    for(let i=1; i<=7; i++) prefs.push(document.getElementById(`pref${i}`).value || "");
    
    const student = allStudents.find(r => r[1] === appId);
    while(student.length < 40) student.push(""); 
    
    student[4] = document.getElementById('allocMobile').value;
    student[5] = document.getElementById('allocEmail').value;
    student[9] = document.getElementById('allocSeatType').value;

    e.target.innerText = 'Transmitting securely...'; 
    e.target.disabled = true;
    
    try {
        await callAPI('allocateStudent', { student: student, prefs: prefs });
        alert('Data transmitted. Student moved to Applied List.');
        document.getElementById('actionModal').innerHTML = '';
        await fetchInitialData();
    } catch (err) {
        alert("Error saving: " + err.message);
        e.target.innerText = 'Confirm Details & Save to Applied'; 
        e.target.disabled = false;
    }
}

function renderPagination(total) {
    const tPages = Math.ceil(total / ROWS_PER_PAGE); 
    const cId = 'studentPagination';
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
    renderTable();
}
