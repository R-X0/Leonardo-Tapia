$(document).ready(function() {
    let rowCount = 1;

    // Add row functionality
    $('#addRow').click(function() {
        if (rowCount < 10) {
            const newRow = `
                <div class="row mb-3">
                    <div class="col">
                        <input type="text" class="form-control" name="affid[]" placeholder="Affid" required>
                    </div>
                    <div class="col">
                        <input type="text" class="form-control" name="offerid[]" placeholder="Offerid" required>
                    </div>
                    <div class="col">
                        <select class="form-select" name="platform[]" required>
                            <option value="">Select Platform</option>
                            <option value="IncomeAccess">Income Access</option>
                            <option value="Affilka">Affilka</option>
                            <option value="Referon">Referon</option>
                            <option value="MyAffiliates">MyAffiliates</option>
                            <option value="Cellxpert">Cellxpert</option>
                            <option value="Netrefer">Netrefer</option>
                            <option value="MAP">MAP</option>
                        </select>
                    </div>
                    <div class="col">
                        <input type="file" class="form-control" name="csvFile[]" accept=".csv,.xlsx" required>
                    </div>
                </div>
            `;
            $('#dynamicRows').append(newRow);
            rowCount++;
        } else {
            alert('Maximum 10 rows allowed.');
        }
    });

    // Form submission
    $('#csvForm').submit(function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        // Process files
        processFiles(formData);
    });

    function processFiles(formData) {
        const filePromises = [];

        for (let i = 0; i < formData.getAll('csvFile[]').length; i++) {
            const file = formData.getAll('csvFile[]')[i];
            const affid = formData.getAll('affid[]')[i];
            const offerid = formData.getAll('offerid[]')[i];
            const platform = formData.getAll('platform[]')[i];

            filePromises.push(readFile(file, affid, offerid, platform));
        }

        Promise.all(filePromises)
            .then(results => {
                let previewHtml = '<table class="table"><thead><tr><th>File</th><th>Platform</th><th>Affid</th><th>Offerid</th><th>Preview</th></tr></thead><tbody>';
                
                results.forEach(result => {
                    const mapping = platformMappings[result.platform];
                    
                    if (!mapping) {
                        previewHtml += `<tr><td>${result.fileName}</td><td>${result.platform}</td><td>${result.affid}</td><td>${result.offerid}</td><td>Error: No mapping found for platform</td></tr>`;
                        return;
                    }

                    const previewData = result.data.slice(0, 5).map(row => {
                        return Object.keys(mapping).map(key => row[mapping[key]]).join(', ');
                    }).join('<br>');

                    previewHtml += `<tr><td>${result.fileName}</td><td>${result.platform}</td><td>${result.affid}</td><td>${result.offerid}</td><td>${previewData}</td></tr>`;
                });

                previewHtml += '</tbody></table>';
                $('#previewContent').html(previewHtml);

                console.log('Data to process:', results);
            })
            .catch(error => {
                $('#previewContent').html(`<div class="alert alert-danger">${error.message}</div>`);
            });
    }

    function readFile(file, affid, offerid, platform) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function(e) {
                const data = e.target.result;
                const workbook = XLSX.read(data, {type: 'binary'});
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                resolve({fileName: file.name, data: jsonData, affid, offerid, platform});
            };

            reader.onerror = function(e) {
                reject(new Error('Error reading file: ' + file.name));
            };

            reader.readAsBinaryString(file);
        });
    }
});