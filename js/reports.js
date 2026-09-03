let visitedRows = [];

window.onload = async () => {
    const actionBar = `
        <div style="display:flex; gap:10px; width:100%; align-items:center;">
            <label style="font-weight:bold;">Select Visit Date:</label>
            <input type="date" id="reportDate" value="${new Date().toISOString().split('T')[0]}" style="flex-grow:1;">
            <button class="btn-success" onclick="generateReport()">Generate Document</button>
            <button style="background:#4F46E5;" onclick="window.print()">🖨 Print Reports</button>
        </div>`;
    loadMasterLayout('Date-wise Reports', 'reports', actionBar);
    await fetchReportData();
};

async function fetchReportData() {
    try {
        const data = await callAPI('getVisitedData');
        if (data.rows && data.rows.length > 1) {
            data.rows.shift(); // Remove headers
            
            // Calculate Global Merit Exactly like Visited List to match numbers
            let meritCalc = data.rows.map((r, i) => ({
                idx: i, isOMS: generateSeatType(r[3], r[8], r[6]) === 'OMS' ? 1 : 0, cet: parseFloat(r[19]) || 0, jee: parseFloat(r[23]) || 0
            }));
            meritCalc.sort((a, b) => { if (a.isOMS !== b.isOMS) return a.isOMS - b.isOMS; if (b.cet !== a.cet) return b.cet - a.cet; return b.jee - a.jee; });
            meritCalc.forEach((item, rank) => data.rows[item.idx][52] = rank + 1);
            
            visitedRows = data.rows;
            generateReport();
        } else { document.getElementById('reportsContent').innerHTML = '<p>No data available to report.</p>'; }
    } catch (e) { document.getElementById('reportsContent').innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}

function buildTableHTML(title, quotaFilter, dateFilter) {
    const data = visitedRows.filter(r => r[51] === dateFilter && r[47] === quotaFilter); // 51 is Visit Date, 47 is Quota
    
    let html = `<div class="print-header">${title}</div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold; font-size:14px;">
                    <span>List of Attended Students Datewise Report (${quotaFilter})</span><span>Date- ${dateFilter}</span>
                </div>
                <table style="width:100%; border-collapse:collapse; text-align:center; margin-bottom: 30px; border: 1px solid black;">
                    <tr>
                        <th style="border: 1px solid black; padding: 5px;">Sr. No.</th>
                        <th style="border: 1px solid black; padding: 5px;">College Merit<br>List No.</th>
                        <th style="border: 1px solid black; padding: 5px;">Candidate Name</th>
                        <th style="border: 1px solid black; padding: 5px;">CET General<br>Merit No.</th>
                        <th style="border: 1px solid black; padding: 5px;">Percentile</th>
                        <th style="border: 1px solid black; padding: 5px;">Admitted or<br>Not (Yes/No)</th>
                        <th style="border: 1px solid black; padding: 5px;">Allotted<br>Branch</th>
                        <th style="border: 1px solid black; padding: 5px;">Reason for<br>Not Admission</th>
                    </tr>`;
    if(data.length === 0) { html += `<tr><td colspan="8" style="padding:10px;">No students attended under this quota on this date.</td></tr>`; }
    else {
        data.forEach((r, i) => {
            let admitted = r[49] === 'Admitted' ? 'Yes' : 'No';
            let branch = r[50] || '-';
            let reason = r[48] || '-'; // Remark column
            html += `<tr>
                <td style="border: 1px solid black; padding: 5px;">${i + 1}</td>
                <td style="border: 1px solid black; padding: 5px;">${r[51] || '-'}</td>
                <td style="border: 1px solid black; padding: 5px; text-align:left;">${r[2]}</td>
                <td style="border: 1px solid black; padding: 5px;">${r[18] || '-'}</td> <!-- Assuming 18 is State Merit -->
                <td style="border: 1px solid black; padding: 5px;">${r[19] || '-'}</td>
                <td style="border: 1px solid black; padding: 5px;">${admitted}</td>
                <td style="border: 1px solid black; padding: 5px;">${branch}</td>
                <td style="border: 1px solid black; padding: 5px;">${reason}</td>
            </tr>`;
        });
    }
    return html + `</table>`;
}

function generateReport() {
    const selectedDate = document.getElementById('reportDate').value;
    if(!selectedDate) return alert("Select a date first.");
    
    let reportHTML = buildTableHTML("तक्ता-१", "ACAP", selectedDate);
    reportHTML += buildTableHTML("तक्ता-२", "Institute Level", selectedDate);
    
    document.getElementById('reportsContent').innerHTML = reportHTML;
}
