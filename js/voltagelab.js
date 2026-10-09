/* ============================================================
   GridLab - Working Voltage Laboratory
   ============================================================ */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  if (!$("#vlP")) return;

  const VMIN = 230, VMAX = 33000;
  const sliderToV = (t) => VMIN * Math.pow(VMAX / VMIN, t / 100);
  const vToSlider = (v) => 100 * Math.log(v / VMIN) / Math.log(VMAX / VMIN);
  const fmtV = (v) => v >= 1000 ? (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + " kV" : Math.round(v) + " V";

  const el = {
    P: $("#vlP"), phase: $("#vlPhase"), V: $("#vlV"), PF: $("#vlPF"), R: $("#vlR"),
    Pv: $("#vlPv"), Vv: $("#vlVv"), PFv: $("#vlPFv"), Rv: $("#vlRv"),
    I: $("#vlI"), Icap: $("#vlIcap"), loss: $("#vlLoss"), lossU: $("#vlLossU"), lossRo: $("#vlLossRo"),
    drop: $("#vlDrop"), dropV: $("#vlDropV"), eff: $("#vlEff"), Rnote: $("#vlRnote")
  };
  el.V.value = vToSlider(400);

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function compute() {
    const P = (+el.P.value) * 1000;
    const V = sliderToV(+el.V.value);
    const pf = +el.PF.value;
    const R = +el.R.value;
    const three = el.phase.value === "3";

    let I, loss, dV;
    if (three) {
      I = P / (Math.sqrt(3) * V * pf);
      loss = 3 * I * I * R;
      dV = Math.sqrt(3) * I * R * pf;
    } else {
      I = P / (V * pf);
      loss = I * I * R;
      dV = I * R * pf;
    }
    const pct = (dV / V) * 100;
    const eff = (P / (P + loss)) * 100;

    el.Pv.textContent = el.P.value;
    el.Vv.textContent = fmtV(V);
    el.PFv.textContent = pf.toFixed(2);
    el.Rv.textContent = R.toFixed(2);
    el.Rnote.textContent = three
      ? "Per-phase resistance (three-phase). Voltage drop neglects reactance."
      : "Total loop resistance (single-phase, outgoing + return).";

    el.I.textContent = I.toFixed(I >= 100 ? 1 : 2);
    el.Icap.textContent = three ? "I\u2113" : "I";
    if (loss >= 1000) { el.loss.textContent = (loss / 1000).toFixed(2); el.lossU.textContent = "kW"; }
    else { el.loss.textContent = loss.toFixed(1); el.lossU.textContent = "W"; }
    el.lossRo.classList.toggle("warn", loss / P > 0.05);

    el.drop.textContent = pct.toFixed(2);
    el.dropV.textContent = "\u2248 " + dV.toFixed(1) + " V " + (three ? "line-to-line" : "supply");

    el.eff.textContent = eff.toFixed(2);
    el.eff.parentElement.parentElement.classList.toggle("good", eff > 98);
    el.eff.parentElement.parentElement.classList.toggle("warn", eff <= 95);

    return { P, V, pf, R, three, I, loss, dV };
  }

  /* ---------- charts ---------- */
  let c1, c2;
  function gridColor() { return document.documentElement.getAttribute("data-theme") === "light" ? "rgba(30,58,138,.14)" : "rgba(120,150,200,.16)"; }
  function tickColor() { return document.documentElement.getAttribute("data-theme") === "light" ? "#41567a" : "#9db0d0"; }
  function lineColor() { return "#38bdf8"; }

  function logspace(a, b, n) { const out = [], la = Math.log(a), lb = Math.log(b); for (let i = 0; i < n; i++) out.push(Math.exp(la + (lb - la) * i / (n - 1))); return out; }

  function buildCharts() {
    if (typeof Chart === "undefined") return;
    const Vs = logspace(VMIN, VMAX, 70);
    const st = () => ({ P: (+el.P.value) * 1000, pf: +el.PF.value, R: +el.R.value, three: el.phase.value === "3" });

    function currentAt(V, s) { return s.three ? s.P / (Math.sqrt(3) * V * s.pf) : s.P / (V * s.pf); }
    function lossAt(V, s) { const I = currentAt(V, s); return s.three ? 3 * I * I * s.R : I * I * s.R; }

    const s0 = st();
    c1 = new Chart($("#vlChart1"), {
      type: "line",
      data: {
        datasets: [
          { label: "Line current", data: Vs.map(V => ({ x: V, y: currentAt(V, s0) })), borderColor: lineColor(), backgroundColor: "rgba(56,189,248,.12)", fill: true, pointRadius: 0, borderWidth: 2.4, tension: .25 },
          { label: "Operating point", data: [{ x: s0.V || 400, y: currentAt(s0.V || 400, s0) }], borderColor: "#fb923c", backgroundColor: "#fb923c", pointRadius: 5, showLine: false }
        ]
      },
      options: chartOpts("Working voltage (V)", "Line current (A)", true)
    });

    c2 = new Chart($("#vlChart2"), {
      type: "line",
      data: {
        datasets: [
          { label: "Resistive loss", data: Vs.map(V => ({ x: V, y: lossAt(V, s0) })), borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,.12)", fill: true, pointRadius: 0, borderWidth: 2.4, tension: .25 },
          { label: "Operating point", data: [{ x: s0.V || 400, y: lossAt(s0.V || 400, s0) }], borderColor: "#f87171", backgroundColor: "#f87171", pointRadius: 5, showLine: false }
        ]
      },
      options: chartOpts("Working voltage (V)", "Resistive loss (W)", true)
    });
  }

  function chartOpts(xTitle, yTitle, logX) {
    return {
      responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { labels: { color: tickColor(), boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            title: (items) => fmtV(items[0].parsed.x),
            label: (item) => ` ${item.dataset.label}: ${item.parsed.y.toLocaleString(undefined, { maximumFractionDigits: 2 })}${yTitle.includes("loss") ? " W" : " A"}`
          }
        }
      },
      scales: {
        x: {
          type: logX ? "logarithmic" : "linear",
          title: { display: true, text: xTitle, color: tickColor(), font: { size: 11 } },
          grid: { color: gridColor() },
          ticks: { color: tickColor(), font: { size: 10 }, callback: (v) => fmtV(v) }
        },
        y: {
          title: { display: true, text: yTitle, color: tickColor(), font: { size: 11 } },
          grid: { color: gridColor() },
          ticks: { color: tickColor(), font: { size: 10 } },
          beginAtZero: !yTitle.includes("loss")
        }
      }
    };
  }

  function refresh() {
    const r = compute();
    if (!c1) return;
    const st = { P: r.P, pf: r.pf, R: r.R, three: r.three };
    const cur = (V) => st.three ? st.P / (Math.sqrt(3) * V * st.pf) : st.P / (V * st.pf);
    const los = (V) => { const I = cur(V); return st.three ? 3 * I * I * st.R : I * I * st.R; };
    c1.data.datasets[0].data = c1.data.datasets[0].data.map(d => ({ x: d.x, y: cur(d.x) }));
    c1.data.datasets[1].data = [{ x: r.V, y: r.I }];
    c2.data.datasets[0].data = c2.data.datasets[0].data.map(d => ({ x: d.x, y: los(d.x) }));
    c2.data.datasets[1].data = [{ x: r.V, y: r.loss }];
    c1.update("none"); c2.update("none");
  }

  [el.P, el.V, el.PF, el.R].forEach(i => i.addEventListener("input", refresh));
  el.phase.addEventListener("change", refresh);
  document.querySelectorAll("#vlChips .chipbtn").forEach(b => b.addEventListener("click", () => {
    el.V.value = vToSlider(+b.dataset.v); refresh();
  }));
  document.addEventListener("themechange", () => {
    [c1, c2].forEach(ch => {
      if (!ch) return;
      ch.options.scales.x.grid.color = gridColor();
      ch.options.scales.y.grid.color = gridColor();
      ch.options.scales.x.ticks.color = tickColor();
      ch.options.scales.y.ticks.color = tickColor();
      ch.options.scales.x.title.color = tickColor();
      ch.options.scales.y.title.color = tickColor();
      ch.options.plugins.legend.labels.color = tickColor();
      ch.update("none");
    });
  });

  buildCharts();
  refresh();
})();
