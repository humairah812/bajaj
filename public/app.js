const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const edgesInput = document.getElementById("edgesInput");
const errorBox = document.getElementById("errorBox");
const resultBox = document.getElementById("result");
const BASE_URL = "";

function parseInput(value) {
  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function renderResponse(data) {
  const summary = data.summary || {};
  const hierarchies = Array.isArray(data.hierarchies) ? data.hierarchies : [];
  const invalid = Array.isArray(data.invalid_entries) ? data.invalid_entries : [];
  const duplicate = Array.isArray(data.duplicate_edges) ? data.duplicate_edges : [];

  resultBox.innerHTML = `
    <section class="summary">
      <div class="card">
        <div class="k">Total Trees</div>
        <div class="v">${summary.total_trees ?? 0}</div>
      </div>
      <div class="card">
        <div class="k">Total Cycles</div>
        <div class="v">${summary.total_cycles ?? 0}</div>
      </div>
      <div class="card">
        <div class="k">Largest Tree Root</div>
        <div class="v">${summary.largest_tree_root || "-"}</div>
      </div>
    </section>
    <section class="panel">
      <h3>Identity</h3>
      <div class="hierarchy-grid">
        <div class="card"><div class="k">user_id</div><div>${data.user_id || "-"}</div></div>
        <div class="card"><div class="k">email_id</div><div>${data.email_id || "-"}</div></div>
        <div class="card"><div class="k">college_roll_number</div><div>${data.college_roll_number || "-"}</div></div>
      </div>
    </section>
    <section class="panel">
      <h3>Hierarchies (${hierarchies.length})</h3>
      <div class="hierarchy-grid">
        ${hierarchies
          .map(
            (h) => `
          <article class="card">
            <div><strong>Root:</strong> ${h.root}</div>
            <div style="margin:0.35rem 0;">
              ${h.has_cycle ? '<span class="chip cycle">Cycle</span>' : '<span class="chip">Tree</span>'}
              ${h.depth ? `<span class="chip">Depth: ${h.depth}</span>` : ""}
            </div>
            <pre>${JSON.stringify(h.tree, null, 2)}</pre>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
    <section class="hierarchy-grid">
      <article class="card">
        <h3>Invalid Entries (${invalid.length})</h3>
        <pre>${JSON.stringify(invalid, null, 2)}</pre>
      </article>
      <article class="card">
        <h3>Duplicate Edges (${duplicate.length})</h3>
        <pre>${JSON.stringify(duplicate, null, 2)}</pre>
      </article>
    </section>
    <section class="panel">
      <h3>Raw JSON</h3>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </section>
  `;
  resultBox.classList.remove("hidden");
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
}

analyzeBtn.addEventListener("click", async () => {
  hideError();
  resultBox.classList.add("hidden");

  const data = parseInput(edgesInput.value);

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing...";
  try {
    const res = await fetch(`${BASE_URL}/bfhl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });

    if (!res.ok) {
      throw new Error(`API failed with status ${res.status}`);
    }
    const payload = await res.json();
    renderResponse(payload);
  } catch (error) {
    showError(error.message || "Something went wrong");
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze";
  }
});

clearBtn.addEventListener("click", () => {
  edgesInput.value = "";
  hideError();
  resultBox.classList.add("hidden");
  resultBox.innerHTML = "";
});
