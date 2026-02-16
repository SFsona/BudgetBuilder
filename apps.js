const contentEl = document.getElementById("content");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const stepHint = document.getElementById("stepHint");
const roomTotalEl = document.getElementById("roomTotal");
const overallTotalEl = document.getElementById("overallTotal");
const totalsBar = document.getElementById("totalsBar");

const money = (n) => {
  const v = Number(n || 0);
  return v.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
};

const state = {
  step: 0,
  rooms: [],
  currentRoomIndex: 0,
  data: null
};

const steps = [
  "Welcome",
  "Rooms",
  "How it works",
  "Room options",
  "Summary"
];

function ensureRoomSelections(room) {
  if (!room.selections) room.selections = {};
  if (!state.data) return;

  for (const g of state.data.groups) {
    if (!room.selections[g.key]) room.selections[g.key] = [];
  }
}

function calcRoomTotal(room) {
  if (!state.data || !room) return 0;
  ensureRoomSelections(room);

  let total = 0;
  for (const g of state.data.groups) {
    const picked = room.selections[g.key] || [];
    for (const id of picked) {
      const opt = g.options.find(o => o.id === id);
      if (opt) total += Number(opt.price || 0);
    }
  }
  return total;
}

function calcOverallTotal() {
  if (!state.data) return 0;
  return state.rooms.reduce((sum, r) => sum + calcRoomTotal(r), 0);
}

function updateTotalsUI() {
  const room = state.rooms[state.currentRoomIndex];
  const roomTotal = room ? calcRoomTotal(room) : 0;
  roomTotalEl.textContent = money(roomTotal);
  overallTotalEl.textContent = money(calcOverallTotal());
}

function setNavUI() {
  stepHint.textContent = `${steps[state.step]} (${state.step + 1} of ${steps.length})`;

  // Back button hidden until they begin (welcome screen)
  if (state.step === 0) backBtn.classList.add("hidden");
  else backBtn.classList.remove("hidden");

  // Totals hidden until room options and summary
  if (state.step < 3) totalsBar.classList.add("hidden");
  else totalsBar.classList.remove("hidden");

  // Next button validation
  if (state.step === 1) {
    nextBtn.disabled = state.rooms.length === 0;
  } else if (state.step === 3) {
    nextBtn.disabled = state.rooms.length === 0;
  } else {
    nextBtn.disabled = false;
  }

  nextBtn.textContent = state.step === steps.length - 1 ? "Restart" : "Next";
}

function goStep(newStep) {
  state.step = newStep;
  render();
}

function next() {
  if (state.step === 0) return goStep(1);
  if (state.step === 1) return goStep(2);
  if (state.step === 2) {
    state.currentRoomIndex = 0;
    return goStep(3);
  }
  if (state.step === 3) {
    if (state.currentRoomIndex < state.rooms.length - 1) {
      state.currentRoomIndex += 1;
      render();
      return;
    }
    return goStep(4);
  }
  if (state.step === 4) {
    state.step = 0;
    state.rooms = [];
    state.currentRoomIndex = 0;
    render();
  }
}

function back() {
  if (state.step === 0) return;

  if (state.step === 3) {
    if (state.currentRoomIndex > 0) {
      state.currentRoomIndex -= 1;
      render();
      return;
    }
    return goStep(2);
  }

  goStep(state.step - 1);
}

function renderWelcome() {
  contentEl.innerHTML = `
    <h1 class="hTitle">Welcome</h1>
    <p class="hSub">
      Welcome to our budget calculator, first we’ll build the rooms that you want to include in the budget.
    </p>
    <div class="panel">
      <p class="hSub" style="margin:0 auto;">
        Click to begin when you are ready.
      </p>
      <div class="row" style="margin-top:14px;">
        <button class="btn primary" type="button" id="beginBtn">Click to begin</button>
      </div>
    </div>
  `;

  document.getElementById("beginBtn").addEventListener("click", next);
}

