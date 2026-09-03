function loadMasterLayout(pageTitle, activeTab, actionBarHTML) {
    document.head.innerHTML += `
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="css/style.css">
        <link rel="icon" type="image/x-icon" href="favicon.ico">
        <link rel="icon" type="image/svg+xml" href="icons/logo.svg">
        <link rel="apple-touch-icon" href="icons/icon-192.png">
        <link rel="manifest" href="manifest.json">
        <meta name="theme-color" content="#4F46E5">
    `;
    document.title = pageTitle + " | Admission Portal";

    const sessionStr = sessionStorage.getItem('admission_session');
    if (!sessionStr) { window.location.href = 'index.html'; return; }
    const session = JSON.parse(sessionStr); const perms = session.permissions || [];

    let tabsHTML = '';
    if (perms.includes('search')) tabsHTML += `<a href="search.html" class="tab ${activeTab === 'search' ? 'active' : ''}"><button>Search & Allocate</button></a>`;
    if (perms.includes('visited')) tabsHTML += `<a href="visited.html" class="tab ${activeTab === 'visited' ? 'active' : ''}"><button>Visited List</button></a>`;
    if (perms.includes('admitted')) tabsHTML += `<a href="admitted.html" class="tab ${activeTab === 'admitted' ? 'active' : ''}"><button>Admitted</button></a>`;
    if (perms.includes('reports')) tabsHTML += `<a href="reports.html" class="tab ${activeTab === 'reports' ? 'active' : ''}"><button style="background: #10B981; color: white;">Reports</button></a>`;
    if (perms.includes('logs')) tabsHTML += `<a href="logs.html" class="tab ${activeTab === 'logs' ? 'active' : ''}"><button>Logs</button></a>`;
    if (perms.includes('vacancy')) tabsHTML += `<a href="vacancy.html" class="tab ${activeTab === 'vacancy' ? 'active' : ''}"><button>Vacancy Stats</button></a>`;
    if (perms.includes('settings')) tabsHTML += `<a href="settings.html" class="tab ${activeTab === 'settings' ? 'active' : ''}"><button>Limits</button></a>`;
    if (perms.includes('users')) tabsHTML += `<a href="users.html" class="tab ${activeTab === 'users' ? 'active' : ''}"><button>Users</button></a>`;

    const masterHTML = `
    <div class="top-panel">
        <div class="top-panel-card">
            <div class="dashboard-header">
                <h2 style="margin:0; color: var(--primary);">Admission System</h2>
                <div style="display:flex; align-items:center;"><span class="role-badge">${session.role}</span><button class="btn-danger" onclick="logout()">Logout</button></div>
            </div>
            <div class="tabs">${tabsHTML}</div>
            <div class="action-bar" style="flex-wrap: wrap;">${actionBarHTML}</div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('afterbegin', masterHTML);
}
function logout() { sessionStorage.removeItem('admission_session'); window.location.href = 'index.html'; }
function generateSeatType(gender, category, candidatureType) {
    const cat = (category || '').toString().toUpperCase(), candType = (candidatureType || '').toString().toUpperCase();
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
