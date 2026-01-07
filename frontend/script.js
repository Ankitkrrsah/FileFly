document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const resultArea = document.getElementById('resultArea');
    const fileNameDisplay = document.getElementById('fileName');
    const fileSizeDisplay = document.getElementById('fileSize');
    const sendBtn = document.getElementById('sendBtn');
    const transferCodeDisplay = document.getElementById('transferCode');
    const timeRemainingDisplay = document.getElementById('timeRemaining');
    const newTransferBtn = document.getElementById('newTransferBtn');
    
    // Receive section elements
    const receiveCodeInput = document.getElementById('receiveCode');
    const receiveBtn = document.getElementById('receiveBtn');

    let selectedFile = null;

    // --- Event Listeners ---

    // Click to choose file
    dropZone.addEventListener('click', () => {
        if (!selectedFile) {
            fileInput.click();
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // Upload & Send
    sendBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('/api/transfers/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            showResult(data);

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to send file: ' + error.message);
            setLoading(false);
        }
    });

    // Send Another
    newTransferBtn.addEventListener('click', () => {
        resetSendForm();
    });

    // Receive File
    receiveBtn.addEventListener('click', handleDownload);
    receiveCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleDownload();
    });

    // --- Functions ---

    function handleFileSelect(file) {
        selectedFile = file;
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = formatBytes(file.size);
        
        dropZone.classList.add('hidden');
        uploadStatus.classList.remove('hidden');
    }

    async function handleDownload() {
        const code = receiveCodeInput.value.trim();
        if (code.length !== 6 || isNaN(code)) {
            alert('Please enter a valid 6-digit code');
            return;
        }

        // We can just redirect to the download URL, but let's check if it exists first
        // to give a better error message, although the backend returns JSON on error.
        // A simple trick is to try to fetch the headers first or just open it.
        // Since we want to handle errors nicely:
        
        const downloadUrl = `/api/transfers/${code}`;

        try {
            // Check if file exists/is valid before opening window
            // Note: This relies on the backend sending JSON errors with non-200 status
            // If the backend sends the file stream immediately on 200, this fetch will start downloading it.
            // We can abort it.
            
            // However, since we want to download it, we can create a hidden link or use window.location
            // The issue is catching 404s without the browser navigating to a "{"error":...}" page.
            
            // Better approach: fetch the blob.
            
            receiveBtn.textContent = '...';
            receiveBtn.disabled = true;

            const response = await fetch(downloadUrl);
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Download failed');
            }

            // If we are here, we have the stream. 
            // We need to get the filename from Content-Disposition if possible, or default.
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'downloaded-file';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match && match[1]) {
                    filename = match[1];
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

            receiveCodeInput.value = '';

        } catch (error) {
            alert(error.message);
        } finally {
            receiveBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
            receiveBtn.disabled = false;
        }
    }

    function showResult(data) {
        uploadStatus.classList.add('hidden');
        resultArea.classList.remove('hidden');
        
        transferCodeDisplay.textContent = data.transferCode;
        
        // Calculate and show expiry
        const expiresAt = new Date(data.expiresAt);
        startCountdown(expiresAt);
    }

    function resetSendForm() {
        selectedFile = null;
        fileInput.value = '';
        
        resultArea.classList.add('hidden');
        dropZone.classList.remove('hidden');
        
        // Stop any running intervals
        if (window.timerInterval) clearInterval(window.timerInterval);
    }

    function setLoading(isLoading) {
        if (isLoading) {
            sendBtn.textContent = 'Sending...';
            sendBtn.disabled = true;
        } else {
            sendBtn.textContent = 'Send';
            sendBtn.disabled = false;
        }
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function startCountdown(endTime) {
        if (window.timerInterval) clearInterval(window.timerInterval);

        function update() {
            const now = new Date();
            const distance = endTime - now;

            if (distance < 0) {
                clearInterval(window.timerInterval);
                timeRemainingDisplay.textContent = "Expired";
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            timeRemainingDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }

        update();
        window.timerInterval = setInterval(update, 1000);
    }
});