function renderRooms() {
  contentEl.innerHTML = `
    <h1 class="hTitle">Build your rooms</h1>
    <p class="hSub">
      Enter each room name and click Add. When you are finished, click Next.
    </p>

    <div class="panel">
      <div class="row">
        <input class="input" id="roomInput" type="text" placeholder="Example: Kitchen, Master Bedroom, Cinema Room" />
        <button class="btn primary" type="button" id="addRoomBtn">Add</button>
      </div>

      <div class="roomsList" id="roomsList"></div>
    </div>
  `;

  const input = document.getElementById("roomInput");
  const list = document.getElementById("roomsList");
  const addBtn = document.getElementById("addRoomBtn");

  function repaintList() {
    if (state.rooms.length === 0) {
      list.innerHTML = `<div style="color:rgba(255,255,255,0.65); padding:10px 4px;">No rooms added yet</div>`;
      return;
    }

    list.innerHTML = state.rooms.map((r, idx) => `
      <div class="roomItem">
        <div>
          <div class="roomName">${escapeHtml(r.name)}</div>
        </div>
        <button class="smallBtn" type="button" data-remove="${idx}">Remove</button>
      </div>
    `).join("");

    list.querySelectorAll("button[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-remove"));
        state.rooms.splice(i, 1);
        if (state.currentRoomIndex >= state.rooms.length) state.currentRoomIndex = Math.max(0, state.rooms.length - 1);
        repaintList();
        updateTotalsUI();
        setNavUI();
      });
    });
  }

  function addRoom() {
    const name = (input.value || "").trim();
    if (!name) return;

    state.rooms.push({ name, selections: {} });
    input.value = "";
    input.focus();

    repaintList();
    updateTotalsUI();
    setNavUI();
  }

  addBtn.addEventListener("click", addRoom);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addRoom();
  });

  repaintList();
}

function renderIntro() {
  contentEl.innerHTML = `
    <h1 class="hTitle">Next, room options</h1>
    <p class="hSub">
      Now we’ll add options to each room. On the next pages we’ll go through each room you’ve created and add options to each.
      As you add options you’ll see a real time total for the room.
    </p>

    <div class="panel">
      <p class="hSub" style="margin:0;">
        Click Next to continue.
      </p>
    </div>
  `;
}

function renderRoomOptions() {
  if (!state.data) {
    contentEl.innerHTML = `
      <h1 class="hTitle">Loading</h1>
      <p class="hSub">Preparing options data</p>
    `;
    return;
  }

  const room = state.rooms[state.currentRoomIndex];
  ensureRoomSelections(room);

  const roomTitle = escapeHtml(room.name);
  const position = `Room ${state.currentRoomIndex + 1} of ${state.rooms.length}`;

  const groupsHtml = state.data.groups.map(g => {
    const hint = g.selectionType === "single" ? "Choose one option" : "Choose any that apply";

    const options = g.options.map(opt => {
      const checked = (room.selections[g.key] || []).includes(opt.id) ? "checked" : "";
      return `
        <label class="option">
          <input type="checkbox" data-group="${g.key}" data-selection="${g.selectionType}" value="${opt.id}" ${checked} />
          <div>
            <p class="optionTitle">${escapeHtml(opt.label)}</p>
            <div class="optionMeta">
              <span class="badge">${money(opt.price)}</span>
              ${opt.tag ? `<span class="badge">${escapeHtml(opt.tag)}</span>` : ""}
            </div>
          </div>
        </label>
      `;
    }).join("");

    return `
      <div class="group">
        <div class="groupHeader">
          <h3 class="groupTitle">${escapeHtml(g.title)}</h3>
          <div class="groupHint">${hint}</div>
        </div>
        <div class="optionList">
          ${options}
        </div>
      </div>
    `;
  }).join("");

  contentEl.innerHTML = `
    <h1 class="hTitle">${roomTitle}</h1>
    <p class="hSub">${position}</p>

    <div class="panel">
      <div class="groups">
        ${groupsHtml}
      </div>
    </div>
  `;

  contentEl.querySelectorAll("input[type='checkbox'][data-group]").forEach(cb => {
    cb.addEventListener("change", () => {
      const groupKey = cb.getAttribute("data-group");
      const selectionType = cb.getAttribute("data-selection");
      const id = cb.value;

      const picked = new Set(room.selections[groupKey] || []);

      if (selectionType === "single") {
        if (cb.checked) {
          picked.clear();
          picked.add(id);

          contentEl.querySelectorAll(`input[type='checkbox'][data-group="${groupKey}"]`).forEach(other => {
            if (other.value !== id) other.checked = false;
          });
        } else {
          picked.delete(id);
        }
      } else {
        if (cb.checked) picked.add(id);
        else picked.delete(id);
      }

      room.selections[groupKey] = Array.from(picked);

      updateTotalsUI();
      setNavUI();
    });
  });

  updateTotalsUI();
}

