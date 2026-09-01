let allData = { headers: [], rows: [] }, filteredData = [], currentPage = 1;
const ROWS_PER_PAGE = 50;

window.onload = async () => {
    const actionBar = `<input type="text" id="searchBox" placeholder="Search admitted students..." style="flex-grow:1;"><button id="syncBtn">↻ Sync Database</button>`;
    loadMasterLayout('Admitted', 'admitted', actionBar);
    document.getElementById('syncBtn').addEventListener('click', fetchData);
    document.getElementById('searchBox').addEventListener('input', handleSearch);
    await fetchData();
};

async function fetchData() {
    document.getElementById('results').innerHTML = '<p>Loading database...</p>';
    try {
        const data = await callAPI('getAdmittedData');
        if (!data || data.length <= 1) { document.getElementById('results').innerHTML = '<p>No data.</p>'; return; }
        allData.headers = data.shift(); allData.rows = data; handleSearch();
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

    let html = '<div style="overflow-x:auto;"><table><tr><th>Sr No</th>';
    const displayCols = [1, 2, 3, 9, 19]; displayCols.forEach(i => html += `<th>${allData.headers[i]}</th>`);
    html += `<th>${allData.headers[40]}</th><th>Actions</th></tr>`;
    
    data.forEach((row, idx) => {
        html += `<tr><td>${(currentPage - 1) * ROWS_PER_PAGE + idx + 1}</td>`; 
        displayCols.forEach(i => {
            if (i === 2) html += `<td><b>${row[i]}</b></td>`; else if (i === 9) html += `<td><span class="badge">${row[i]}</span></td>`; else html += `<td>${row[i] || '-'}</td>`;
        });
        html += `<td><span style="color:#059669; font-weight:bold;">${row[40]}</span></td>`;
        html += `<td><button class="btn-danger" style="padding:6px; font-size:0.8rem;" onclick="submitCancel('${row[1]}', event)">Cancel</button></td></tr>`; 
    });
    document.getElementById('results').innerHTML = html + '</table></div>'; renderPagination(filteredData.length);
}

async function submitCancel(appId, event) {
    if(!confirm("Cancel admission? It will revert to Applied.")) return;
    const btn = event.target; btn.innerText = 'Canceling...'; btn.disabled = true;
    try { await callAPI('cancelAdmission', { appId: appId }); alert("Canceled."); await fetchData();
    } catch (err) { alert("Error: " + err.message); btn.innerText = 'Cancel'; btn.disabled = false; }
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
