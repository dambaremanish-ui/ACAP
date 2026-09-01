let allUsers = [];
let filteredUsers = [];

window.onload = async () => {
    buildNavigation('users');
    document.getElementById('syncBtn').addEventListener('click', fetchUsers);
    document.getElementById('searchBox').addEventListener('input', handleSearch);
    await fetchUsers();
};

async function fetchUsers() {
    document.getElementById('results').innerHTML = '<p>Loading database...</p>';
    try {
        allUsers = await callAPI('getUsersData');
        handleSearch();
    } catch (e) {
        document.getElementById('results').innerHTML = `<p style="color:red; font-weight:bold;">Error: ${e.message}</p>`;
    }
}

function handleSearch() {
    const q = document.getElementById('searchBox').value.toLowerCase();
    filteredUsers = allUsers.filter(r => r.username.toLowerCase().includes(q) || r.role.toLowerCase().includes(q));
    renderTable();
}

function renderTable() {
    if(filteredUsers.length === 0) return document.getElementById('results').innerHTML = '<p>No users found.</p>';

    let html = '<div style="overflow-x:auto;"><table><tr><th>Username</th><th>Password</th><th>Role Level</th><th>Allowed Tabs</th><th>Actions</th></tr>';
    
    filteredUsers.forEach(row => {
        html += `<tr>
            <td><b>${row.username}</b></td>
            <td>${row.password}</td>
            <td><span class="badge">${row.role}</span></td>
            <td><small>${row.permissions.join(', ')}</small></td>
            <td><button onclick="openUserModal('${row.username}')">Edit / Assign Tabs</button></td>
        </tr>`;
    });
    
    document.getElementById('results').innerHTML = html + '</table></div>';
}

function openUserModal(username = null) {
    let uData = { username: '', password: '', role: 'Level 3 - Operator', permissions: [] }; 
    let isEdit = false;
    
    if (username) { 
        let match = allUsers.find(r => r.username === username); 
        if(match) { uData = match; isEdit = true; } 
    }

    let html = `<div style="background:#f8fafc; padding:20px; border-radius:8px; border:1px solid var(--border); margin-bottom:20px; max-width:600px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h4 style="margin:0;">${isEdit ? 'Edit User' : 'Create New User'}</h4>
            <button style="background:#dc2626; margin:0;" onclick="document.getElementById('actionModalUsers').innerHTML=''">Cancel</button>
        </div>
        <div class="input-group"><label>Username</label><input type="text" id="mu_user" value="${uData.username}" ${isEdit ? 'disabled style="background:#eee;"' : ''}></div>
        <div class="input-group"><label>Password</label><input type="text" id="mu_pass" value="${uData.password}"></div>
        <div class="input-group">
            <label>Role Level Indicator</label>
            <select id="mu_role">
                <option value="Level 1 - Director" ${uData.role==='Level 1 - Director'?'selected':''}>Level 1 - Director</option>
                <option value="Level 2 - Manager" ${uData.role==='Level 2 - Manager'?'selected':''}>Level 2 - Manager</option>
                <option value="Level 3 - Operator" ${uData.role==='Level 3 - Operator'?'selected':''}>Level 3 - Operator</option>
            </select>
        </div>
        <label style="font-weight:bold; font-size:0.875rem; margin-top:10px; display:block; margin-bottom:5px;">Tab Access Permissions</label>
        <div class="checkbox-grid">
            <label><input type="checkbox" class="cb-perm" value="search" ${uData.permissions.includes('search')?'checked':''}> Search & Allocate</label>
            <label><input type="checkbox" class="cb-perm" value="applied" ${uData.permissions.includes('applied')?'checked':''}> Applied List</label>
            <label><input type="checkbox" class="cb-perm" value="admitted" ${uData.permissions.includes('admitted')?'checked':''}> Admitted</label>
            <label><input type="checkbox" class="cb-perm" value="logs" ${uData.permissions.includes('logs')?'checked':''}> Logs</label>
            <label><input type="checkbox" class="cb-perm" value="vacancy" ${uData.permissions.includes('vacancy')?'checked':''}> Vacancy Stats</label>
            <label><input type="checkbox" class="cb-perm" value="settings" ${uData.permissions.includes('settings')?'checked':''}> Settings & Limits</label>
            <label><input type="checkbox" class="cb-perm" value="users" ${uData.permissions.includes('users')?'checked':''}> User Management</label>
        </div>
        <div style="margin-top:15px; display:flex; justify-content:space-between;">
            <button style="background:#059669;" onclick="saveUserModal(event)">Save User Data</button>
            ${isEdit ? `<button style="background:#dc2626;" onclick="deleteUserModal('${uData.username}', event)">Delete User</button>` : ''}
        </div>
    </div>`;
    
    document.getElementById('actionModalUsers').innerHTML = html; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveUserModal(e) {
    let u = document.getElementById('mu_user').value.trim();
    let p = document.getElementById('mu_pass').value.trim();
    let r = document.getElementById('mu_role').value;
    
    if(!u || !p) return alert("Username and Password cannot be empty.");
    
    let perms = []; 
    document.querySelectorAll('.cb-perm:checked').forEach(cb => perms.push(cb.value));
    
    e.target.innerText = 'Saving...'; 
    e.target.disabled = true;
    
    try {
        await callAPI('saveUser', { username: u, password: p, role: r, permissions: perms });
        alert('User saved successfully!'); 
        document.getElementById('actionModalUsers').innerHTML = ''; 
        await fetchUsers();
    } catch(err) {
        alert("Error: " + err.message);
        e.target.innerText = 'Save User Data'; 
        e.target.disabled = false;
    }
}

async function deleteUserModal(username, e) {
    if(!confirm(`WARNING: Permanently delete user '${username}'?`)) return;
    
    e.target.innerText = 'Deleting...'; 
    e.target.disabled = true;
    
    try {
        await callAPI('deleteUser', { username: username });
        alert('Deleted.'); 
        document.getElementById('actionModalUsers').innerHTML = ''; 
        await fetchUsers();
    } catch (err) {
        alert('Error: ' + err.message);
        e.target.innerText = 'Delete User'; 
        e.target.disabled = false;
    }
}
