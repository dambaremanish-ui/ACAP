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
            
            // LIGHTNING FAST: Merit is already locked in Column A (r[0]). We just read the data now.
            visitedRows = data.rows; 
            generateReport();
        } else { 
            document.getElementById('reportsContent').innerHTML = '<p>No data available to report.</p>'; 
        }
    } catch (e) { 
        document.getElementById('reportsContent').innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; 
    }
}

// ... existing reports.js fetchReportData() and initialization ...

function buildTableHTML(title, quotaFilter, dateFilter) {
    // 1. Filter with robust Date formatting and Quota matching
    const data = visitedRows.filter(r => {
        if (!r[51] || !r[47]) return false; 
        
        let rowDateStr = "";
        const d = new Date(r[51]);
        if (!isNaN(d.getTime())) {
            rowDateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        } else {
            rowDateStr = r[51].toString().split('T')[0]; 
        }
        return rowDateStr === dateFilter && r[47].toString().trim().toUpperCase() === quotaFilter.toUpperCase();
    });
    
    let html = `<div class="print-header">${title}</div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold; font-size:14px;">
                    <span>List of Attended Students Datewise Report (${quotaFilter})</span><span>Date- ${dateFilter}</span>
                </div>
                <table style="width:100%; border-collapse:collapse; text-align:center; margin-bottom: 30px; border: 1px solid black; table-layout: fixed;">
                    <tr>
                        <th style="border: 1px solid black; padding: 5px; width: 6%;">Sr. No.</th>
                        <th style="border: 1px solid black; padding: 5px; width: 8%;">College Merit List No.</th>
                        <th style="border: 1px solid black; padding: 5px; width: 20%;">Candidate Name</th>
                        <th style="border: 1px solid black; padding: 5px; width: 10%;">CET General Merit No.</th>
                        <th style="border: 1px solid black; padding: 5px; width: 8%;">Percentile</th>
                        <th style="border: 1px solid black; padding: 5px; width: 10%;">Admitted or Not (Yes/No)</th>
                        <th style="border: 1px solid black; padding: 5px; width: 13%;">Allotted Branch</th>
                        <th style="border: 1px solid black; padding: 5px; width: 25%;">Reason for Not Admission</th>
                    </tr>`;
                    
    if(data.length === 0) { 
        html += `<tr><td colspan="8" style="padding:10px;">No students attended under this quota on this date.</td></tr>`; 
    } else {
        data.forEach((r, i) => {
            let admitted = r[49] === 'Admitted' ? 'Yes' : 'No';
            let branch = r[50] || '-';
            let reason = r[48] || '-'; 
            html += `<tr>
                <td style="border: 1px solid black; padding: 5px;">${i + 1}</td>
                <td style="border: 1px solid black; padding: 5px;">${r[5] || '-'}</td> <!-- READ COLUMN F (Index 5) FOR PERMANENT MERIT -->
                <td style="border: 1px solid black; padding: 5px; text-align:left; word-wrap: break-word;">${r[2]}</td>
                <td style="border: 1px solid black; padding: 5px;">${r[18] || '-'}</td> 
                <td style="border: 1px solid black; padding: 5px;">${r[19] || '-'}</td>
                <td style="border: 1px solid black; padding: 5px;">${admitted}</td>
                <td style="border: 1px solid black; padding: 5px; word-wrap: break-word;">${branch}</td>
                <td style="border: 1px solid black; padding: 5px; word-wrap: break-word; word-break: break-word; white-space: normal;">${reason}</td>
            </tr>`;
        });
    }
    return html + `</table>`;
}

// ... existing reports.js generateReport() ...
function generateReport() {
    const selectedDate = document.getElementById('reportDate').value;
    if(!selectedDate) return alert("Select a date first.");
    
    let reportHTML = buildTableHTML("तक्ता-१", "ACAP", selectedDate);
    reportHTML += buildTableHTML("तक्ता-२", "Institute Level", selectedDate);
    
    document.getElementById('reportsContent').innerHTML = reportHTML;
}
