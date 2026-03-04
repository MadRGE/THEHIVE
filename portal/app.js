// ─── Claude ANMAT Portal — App Logic ───

// State
const state = {
  servers: {
    docgen: { status: "disconnected" },
    tad: { status: "disconnected" },
  },
};

// ─── Tab Navigation ───
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabId = btn.dataset.tab;

    // Update nav buttons
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((tc) => tc.classList.remove("active"));
    document.getElementById("tab-" + tabId).classList.add("active");
  });
});

// ─── Theme Toggle ───
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("claude-anmat-theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("claude-anmat-theme", next);
});

// ─── Copy Command ───
function copyCmd(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("Copiado: " + text);
  });
}

// ─── MCP Server Toggle ───
function toggleServer(serverId) {
  const server = state.servers[serverId];
  const dot = document.getElementById("mcp-dot-" + serverId);
  const statusBadge = document.getElementById("mcp-status-" + serverId);
  const btn = dot.closest(".card").querySelector(".btn-primary, .btn-danger");

  if (server.status === "disconnected" || server.status === "error") {
    // Start connecting
    server.status = "connecting";
    updateServerUI(serverId);
    showToast("Conectando " + (serverId === "docgen" ? "DocGen ANMAT" : "TAD Browser") + "...");

    // Simulate connection delay
    setTimeout(() => {
      server.status = "connected";
      updateServerUI(serverId);
      showToast((serverId === "docgen" ? "DocGen ANMAT" : "TAD Browser") + " conectado");
    }, 1500);
  } else if (server.status === "connected") {
    server.status = "disconnected";
    updateServerUI(serverId);
    showToast((serverId === "docgen" ? "DocGen ANMAT" : "TAD Browser") + " desconectado");
  }
}

function restartServer(serverId) {
  const server = state.servers[serverId];
  server.status = "connecting";
  updateServerUI(serverId);
  showToast("Reiniciando " + (serverId === "docgen" ? "DocGen ANMAT" : "TAD Browser") + "...");

  setTimeout(() => {
    server.status = "connected";
    updateServerUI(serverId);
    showToast((serverId === "docgen" ? "DocGen ANMAT" : "TAD Browser") + " reconectado");
  }, 2000);
}

function updateServerUI(serverId) {
  const server = state.servers[serverId];
  const dot = document.getElementById("mcp-dot-" + serverId);
  const statusBadge = document.getElementById("mcp-status-" + serverId);
  const card = document.getElementById("server-" + serverId);
  const btn = card.querySelector(".mcp-actions .btn:first-child");

  // Update dot
  dot.className = "dot dot-lg";
  if (server.status === "connected") {
    dot.classList.add("dot-green");
  } else if (server.status === "connecting") {
    dot.classList.add("dot-amber");
  } else {
    dot.classList.add("dot-gray");
  }

  // Update status badge
  statusBadge.className = "badge";
  if (server.status === "connected") {
    statusBadge.classList.add("badge-connected");
    statusBadge.textContent = "Conectado";
  } else if (server.status === "connecting") {
    statusBadge.classList.add("badge-connecting");
    statusBadge.textContent = "Conectando...";
  } else {
    statusBadge.classList.add("badge-outline");
    statusBadge.textContent = "Desconectado";
  }

  // Update button
  if (server.status === "connected") {
    btn.className = "btn btn-danger";
    btn.querySelector("span").textContent = "Desconectar";
  } else if (server.status === "connecting") {
    btn.className = "btn btn-outline";
    btn.querySelector("span").textContent = "Conectando...";
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; }, 1600);
  } else {
    btn.className = "btn btn-primary";
    btn.querySelector("span").textContent = "Conectar";
  }

  // Update overview dots
  updateOverviewDots(serverId);
}

function updateOverviewDots(serverId) {
  const server = state.servers[serverId];
  const dotClass = server.status === "connected" ? "dot-green" : server.status === "connecting" ? "dot-amber" : "dot-gray";

  if (serverId === "docgen") {
    ["dot-docgen-1", "dot-docgen-2", "dot-agent1-mcp"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.className = "dot " + dotClass;
      }
    });
  } else if (serverId === "tad") {
    ["dot-tad-1"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.className = "dot " + dotClass;
      }
    });
  }
}

// ─── Toast ───
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
