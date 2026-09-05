let vacancyRows = [], masterOptions = [];
const QUOTAS = ['ACAP', 'Institute Level'];
const ALL_SEAT_TYPES = ['GOPEN', 'LOPEN', 'GOBC', 'LOBC', 'GSC', 'LSC', 'GST', 'LST', 'GSBC', 'LSBC', 'GVJ', 'LVJ', 'GNT1', 'LNT1', 'GNT2', 'LNT2', 'GNT3', 'LNT3', 'OMS'];

window.onload = async () => {
    const actionBar = `<button class="btn-success" onclick="openAddModal()">+ Add Vacancy</button><button id="syncBtn" onclick="fetchVacancyData()">↻ Sync</button>`;
    loadMasterLayout('Vacancy Management', 'vacancy', actionBar);
    await fetchVacancyData();
};

async function fetchVacancyData() {
    document.getElementById('results').innerHTML = '<p>Loading Vacancy Database...</p>';
    try {
        const data = await callAPI('getVacancyData');
        
        // Bulletproof Routing: Detect if API sent the new Object or the old Array
        let rawRows = [];
        if (Array.isArray(data)) {
            masterOptions = []; // Fallback if backend wasn't deployed as New Version
            rawRows = data;
        } else {
            masterOptions = data.options || [];
            rawRows = data.rows || [];
        }

        // Check if there is actual data (more than just the header row)
        if (rawRows.length <= 1) { 
            vacancyRows = []; 
            document.getElementById('results').innerHTML = '<p>No vacancy records found.</p>'; 
            return; 
        }

        rawRows.shift(); // Securely remove the header row
        vacancyRows = rawRows;
        renderVacancyTable();
    } catch (e) { 
        document.getElementById('results').innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; 
    }
}

function renderVacancyTable() {
    let html = `<div style="overflow-x:auto;"><table>
        <tr><th>Branch</th><th>Quota</th><th>Seat Type</th><th>Available Seats</th><th>Actions</th></tr>`;
        
    vacancyRows.forEach((r) => {
        html += `<tr>
            <td><strong>${r[0]}</strong></td>
            <td><span class="badge">${r[1]}</span></td>
            <td><span class="badge">${r[2]}</span></td>
            <td style="font-weight:bold; font-size:1.1em;">${r[3]}</td>
            <td><button onclick="openEditModal('${r[0]}', '${r[1]}', '${r[2]}', ${r[3]})">Edit</button></td>
        </tr>`;
    });
    
    document.getElementById('results').innerHTML = html + '</table></div>';
}