function renderSummary() {
  const rows = state.rooms.map(r => `
    <tr class="summaryRow">
      <td>${escapeHtml(r.name)}</td>
      <td style="text-align:right; font-weight:700;">${money(calcRoomTotal(r))}</td>
    </tr>
  `).join("");

  const total = money(calcOverallTotal());

  contentEl.innerHTML = `
    <h1 class="hTitle">Summary</h1>
    <p class="hSub">
      Rooms and guide budget totals. You can print this page or export the data.
    </p>

    <div class="panel summary">
      <div class="summaryHeader">
        <div style="font-family:'Plantin MT Pro','Plantin','Georgia',serif; font-size:18px;">
          Total ${total}
        </div>
        <div class="summaryActions">
          <button class="btn ghost" type="button" id="printBtn">Print</button>
          <button class="btn ghost" type="button" id="exportJsonBtn">Export JSON</button>
          <button class="btn ghost" type="button" id="exportCsvBtn">Export CSV</button>
        </div>
      </div>

      <table class="summaryTable" aria-label="Summary table">
        <thead>
          <tr style="color:rgba(255,255,255,0.75); text-align:left;">
            <th>Room</th>
            <th style="text-align:right;">Cost</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="summaryRow">
            <td style="font-weight:700;">Total</td>
            <td style="text-align:right; font-weight:800;">${total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("exportJsonBtn").addEventListener("click", exportJson);
  document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);

  updateTotalsUI();
}

function render() {
  // Welcome, Rooms, How it works always render immediately
  if (state.step === 0) {
    renderWelcome();
    updateTotalsUI();
    setNavUI();
    return;
  }

  if (state.step === 1) {
    renderRooms();
    updateTotalsUI();
    setNavUI();
    return;
  }

  if (state.step === 2) {
    renderIntro();
    updateTotalsUI();
    setNavUI();
    return;
  }

  // From step 3 onward, options data is required
  if (!state.data) {
    contentEl.innerHTML = `
      <h1 class="hTitle">Loading</h1>
      <p class="hSub">Preparing options data</p>
    `;
    updateTotalsUI();
    setNavUI();
    return;
  }

  if (state.step === 3) renderRoomOptions();
  if (state.step === 4) renderSummary();

  updateTotalsUI();
  setNavUI();
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exportJson() {
  const payload = {
    createdAt: new Date().toISOString(),
    rooms: state.rooms.map(r => ({
      name: r.name,
      total: calcRoomTotal(r),
      selections: r.selections
    })),
    overallTotal: calcOverallTotal()
  };

  downloadFile("sona-budget.json", JSON.stringify(payload, null, 2), "application/json");
}

function exportCsv() {
  const lines = [];
  lines.push(["Room", "Cost"].join(","));
  for (const r of state.rooms) {
    lines.push([csvSafe(r.name), calcRoomTotal(r)].join(","));
  }
  lines.push(["Total", calcOverallTotal()].join(","));

  downloadFile("sona-budget.csv", lines.join("\n"), "text/csv");
}

function csvSafe(value) {
  const s = String(value || "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

async function loadData() {
  const res = await fetch("options.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load options.json");
  state.data = await res.json();

  // Ensure selections map exists for all rooms and groups once data loads
  for (const r of state.rooms) ensureRoomSelections(r);
}

backBtn.addEventListener("click", back);
nextBtn.addEventListener("click", next);

// Render immediately so Welcome text always appears
render();

// Load options data (needed from step 3 onward)
loadData()
  .then(() => {
    if (state.step >= 3) render();
  })
  .catch(() => {
    if (state.step >= 3) {
      contentEl.innerHTML = `
        <h1 class="hTitle">Error</h1>
        <p class="hSub">
          Could not load options.json. Make sure it sits next to index.html and app.js in the same folder.
        </p>
      `;
    }
  });
