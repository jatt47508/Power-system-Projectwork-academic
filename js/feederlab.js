/* ============================================================
   GridLab - Feeder & Distributor Design Lab
   ============================================================ */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  if (!$("#fdP")) return;

  const VMIN = 230, VMAX = 33000;
  const sliderToV = (t) => VMIN * Math.pow(VMAX / VMIN, t / 100);
  const vToSlider = (v) => 100 * Math.log(v / VMIN) / Math.log(VMAX / VMIN);
  const fmtV = (v) => v >= 1000 ? (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + " kV" : Math.round(v) + " V";
  const MAT = {
    cu: { name: "Copper", rho20: 1.72e-8, alpha: 0.00393 },
    al: { name: "Aluminium", rho20: 2.82e-8, alpha: 0.00403 }
  };
  const theme = () => document.documentElement.getAttribute("data-theme");
  const gridColor = () => theme() === "light" ? "rgba(30,58,138,.14)" : "rgba(120,150,200,.16)";
  const tickColor = () => theme() === "light" ? "#41567a" : "#9db0d0";

  const el = {
    P: $("#fdP"), V: $("#fdV"), Len: $("#fdLen"), PF: $("#fdPF"), Mat: $("#fdMat"), Area: $("#fdArea"),
    Temp: $("#fdTemp"), Limit: $("#fdLimit"),
    Pv: $("#fdPv"), Vv: $("#fdVv"), Lenv: $("#fdLenv"), PFv: $("#fdPFv"), Areav: $("#fdAreav"), Tempv: $("#fdTempv"), Limitv: $("#fdLimitv"),
    I: $("#fdI"), R: $("#fdR"), Rnote: $("#fdRnote"), drop: $("#fdDrop"), dropV: $("#fdDropV"),
    loss: $("#fdLoss"), lossU: $("#fdLossU"), lossRo: $("#fdLossRo"),
    verdict: $("#fdVerdict"), verdictTitle: $("#fdVerdictTitle"), verdictMsg: $("#fdVerdictMsg")
  };
  el.V.value = vToSlider(400);

  function rhoT() { const m = MAT[el.Mat.value]; const T = +el.Temp.value; return m.rho20 * (1 + m.alpha * (T - 20)); }

  function compute() {
    const P = (+el.P.value) * 1000;
    const V = sliderToV(+el.V.value);
    const L = +el.Len.value;
    const pf = +el.PF.value;
    const A = +el.Area.value * 1e-6;
    const rho = rhoT();
    const R = rho * L / A;
    const I = P / (Math.sqrt(3) * V * pf);
    const dV = Math.sqrt(3) * I * R * pf;
    const pct = (dV / V) * 100;
    const loss = 3 * I * I * R;
    return { P, V, L, pf, A, rho, R, I, dV, pct, loss };
  }

  function render() {
    const r = compute();
    el.Pv.textContent = el.P.value;
    el.Vv.textContent = fmtV(r.V);
    el.Lenv.textContent = el.Len.value;
    el.PFv.textContent = r.pf.toFixed(2);
    el.Areav.textContent = el.Area.value;
    el.Tempv.textContent = el.Temp.value;
    el.Limitv.textContent = (+el.Limit.value).toFixed(1);

    el.I.textContent = r.I.toFixed(r.I >= 100 ? 1 : 2);
    el.R.textContent = r.R < 1 ? r.R.toFixed(4) : r.R.toFixed(3);
    el.Rnote.textContent = `${MAT[el.Mat.value].name} \u00b7 ${(+el.Temp.value)} \u00b0C corrected \u00b7 ${el.Len.value} m`;

    el.drop.textContent = r.pct.toFixed(2);
    el.dropV.textContent = "\u2248 " + r.dV.toFixed(1) + " V line-to-line";

    if (r.loss >= 1000) { el.loss.textContent = (r.loss / 1000).toFixed(2); el.lossU.textContent = "kW"; }
    else { el.loss.textContent = r.loss.toFixed(1); el.lossU.textContent = "W"; }
    el.lossRo.classList.toggle("warn", r.loss / r.P > 0.05);

    const limit = +el.Limit.value;
    const pass = r.pct <= limit;
    el.verdict.classList.toggle("bad", !pass);
    el.verdict.querySelector(".v-ico").innerHTML = pass ? "&#10004;" : "&#9888;";
    el.verdictTitle.textContent = pass ? "Within permissible drop" : "Exceeds permissible drop";
    el.verdictMsg.textContent = pass
      ? `Estimated drop ${r.pct.toFixed(2)}% is within the configured ${limit}% limit. This is not a safety verification.`
      : `Estimated drop ${r.pct.toFixed(2)}% exceeds the configured ${limit}% limit. Consider a larger cross-section or higher voltage.`;

    if (fdChart) {
      fdChart.data.datasets[0].data = fdAreas.map(a => ({ x: a, y: dropForArea(a, r) }));
      fdChart.data.datasets[1].data = [{ x: +el.Area.value, y: r.pct }];
      fdChart.update("none");
    }
    updateDistributor();
  }

  function dropForArea(areaMm2, r) {
    const R = r.rho * r.L / (areaMm2 * 1e-6);
    const dV = Math.sqrt(3) * r.I * R * r.pf;
    return (dV / r.V) * 100;
  }

  /* ---------- feeder chart ---------- */
  let fdChart;
  const fdAreas = [];
  for (let a = 1; a <= 300; a += 3) fdAreas.push(a);

  function buildFeederChart() {
    if (typeof Chart === "undefined") return;
    const r = compute();
    fdChart = new Chart($("#fdChart"), {
      type: "line",
      data: {
        datasets: [
          { label: "Voltage drop (% of line voltage)", data: fdAreas.map(a => ({ x: a, y: dropForArea(a, r) })), borderColor: "#8b5cf6", backgroundColor: "rgba(139,92,246,.12)", fill: true, pointRadius: 0, borderWidth: 2.4, tension: .2 },
          { label: "Selected conductor", data: [{ x: +el.Area.value, y: r.pct }], borderColor: "#f59e0b", backgroundColor: "#f59e0b", pointRadius: 5, showLine: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
        plugins: {
          legend: { labels: { color: tickColor(), boxWidth: 12, font: { size: 11 } } },
          tooltip: { callbacks: { title: (i) => i[0].parsed.x + " mm\u00b2", label: (i) => ` Drop: ${i.parsed.y.toFixed(2)}%` } }
        },
        scales: {
          x: { type: "linear", title: { display: true, text: "Cross-sectional area (mm\u00b2)", color: tickColor(), font: { size: 11 } }, grid: { color: gridColor() }, ticks: { color: tickColor(), font: { size: 10 } } },
          y: { beginAtZero: true, title: { display: true, text: "Voltage drop (%)", color: tickColor(), font: { size: 11 } }, grid: { color: gridColor() }, ticks: { color: tickColor(), font: { size: 10 } } }
        }
      }
    });
  }

  /* ---------- distributor profile ---------- */
  const DIST_V = 400, DIST_PF = 0.8;
  const distLoads = [
    { kW: 20, m: 100 },
    { kW: 15, m: 200 },
    { kW: 10, m: 300 }
  ];
  let distChart;

  function buildDistInputs() {
    $("#distInputs").innerHTML = distLoads.map((l, i) =>
      `<div class="dload"><h4>Load ${i + 1}</h4><div class="drow">
        <div><label>Power (kW)</label><input type="number" min="0" step="1" value="${l.kW}" data-i="${i}" data-k="kW"></div>
        <div><label>Distance (m)</label><input type="number" min="0" step="10" value="${l.m}" data-i="${i}" data-k="m"></div>
      </div></div>`).join("");
    document.querySelectorAll("#distInputs input").forEach(inp => {
      inp.addEventListener("input", () => {
        const i = +inp.dataset.i, k = inp.dataset.k;
        let v = parseFloat(inp.value);
        if (isNaN(v) || v < 0) v = 0;
        distLoads[i][k] = v;
        updateDistributor();
      });
    });
  }

  function updateDistributor() {
    const r = compute();
    const Rperm = r.rho / r.A; // ohms per metre per phase
    const loads = distLoads.filter(l => l.kW > 0 && l.m > 0).sort((a, b) => a.m - b.m);

    // segment currents (current carried from previous point to this load)
    let V0 = DIST_V, xs = [0], ys = [DIST_V], xPrev = 0, dropTotal = 0;
    // total current
    const Ic = (kW) => (kW * 1000) / (Math.sqrt(3) * DIST_V * DIST_PF);
    // build cumulative
    let remaining = loads.reduce((s, l) => s + l.kW, 0);
    loads.forEach((l, idx) => {
      const segLen = l.m - xPrev;
      const Iseg = Ic(remaining);            // current in this segment (all downstream loads)
      const drop = Math.sqrt(3) * Iseg * Rperm * segLen * DIST_PF;
      V0 -= drop; dropTotal += drop;
      xs.push(l.m); ys.push(V0);
      xPrev = l.m;
      remaining -= l.kW;
    });

    if (distChart) {
      distChart.data.labels = xs.map(x => x + " m");
      distChart.data.datasets[0].data = ys;
      distChart.update("none");
    }
    const pct = dropTotal / DIST_V * 100;
    const minV = ys[ys.length - 1];
    $("#distSummary").innerHTML = loads.length
      ? `Conductor: ${MAT[el.Mat.value].name}, ${el.Area.value} mm&sup2; &middot; R &asymp; ${(Rperm * 100).toFixed(4)} &#937; per 100 m per phase. ` +
        `Total drop &asymp; <b>${dropTotal.toFixed(2)} V (${pct.toFixed(2)}%)</b>; minimum line voltage &asymp; <b>${minV.toFixed(1)} V</b>. Educational estimate (X neglected).`
      : `Enter at least one load with a positive power and distance.`;
  }

  function buildDistChart() {
    if (typeof Chart === "undefined") return;
    distChart = new Chart($("#distChart"), {
      type: "line",
      data: { labels: [], datasets: [
        { label: "Line voltage along distributor (V)", data: [], borderColor: "#38bdf8", backgroundColor: "rgba(56,189,248,.12)", fill: true, pointRadius: 4, borderWidth: 2.6, tension: .15 }
      ] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
        plugins: {
          legend: { labels: { color: tickColor(), boxWidth: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: (i) => ` ${i.parsed.y.toFixed(1)} V` } }
        },
        scales: {
          x: { title: { display: true, text: "Distance from source", color: tickColor(), font: { size: 11 } }, grid: { color: gridColor() }, ticks: { color: tickColor(), font: { size: 10 } } },
          y: { title: { display: true, text: "Line voltage (V)", color: tickColor(), font: { size: 11 } }, grid: { color: gridColor() }, ticks: { color: tickColor(), font: { size: 10 } } }
        }
      }
    });
  }

  /* ---------- wiring ---------- */
  [el.P, el.V, el.Len, el.PF, el.Area, el.Temp, el.Limit].forEach(i => i.addEventListener("input", render));
  el.Mat.addEventListener("change", render);
  document.querySelectorAll("#fdChips .chipbtn").forEach(b => b.addEventListener("click", () => {
    el.V.value = vToSlider(+b.dataset.v); render();
  }));
  document.addEventListener("themechange", () => {
    [fdChart, distChart].forEach(ch => {
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

  buildFeederChart();
  buildDistInputs();
  buildDistChart();
  render();
})();
