let allData = { headers: [], rows: [] }, filteredData = [], currentPage = 1;
const ROWS_PER_PAGE = 50;

window.onload = async () => {
    const actionBar = `<input type="text" id="searchBox" placeholder="Search branches or seat types..." style="flex-grow:1;"><button class="btn-success" onclick="openAddVacancy()">+ Add Vacancy Data</button><button id="syncBtn">↻ Sync Database</button>`;
    loadMasterLayout('Vacancy Stats', 'vacancy', actionBar);
    document.getElementById('syncBtn').addEventListener('click', fetchData);
    document.getElementById('searchBox').addEventListener('input', handleSearch);
    await fetchData();
};

async function fetchData() {
    document.getElementById('results').innerHTML = '<p>Loading database...</p>';
    try {
        const data = await callAPI('getVacancyData');
        if (!data || data.length <= 1) { document.getElementById('results').innerHTML = '<p>No data.</p>'; return; }
        allData.headers = data.shift(); allData.rows = data; handleSearch();
    } catch (e) { document.getElementById('results').innerHTML = `<p style="color:red; font-weight:bold;">Error: ${e.message}</p>`; }
}

function handleSearch() {
    const q = document.getElementById('searchBox').value.toLowerCase();
    filteredData = allData.rows.filter(r => r.some(cell => (cell||'').toString().toLowerCase().includes(q)));
    currentPage = 1; renderTable();
}

// ... existing vacancy.js ...
function renderTable() {
    const data = filteredData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
    if(data.length === 0) return document.getElementById('results').innerHTML = '<p>No records found.</p>';
    let html = '<div style="overflow-x:auto;"><table><tr><th>Sr No</th>';
    allData.headers.forEach(h => html += `<th>${h}</th>`); html += '</tr>';
    data.forEach((row, idx) => {
        html += `<tr><td>${(currentPage - 1) * ROWS_PER_PAGE + idx + 1}</td>`; 
        row.forEach((cell, i) => { 
            if(i === 3) html += `<td><strong style="color:var(--primary); font-size:1.1em;">${cell}</strong></td>`; // Changed index because Quota was added
            else if(i === 1) html += `<td><span class="badge" style="background:#fef3c7; color:#b45309;">${cell}</span></td>`; // Quota badge
            else html += `<td>${cell}</td>`; 
        });
        html += '</tr>'; 
    });
    document.getElementById('results').innerHTML = html + '</table></div>'; renderPagination(filteredData.length);
}

function openAddVacancy() {
    let html = `<div style="background:#f8fafc; padding:20px; border-radius:8px; border:1px solid var(--border); margin-bottom:20px;"><div style="display:flex; justify-content:space-between; align-items:center;"><h4 style="margin:0;">Add Vacancy</h4><button class="btn-danger" style="margin:0;" onclick="document.getElementById('actionModalVacancy').innerHTML=''">Cancel</button></div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:15px; margin:1.5rem 0;">
            <div><label style="display:block; font-weight:600; margin-bottom:0.5rem;">Branch Name</label><input type="text" id="newVacBranch"></div>
            <div><label style="display:block; font-weight:600; margin-bottom:0.5rem;">Quota</label><select id="newVacQuota"><option value="ACAP">ACAP</option><option value="Institute Level">Institute Level</option></select></div>
            <div><label style="display:block; font-weight:600; margin-bottom:0.5rem;">Seat Type</label><input type="text" id="newVacSeatType"></div>
            <div><label style="display:block; font-weight:600; margin-bottom:0.5rem;">Available Seats</label><input type="number" id="newVacCount" min="0"></div>
        </div>
        <button class="btn-success" style="width:100%; padding:12px;" onclick="submitNewVacancy(event)">Save</button></div>`;
    document.getElementById('actionModalVacancy').innerHTML = html; window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function submitNewVacancy(event) {
    let b = document.getElementById('newVacBranch').value, q = document.getElementById('newVacQuota').value, st = document.getElementById('newVacSeatType').value.toUpperCase(), c = document.getElementById('newVacCount').value;
    if(!b || !st || !c) return alert("Fill out all fields.");
    event.target.innerText = 'Saving...'; event.target.disabled = true;
    try { await callAPI('addVacancy', { branch: b, quota: q, seatType: st, count: c }); alert("Added!"); document.getElementById('actionModalVacancy').innerHTML = ''; await fetchData(); } 
    catch (err) { alert("Error: " + err.message); event.target.innerText = 'Save'; event.target.disabled = false; }
}





function renderPagination(total) {
    const tPages = Math.ceil(total / ROWS_PER_PAGE); const cId = 'pagination';
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
function changePage(p) { currentPage = p; renderTable(); }
