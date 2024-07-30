function loadCSV(type) {
    fetch(`/admin-dashboard/${type}`)
        .then(response => response.json())
        .then(data => {
            const csvData = document.getElementById('csv-data');
            csvData.innerHTML = generateTableHTML(data);
        });
}

function searchCSV() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const rows = document.querySelectorAll('#csv-data table tbody tr');

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const match = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(searchInput));
        row.style.display = match ? '' : 'none';
    });
}

function generateTableHTML(data) {
    const headers = Object.keys(data[0]);
    const rows = data.map(row => {
        return `<tr>${headers.map(header => `<td>${row[header]}</td>`).join('')}</tr>`;
    });

    return `
        <table>
            <thead>
                <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
            </thead>
            <tbody>${rows.join('')}</tbody>
        </table>
    `;
}
