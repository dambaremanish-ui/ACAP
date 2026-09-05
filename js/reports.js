let visitedRows = [];

window.onload = async () => {
    // 1. Inject Landscape Print Rules Automatically
    const style = document.createElement('style');
    style.innerHTML = `@media print { 
        @page { size: landscape; margin: 10mm; } 
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }`;
    document.head.appendChild(style);

    // 2. Add the Excel Export Button
    const actionBar = `
        <div style="display:flex; gap:10px; width:100%; align-items:center;">
            <label style="font-weight:bold;">Select Visit Date:</label>
            <input type="date" id="reportDate" value="${new Date().toISOString().split('T')[0]}" style="flex-grow:1;">
            <button class="btn-success" onclick="generateReport()">Generate Document</button>
            <button style="background:#4F46E5;" onclick="window.print()">🖨 Print PDF</button>
            <button style="background:#10B981;" onclick="exportToExcel()">📊 Export to Excel</button>
        </div>`;
    
    loadMasterLayout('Date-wise Reports', 'reports', actionBar);
    await fetchReportData();
};

async function fetchReportData() {
    try {
        const data = await callAPI('getVisitedData');
        if (data.rows && data.rows.length > 1) {
            data.rows.shift(); 
            visitedRows = data.rows; 
            generateReport();
        } else { 
            document.getElementById('reportsContent').innerHTML = '<p>No data available to report.</p>'; 
        }
    } catch (e) { 
        document.getElementById('reportsContent').innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; 
    }
}

function buildTableHTML(title, quotaFilter, dateFilter) {
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
    
    let html = `<h3 style="text-align:center; font-weight:bold; margin-top: 20px;">${title}</h3>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold; font-size:14px;">
                    <span>List of Attended Students Datewise Report (${quotaFilter})</span>
                    <span>Date: ${dateFilter}</span>
                </div>
                <table style="width:100%; border-collapse:collapse; text-align:center; margin-bottom: 30px; border: 1px solid black; table-layout: fixed;">
                    <tr>
                        <th style="border: 1px solid black; padding: 8px; width: 5%;">Sr. No.</th>
                        <th style="border: 1px solid black; padding: 8px; width: 8%;">College Merit List No.</th>
                        <th style="border: 1px solid black; padding: 8px; width: 22%;">Candidate Name</th>
                        <th style="border: 1px solid black; padding: 8px; width: 10%;">CET General Merit No.</th>
                        <th style="border: 1px solid black; padding: 8px; width: 8%;">Percentile</th>
                        <th style="border: 1px solid black; padding: 8px; width: 10%;">Admitted (Yes/No)</th>
                        <th style="border: 1px solid black; padding: 8px; width: 15%;">Allotted Branch</th>
                        <th style="border: 1px solid black; padding: 8px; width: 22%;">Reason for Not Admission</th>
                    </tr>`;
                    
    if(data.length === 0) { 
        html += `<tr><td colspan="8" style="padding:15px; text-align:center;">No students attended under this quota on this date.</td></tr>`; 
    } else {
        data.forEach((r, i) => {
            let admitted = r[49] === 'Admitted' ? 'Yes' : 'No';
            let branch = r[50] || '-';
            let reason = r[48] || '-'; 
            html += `<tr>
                <td style="border: 1px solid black; padding: 6px;">${i + 1}</td>
                <td style="border: 1px solid black; padding: 6px;">${r[5] || '-'}</td>
                <td style="border: 1px solid black; padding: 6px; text-align:left; word-wrap: break-word;">${r[2]}</td>
                <td style="border: 1px solid black; padding: 6px;">${r[18] || '-'}</td>
                <td style="border: 1px solid black; padding: 6px;">${r[19] || '-'}</td>
                <td style="border: 1px solid black; padding: 6px;">${admitted}</td>
                <td style="border: 1px solid black; padding: 6px; word-wrap: break-word;">${branch}</td>
                <td style="border: 1px solid black; padding: 6px; word-wrap: break-word; word-break: break-word; white-space: normal;">${reason}</td>
            </tr>`;
        });
    }
    return html + `</table>`;
}

function generateReport() {
    const selectedDate = document.getElementById('reportDate').value;
    if(!selectedDate) return alert("Select a date first.");
    
    // 3. Replaced Marathi headers with English Translations
    let reportHTML = buildTableHTML("Table-1", "ACAP", selectedDate);
    reportHTML += buildTableHTML("Table-2", "Institute Level", selectedDate);
    
    document.getElementById('reportsContent').innerHTML = reportHTML;
}

// 4. Native Excel Export Function
function exportToExcel() {
    const selectedDate = document.getElementById('reportDate').value;
    const tableHTML = document.getElementById('reportsContent').innerHTML;
    
    if (!tableHTML || tableHTML.includes('No data available')) {
        return alert("Generate a report first before exporting.");
    }

    // Wrap the HTML inside an Excel-compatible XML envelope structure
    const excelDoc = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid black; padding: 5px; text-align: center; }
            </style>
        </head>
        <body>
            ${tableHTML}
        </body>
        </html>
    `;

    // Create a Blob and trigger the download
    const blob = new Blob([excelDoc], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    
    downloadLink.href = url;
    downloadLink.download = `Admission_Report_${selectedDate}.xls`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}
