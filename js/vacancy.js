let allData = { headers: [], rows: [] };
let filteredData = [];
let currentPage = 1;
const ROWS_PER_PAGE = 50;

window.onload = async () => {
    buildNavigation('vacancy');
    document.getElementById('syncBtn').addEventListener('click', fetchData);
    document.getElementById('searchBox').addEventListener('input', handleSearch);
    await fetchData();
};

async function fetchData() {
    document.getElementById('results').innerHTML = '<p>Loading database...</p>';
    try {
        const data = await callAPI('getVacancyData');
        if (!data || data.length <= 1) { document.getElementById('results').innerHTML = '<p>No data yet.</p>'; return; }
        allData.headers = data.shift(); allData.rows = data;
        handleSearch();
    } catch (e) { document.getElementById('results').innerHTML = `<p style="color:red; font-weight:bold;">Error: ${e.message}</p>`; }
}

function handleSearch() {
    const q = document.getElementById('searchBox').value.toLowerCase();
    filteredData = allData.rows.filter(r => r.some(cell => (cell||'').toString().toLowerCase().includes(q)));
    currentPage = 1; renderTable();
}

function renderTable() {
    const data = filteredData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
    if(data.length === 0) return document.getElementById('results').innerHTML = '<p>No records found.</p>';

    let html = '<div style="overflow-x:auto;"><table><tr>';
    allData.headers.forEach(h => html += `<th>${h}</th>`); 
    html += '</tr>';
    
    data.forEach(row => {
        html += '<tr>'; 
        row.forEach((cell, i) => { 
            if(i === 2) html += `<td><strong style="color:var(--primary); font-size:1.1em;">${cell}</strong></td>`; 
            else html += `<td>${cell}</td>`; 
        });
        html += '</tr>'; 
    });
    
    document.getElementById('results').innerHTML = html + '</table></div>';
    renderPagination(filteredData.length);
}

function openAddVacancy() {
    let html = `<div style="background:#f8fafc; padding:20px; border-radius:8px; border:1px solid var(--border); margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h4 style="margin:0;">Add New Vacancy Record</h4>
            <button style="background:#dc2626; margin:0;" onclick="document.getElementById('actionModalVacancy').innerHTML=''">Cancel</button>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:15px; margin-bottom:1.5rem;">
            <div><label style="display:block; font-size:0.875rem; font-weight:600; margin-bottom:0.5rem;">Branch Name</label><input type="text" id="newVacBranch" placeholder="e.g. Computer Engineering"></div>
            <div><label style="display:block; font-size:0.875rem; font-weight:600; margin-bottom:0.5rem;">Seat Type</label><input type="text" id="newVacSeatType" placeholder="e.g. GOPEN, LOPEN"></div>
            <div><label style="display:block; font-size:0.875rem; font-weight:600; margin-bottom:0.5rem;">Available Seats</label><input type="number" id="newVacCount" min="0" placeholder="e.g. 5"></div>
        </div>
        <button style="background:#059669; width:100%; padding:12px;" onclick="submitNewVacancy(event)">Save Vacancy</button>
    </div>`;
    document.getElementById('actionModalVacancy').innerHTML = html; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function submitNewVacancy(event) {
    let branch = document.getElementById('newVacBranch').value;
    let seatType = document.getElementById('newVacSeatType').value.toUpperCase();
    let count = document.getElementById('newVacCount').value;
    
    if(!branch || !seatType || !count) return alert("Please fill out all fields.");
    
    const btn = event.target;
    btn.innerText = 'Saving...'; btn.disabled = true;
    
    try {
        await callAPI('addVacancy', { branch: branch, seatType: seatType, count: count });
        alert("Vacancy data added successfully!"); 
        document.getElementById('actionModalVacancy').innerHTML = ''; 
        await fetchData();
    } catch (err) {
        alert("Error: " + err.message);
        btn.innerText = 'Save Vacancy'; btn.disabled = false;
    }
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