function openAddModal() {
    let html = `<div style="background:#f8fafc; padding:20px; border-radius:8px; border:1px solid var(--border); margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h4 style="margin:0;">Add Vacancy</h4>
            <button class="btn-danger" style="margin:0;" onclick="document.getElementById('actionModal').innerHTML=''">Cancel</button>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <div style="flex-grow:1;"><label style="font-weight:bold; font-size:0.8rem;">Quota</label>
                <select id="vacQuota" style="width:100%;" onchange="updateAddDropdowns()">
                    ${QUOTAS.map(q => `<option value="${q}">${q}</option>`).join('')}
                </select>
            </div>
            <div style="flex-grow:1;"><label style="font-weight:bold; font-size:0.8rem;">Branch</label>
                <select id="vacBranch" style="width:100%;" onchange="updateAddDropdowns()"></select>
            </div>
            <div style="flex-grow:1;"><label style="font-weight:bold; font-size:0.8rem;">Seat Type</label>
                <select id="vacSeatType" style="width:100%;"></select>
            </div>
            <div style="flex-grow:1;"><label style="font-weight:bold; font-size:0.8rem;">Seat Count</label>
                <input type="number" id="vacCount" style="width:100%;" min="0" value="0">
            </div>
        </div>
        <button class="btn-success" onclick="submitAddVacancy(event)" style="margin-top:15px; width:100%; padding:12px;">Save Vacancy</button>
    </div>`;
    
    document.getElementById('actionModal').innerHTML = html;
    updateAddDropdowns(); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateAddDropdowns() {
    const quota = document.getElementById('vacQuota').value;
    const branchSelect = document.getElementById('vacBranch');
    const seatSelect = document.getElementById('vacSeatType');
    
    let currentBranch = branchSelect.value;
    
    // Find branches that still have missing seat types for this quota
    const availableBranches = masterOptions.filter(b => {
        const addedSeats = vacancyRows.filter(r => r[0] === b && r[1] === quota).map(r => r[2]);
        return addedSeats.length < ALL_SEAT_TYPES.length;
    });

    branchSelect.innerHTML = '<option value="">-- Select Branch --</option>';
    availableBranches.forEach(b => {
        let el = document.createElement('option'); el.value = b; el.text = b;
        if(b === currentBranch) el.selected = true;
        branchSelect.appendChild(el);
    });
    
    currentBranch = branchSelect.value;
    seatSelect.innerHTML = '<option value="">-- Select Seat Type --</option>';
    
    if (currentBranch) {
        // Find seat types that haven't been added yet for this specific branch + quota
        const addedSeats = vacancyRows.filter(r => r[0] === currentBranch && r[1] === quota).map(r => r[2]);
        const availableSeats = ALL_SEAT_TYPES.filter(st => !addedSeats.includes(st));
        
        availableSeats.forEach(st => {
            let el = document.createElement('option'); el.value = st; el.text = st;
            seatSelect.appendChild(el);
        });
    }
}

async function submitAddVacancy(e) {
    const branch = document.getElementById('vacBranch').value;
    const quota = document.getElementById('vacQuota').value;
    const seatType = document.getElementById('vacSeatType').value;
    const count = document.getElementById('vacCount').value;

    if (!branch || !quota || !seatType || count === "") return alert("Please fill all required fields.");

    e.target.innerText = 'Saving...'; e.target.disabled = true;
    try {
        await callAPI('addVacancy', { branch: branch, quota: quota, seatType: seatType, count: count });
        alert('Vacancy Added Successfully!');
        document.getElementById('actionModal').innerHTML = '';
        await fetchVacancyData();
    } catch (err) {
        alert("Error: " + err.message);
        e.target.innerText = 'Save Vacancy'; e.target.disabled = false;
    }
}

function openEditModal(branch, quota, seatType, currentCount) {
    let html = `<div style="background:#e0e7ff; padding:20px; border-radius:8px; border:1px solid #c7d2fe; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h4 style="margin:0;">Edit Vacancy: <span style="color:var(--primary)">${branch} (${seatType})</span></h4>
            <button class="btn-danger" style="margin:0;" onclick="document.getElementById('actionModal').innerHTML=''">Cancel</button>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <div style="flex-grow:1;"><label style="font-weight:bold; font-size:0.8rem;">Quota</label><input type="text" value="${quota}" disabled style="background:#f1f5f9; width:100%;"></div>
            <div style="flex-grow:1;"><label style="font-weight:bold; font-size:0.8rem;">Vacancy Count</label><input type="number" id="editCount" min="0" value="${currentCount}" style="width:100%;"></div>
        </div>
        <button class="btn-success" onclick="submitEditVacancy('${branch}', '${quota}', '${seatType}', event)" style="margin-top:15px; width:100%; padding:12px;">Update Vacancy</button>
    </div>`;
    
    document.getElementById('actionModal').innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function submitEditVacancy(branch, quota, seatType, e) {
    const newCount = document.getElementById('editCount').value;
    if (newCount === "") return alert("Enter a valid count.");

    e.target.innerText = 'Updating...'; e.target.disabled = true;
    try {
        await callAPI('editVacancy', { branch: branch, quota: quota, seatType: seatType, count: newCount });
        alert('Vacancy Updated Successfully!');
        document.getElementById('actionModal').innerHTML = '';
        await fetchVacancyData();
    } catch (err) {
        alert("Error: " + err.message);
        e.target.innerText = 'Update Vacancy'; e.target.disabled = false;
    }
}
