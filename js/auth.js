document.getElementById('loginBtn').addEventListener('click', async (e) => {
    const user = document.getElementById('user').value.trim();
    const pass = document.getElementById('pass').value.trim();
    const btn = e.target;
    const errorMsg = document.getElementById('errorMsg');

    if (!user || !pass) { errorMsg.innerText = "Please enter credentials."; return; }

    btn.innerText = 'Verifying...'; btn.disabled = true; errorMsg.innerText = '';

    try {
        const response = await callAPI('login', { user: user, pass: pass });
        sessionStorage.setItem('admission_session', JSON.stringify(response));
        
        if (response.permissions.includes('search')) window.location.href = 'search.html';
        else if (response.permissions.includes('applied')) window.location.href = 'applied.html';
        else errorMsg.innerText = "Account has no active tab permissions.";
    } catch (err) {
        errorMsg.innerText = err.message || "Failed to authenticate.";
        btn.innerText = 'Secure Login'; btn.disabled = false;
    }
});
