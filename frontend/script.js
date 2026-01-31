document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const sendBtn = document.getElementById('sendBtn');
    const resultArea = document.getElementById('resultArea');
    const transferCodeDisplay = document.getElementById('transferCode');
    const receiveCodeInput = document.getElementById('receiveCode');
    const receiveBtn = document.getElementById('receiveBtn');

    sendBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return alert('Select a file first!');

        sendBtn.disabled = true;
        sendBtn.textContent = 'Uploading...';

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/transfers/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');

            transferCodeDisplay.textContent = data.transferCode;
            resultArea.classList.remove('hidden');
        } catch (error) {
            alert(error.message);
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Upload & Get Code';
        }
    });

    receiveBtn.addEventListener('click', async () => {
        const code = receiveCodeInput.value.trim();
        if (code.length !== 6) return alert('Enter a 6-digit code');

        receiveBtn.disabled = true;
        receiveBtn.textContent = 'Downloading...';

        try {
            const response = await fetch(`/api/transfers/${code}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Download failed');
            }

            // Extract filename safely
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'file';
            if (contentDisposition) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '').trim();
                    filename = decodeURIComponent(filename);
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert(error.message);
        } finally {
            receiveBtn.disabled = false;
            receiveBtn.textContent = 'Download File';
        }
    });
});