document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:3001";

  // Elements
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const uploadStatus = document.getElementById("uploadStatus");
  const resultArea = document.getElementById("resultArea");

  const fileNameEl = document.getElementById("fileName");
  const fileSizeEl = document.getElementById("fileSize");
  const sendBtn = document.getElementById("sendBtn");

  const transferCodeEl = document.getElementById("transferCode");
  const timeRemainingEl = document.getElementById("timeRemaining");
  const newTransferBtn = document.getElementById("newTransferBtn");

  const receiveCode = document.getElementById("receiveCode");
  const receiveBtn = document.getElementById("receiveBtn");

  let selectedFile = null;
  let timer = null;

  /* -------------------------------------------------------------------------- */
  /*                                 SEND FLOW                                  */
  /* -------------------------------------------------------------------------- */

  dropZone.addEventListener("click", () => {
    if (!selectedFile) fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    selectedFile = e.target.files[0];
    if (!selectedFile) return;

    fileNameEl.textContent = selectedFile.name;
    fileSizeEl.textContent = formatBytes(selectedFile.size);

    dropZone.classList.add("hidden");
    uploadStatus.classList.remove("hidden");
  });

  sendBtn.addEventListener("click", async () => {
    if (!selectedFile) return;

    try {
      updateButtonState(sendBtn, true, "Uploading...");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`${API_BASE}/api/transfers/upload`, {
        method: "POST",
        body: formData // Browser sets Content-Type to multipart/form-data
      });

      if (!res.ok) throw new Error("Upload failed. Server might be down.");

      const data = await res.json();
      showResult(data);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      updateButtonState(sendBtn, false, "Send");
    }
  });

  /* -------------------------------------------------------------------------- */
  /*                                RECEIVE FLOW                                */
  /* -------------------------------------------------------------------------- */

  receiveBtn.addEventListener("click", async () => {
    const code = receiveCode.value.trim();

    if (code.length !== 6 || isNaN(code)) {
      alert("Please enter a valid 6-digit code.");
      return;
    }

    try {
      updateButtonState(receiveBtn, true, "Downloading...");

      const res = await fetch(`${API_BASE}/api/transfers/${code}`);

      if (res.status === 404) throw new Error("Code not found or expired.");
      if (res.status === 410) throw new Error("Transfer link expired.");
      if (!res.ok) throw new Error("Download failed.");

      const blob = await res.blob();

      // Robust filename extraction handling quotes
      let filename = "downloaded-file";
      const disposition = res.headers.get("Content-Disposition");
      if (disposition) {
        const match = disposition.match(/filename\*?=['"]?([^'";]+)['"]?/);
        if (match && match[1]) filename = match[1];
      }

      triggerDownload(blob, filename);

      receiveCode.value = "";
      alert(`Successfully downloaded: ${filename}`);

    } catch (err) {
      alert(err.message);
    } finally {
      updateButtonState(receiveBtn, false, "Download");
    }
  });

  /* -------------------------------------------------------------------------- */
  /*                                RESET/UTILS                                 */
  /* -------------------------------------------------------------------------- */

  newTransferBtn.addEventListener("click", () => {
    selectedFile = null;
    fileInput.value = "";

    resultArea.classList.add("hidden");
    uploadStatus.classList.add("hidden");
    dropZone.classList.remove("hidden");

    if (timer) clearInterval(timer);
  });

  function showResult(data) {
    uploadStatus.classList.add("hidden");
    resultArea.classList.remove("hidden");

    transferCodeEl.textContent = data.transferCode;

    const endTime = new Date(data.expiresAt);
    updateTimer(endTime);
    timer = setInterval(() => updateTimer(endTime), 1000);
  }

  function updateTimer(endTime) {
    const diff = endTime - new Date();
    if (diff <= 0) {
      clearInterval(timer);
      timeRemainingEl.textContent = "Expired";
      return;
    }
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    timeRemainingEl.textContent = `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function updateButtonState(btn, disabled, text) {
    btn.disabled = disabled;
    btn.textContent = text;
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});

