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
        <div class="dashboard-header">
            <h2 style="margin:0; color: var(--primary);">Admission System</h2>
            <div style="display:flex; align-items:center;">
                <span class="role-badge">${session.role}</span>
                <button class="btn-danger" onclick="logout()">Logout</button>
            </div>
        </div>
        <div class="tabs">
    `;

    // Render tabs dynamically using clean CSS classes
    if (perms.includes('search')) {
        html += `<a href="search.html" class="tab ${activePage === 'search' ? 'active' : ''}"><button>Search & Allocate</button></a>`;
    }
    if (perms.includes('applied')) {
        html += `<a href="applied.html" class="tab ${activePage === 'applied' ? 'active' : ''}"><button>Applied List</button></a>`;
    }
    if (perms.includes('admitted')) {
        html += `<a href="admitted.html" class="tab ${activePage === 'admitted' ? 'active' : ''}"><button>Admitted</button></a>`;
    }
    if (perms.includes('logs')) {
        html += `<a href="logs.html" class="tab ${activePage === 'logs' ? 'active' : ''}"><button>Logs</button></a>`;
    }
    if (perms.includes('vacancy')) {
        html += `<a href="vacancy.html" class="tab ${activePage === 'vacancy' ? 'active' : ''}"><button>Vacancy Stats</button></a>`;
    }
    if (perms.includes('settings')) {
        html += `<a href="settings.html" class="tab ${activePage === 'settings' ? 'active' : ''}"><button>Limits & Constraints</button></a>`;
    }
    if (perms.includes('users')) {
        html += `<a href="users.html" class="tab ${activePage === 'users' ? 'active' : ''}"><button>User Management</button></a>`;
    }

    html += `</div>`;
    navDiv.innerHTML = html;
}

function logout() {
    sessionStorage.removeItem('admission_session');
    window.location.href = 'index.html';
}
