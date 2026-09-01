function buildNavigation(activePage) {
    const sessionStr = sessionStorage.getItem('admission_session');
    if (!sessionStr) { 
        window.location.href = 'index.html'; 
        return; 
    }
    
    const session = JSON.parse(sessionStr);
    const perms = session.permissions || [];
    const navDiv = document.getElementById('main-nav');

    let html = `
        <div class="dashboard-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid var(--border);">
            <h2 style="margin:0;">Admission System</h2>
            <div style="display:flex; align-items:center;">
                <span style="background:#e5e7eb; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:bold; color:#374151; margin-right:15px;">${session.role}</span>
                <button onclick="logout()" style="background:#dc2626; padding:6px 15px; margin:0;">Logout</button>
            </div>
        </div>
        <div class="tabs" style="display:flex; gap:10px; margin-bottom:1.5rem; border-bottom:2px solid var(--border); padding-bottom:10px; flex-wrap:wrap;">
    `;

    // Render tabs based on role permissions
    if (perms.includes('search')) {
        const isActive = activePage === 'search' ? 'background:var(--primary); color:white;' : 'background:transparent; color:var(--text);';
        html += `<a href="search.html" style="text-decoration:none;"><button style="${isActive} border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600;">Search & Allocate</button></a>`;
    }
    
    if (perms.includes('applied')) {
        const isActive = activePage === 'applied' ? 'background:var(--primary); color:white;' : 'background:transparent; color:var(--text);';
        html += `<a href="applied.html" style="text-decoration:none;"><button style="${isActive} border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600;">Applied List</button></a>`;
    }
    /*
    if (perms.includes('admitted')) html += `<a href="admitted.html"...>Admitted</a>`;
    if (perms.includes('logs')) html += `<a href="logs.html"...>Logs</a>`;
    if (perms.includes('vacancy')) html += `<a href="vacancy.html"...>Vacancy Stats</a>`;
    if (perms.includes('settings')) html += `<a href="settings.html"...>Limits & Constraints</a>`;
    if (perms.includes('users')) html += `<a href="users.html"...>User Management</a>`;
    */

    html += `</div>`;
    navDiv.innerHTML = html;
}

function logout() {
    sessionStorage.removeItem('admission_session');
    window.location.href = 'index.html';
}
