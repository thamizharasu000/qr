document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const libraryError = $("libraryError");

  const state = {
    currentQrData: "",
    currentQrType: null,
    selectedStyle: "square",
    currentQr: null,
    currentFileName: "",
    name: "",
    upiId: "",
    amount: ""
  };

  const styleConfig = {
    square: { dots: "square", cornerSquare: "square", cornerDot: "square" },
    rounded: { dots: "rounded", cornerSquare: "rounded", cornerDot: "dot" },
    dots: { dots: "dots", cornerSquare: "dot", cornerDot: "dot" },
    "extra-rounded": { dots: "extra-rounded", cornerSquare: "extra-rounded", cornerDot: "dot" }
  };

  function showMessage(text = "") {
    $("message").textContent = text;
  }

  function setActiveStyles(containerId, style) {
    document.querySelectorAll(`#${containerId} .style-btn`).forEach((button) => {
      const active = button.dataset.style === style;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setTab(tab) {
    const isLink = tab === "link";
    $("linkTab").classList.toggle("active", isLink);
    $("upiTab").classList.toggle("active", !isLink);
    $("linkTab").setAttribute("aria-selected", String(isLink));
    $("upiTab").setAttribute("aria-selected", String(!isLink));
    $("linkPanel").hidden = !isLink;
    $("upiPanel").hidden = isLink;
    showMessage("");
  }

  function normalizeLink(value) {
    let url = value.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    return url;
  }

  function isValidLink(value) {
    try {
      const url = new URL(value);
      return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
    } catch {
      return false;
    }
  }

  function isValidUpiId(value) {
    return /^[^\\s@]+@[^\\s@]+$/.test(value);
  }

  function formatAmount(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return null;
    return number.toFixed(2);
  }

  function buildUpiUri(upiId, name, amount) {
    // Encode parameter values individually. The @ separator remains inside the UPI ID value.
    const params = new URLSearchParams();
    params.set("pa", upiId);
    params.set("pn", name);
    params.set("am", amount);
    params.set("cu", "INR");
    return `upi://pay?${params.toString()}`;
  }

  function qrOptions(data, style) {
    const cfg = styleConfig[style] || styleConfig.square;
    return {
      width: 500,
      height: 500,
      type: "canvas",
      data,
      margin: 8,
      qrOptions: { typeNumber: 0, mode: "Byte", errorCorrectionLevel: "M" },
      dotsOptions: { type: cfg.dots, color: "#000000" },
      backgroundOptions: { color: "#FFFFFF" },
      cornersSquareOptions: { type: cfg.cornerSquare, color: "#000000" },
      cornersDotOptions: { type: cfg.cornerDot, color: "#000000" }
    };
  }

  function ensureLibrary() {
    if (typeof QRCodeStyling !== "function") {
      libraryError.hidden = false;
      console.error("QRCodeStyling library is unavailable.");
      return false;
    }
    libraryError.hidden = true;
    return true;
  }

  function renderQr() {
    if (!ensureLibrary()) return false;

    const qr = new QRCodeStyling(qrOptions(state.currentQrData, state.selectedStyle));
    state.currentQr = qr;

    $("qrPreview").replaceChildren();
    qr.append($("qrPreview"));

    $("result").hidden = false;
    $("result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    return true;
  }

  function updateResult(type) {
    const details = $("resultDetails");
    details.replaceChildren();

    if (type === "link") {
      $("resultTitle").textContent = "QR Generated";
      addDetail(details, "Link", state.currentQrData);
    } else {
      $("resultTitle").textContent = "UPI Payment QR";
      addDetail(details, "Name", state.name);
      addDetail(details, "UPI ID", state.upiId);
      addDetail(details, "Amount", `₹${state.amount}`);
    }
  }

  function addDetail(parent, label, value) {
    const wrapper = document.createElement("div");
    wrapper.className = "detail";
    const labelEl = document.createElement("span");
    labelEl.className = "label";
    labelEl.textContent = label;
    const valueEl = document.createElement("span");
    valueEl.className = "value";
    valueEl.textContent = value;
    wrapper.append(labelEl, valueEl);
    parent.appendChild(wrapper);
  }

  function generateLink() {
    showMessage("");
    const raw = $("linkInput").value.trim();
    if (!raw) {
      showMessage("Please enter a link.");
      return;
    }
    const normalized = normalizeLink(raw);
    if (!isValidLink(normalized)) {
      showMessage("Please enter a valid link.");
      return;
    }

    state.currentQrData = normalized;
    state.currentQrType = "link";
    state.currentFileName = "Link-QR.png";
    state.name = state.upiId = state.amount = "";

    updateResult("link");
    renderQr();
  }

  function generateUpi() {
    showMessage("");
    const upiId = $("upiId").value.trim();
    const name = $("upiName").value.trim();
    const amount = formatAmount($("upiAmount").value);

    if (!upiId) {
      showMessage("Please enter UPI ID.");
      return;
    }
    if (!isValidUpiId(upiId)) {
      showMessage("Please enter a valid UPI ID.");
      return;
    }
    if (!name) {
      showMessage("Please enter Name.");
      return;
    }
    if (!amount) {
      showMessage("Please enter a valid amount.");
      return;
    }

    state.upiId = upiId;
    state.name = name;
    state.amount = amount;
    state.currentQrData = buildUpiUri(upiId, name, amount);
    state.currentQrType = "upi";
    state.currentFileName = "UPI-Payment-QR.png";

    updateResult("upi");
    renderQr();
  }

  async function getQrBlob() {
    if (!state.currentQr) throw new Error("No QR generated.");
    return await state.currentQr.getRawData("png");
  }

  async function downloadQr() {
    try {
      const blob = await getQrBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = state.currentFileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Download failed:", error);
      showMessage("Unable to download the QR right now.");
    }
  }

  async function shareQr() {
    if (!navigator.share) {
      showMessage("Sharing is not supported in this browser. Please use Download.");
      return;
    }

    try {
      const blob = await getQrBlob();
      const file = new File([blob], state.currentFileName, { type: "image/png" });
      const shareData = state.currentQrType === "link"
        ? { title: "Link QR", text: state.currentQrData, files: [file] }
        : { title: "UPI Payment QR", text: `UPI payment QR for ${state.name}`, files: [file] };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else {
        const fallback = state.currentQrType === "link"
          ? { title: "Link QR", text: state.currentQrData }
          : { title: "UPI Payment QR", text: "UPI Payment QR" };
        await navigator.share(fallback);
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.error("Share failed:", error);
      showMessage("Unable to share the QR right now.");
    }
  }

  function openModal() {
    if (!state.currentQr) return;
    $("modalTitle").textContent = state.currentQrType === "upi" ? "UPI Payment QR" : "Link QR";
    $("modal").hidden = false;
    $("modalQr").replaceChildren();
    state.currentQr.append($("modalQr"));
    document.body.style.overflow = "hidden";
    $("closeModal").focus();
  }

  function closeModal() {
    $("modal").hidden = true;
    document.body.style.overflow = "";
    $("qrPreview").focus();
  }

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => setTab(button.id === "linkTab" ? "link" : "upi"));
  });

  document.querySelectorAll("#linkStyles .style-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedStyle = button.dataset.style;
      setActiveStyles("linkStyles", state.selectedStyle);
    });
  });

  document.querySelectorAll("#upiStyles .style-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedStyle = button.dataset.style;
      setActiveStyles("upiStyles", state.selectedStyle);
    });
  });

  $("generateLink").addEventListener("click", generateLink);
  $("generateUpi").addEventListener("click", generateUpi);
  $("downloadBtn").addEventListener("click", downloadQr);
  $("shareBtn").addEventListener("click", shareQr);
  $("qrPreview").addEventListener("click", openModal);
  $("modalDownload").addEventListener("click", downloadQr);
  $("modalShare").addEventListener("click", shareQr);
  $("closeModal").addEventListener("click", closeModal);
  document.querySelector(".modal-backdrop").addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("modal").hidden) closeModal();
  });

  ["linkInput", "upiId", "upiName", "upiAmount"].forEach((id) => {
    $(id).addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        if (id === "linkInput") generateLink();
        else generateUpi();
      }
    });
  });

  setActiveStyles("linkStyles", "square");
  setActiveStyles("upiStyles", "square");
  ensureLibrary();
});
