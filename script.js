/* ============================================================
   GridLab - core interactions
   ============================================================ */
(function () {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- THEME ---------- */
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("gridlab-theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  $("#themeBtn").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("gridlab-theme", next);
    document.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  });

  /* ---------- MOBILE NAV ---------- */
  const nav = $("#nav");
  $("#menuBtn").addEventListener("click", () => nav.classList.toggle("open"));
  $$("#nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

  /* ---------- SCROLL REVEAL ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$(".reveal").forEach(el => io.observe(el));

  /* ---------- ACTIVE NAV ON SCROLL ---------- */
  const sections = $$("main .section");
  const navLinks = $$("#nav a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(s => spy.observe(s));

  /* ---------- STAT COUNTERS ---------- */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count;
      let cur = 0; const step = Math.max(1, target / 40);
      const t = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(t); }
        el.textContent = Math.round(cur);
      }, 20);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$(".stat .num").forEach(el => cio.observe(el));

  /* ============================================================
     SYSTEM DIAGRAM
     ============================================================ */
  const KIND_COLOR = { gen: "#f59e0b", trans: "#2563eb", prim: "#8b5cf6", sec: "#38bdf8", load: "#34d399" };
  const STAGES = [
    { id: "gen", label: "Generating\nstation", kind: "gen",
      fn: "Converts mechanical energy (turbine) into electrical energy at the generating station.",
      volt: "Generation voltage (e.g. 11 kV)", role: "Source of electrical energy for the power system." },
    { id: "sutx", label: "Step-up\ntransformer", kind: "trans",
      fn: "Raises the generation voltage to a high transmission level to reduce current and losses.",
      volt: "Step-up to transmission kV", role: "Enables efficient long-distance transfer." },
    { id: "trans", label: "Transmission\nnetwork", kind: "trans",
      fn: "Bulk transfer of power over long distances at high voltage between stations and load centres.",
      volt: "High voltage (kV range)", role: "Moves large power quantities with low losses." },
    { id: "sub", label: "Distribution\nsubstation", kind: "prim",
      fn: "Steps transmission voltage down and feeds one or more primary distribution feeders.",
      volt: "Primary distribution kV", role: "Interface between transmission and distribution." },
    { id: "feeder", label: "Primary\ndistribution feeder", kind: "prim",
      fn: "Carries power from the substation to distribution points. No consumer tapped along the route.",
      volt: "Medium (e.g. 11 kV / 33 kV)", role: "Sized mainly by current capacity and voltage drop." },
    { id: "dtx", label: "Distribution\ntransformer", kind: "sec",
      fn: "Steps the primary voltage down to the low-voltage utilisation level.",
      volt: "To LV (e.g. 415 V / 230 V)", role: "Supplies the secondary distribution network." },
    { id: "dist", label: "LV\ndistributor", kind: "sec",
      fn: "Consumers are tapped along its length, so current varies along the line.",
      volt: "Low voltage (e.g. 415 V)", role: "Designed mainly by permissible voltage drop." },
    { id: "service", label: "Service\nmains", kind: "sec",
      fn: "The final conductor connecting a distributor to an individual consumer's premises.",
      volt: "Low voltage (e.g. 230 V)", role: "Sized by consumer load and voltage-drop limits." },
    { id: "load", label: "Consumers", kind: "load",
      fn: "Domestic, commercial, and industrial loads that consume the delivered electrical energy.",
      volt: "Utilisation voltage", role: "End users of the distribution network." }
  ];

  function renderSysDiagram() {
    const W = 1090, H = 170, x0 = 40, step = 124, cy = 62;
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Power system flow diagram">`;
    // flow arrows
    for (let i = 0; i < STAGES.length - 1; i++) {
      const x1 = x0 + i * step + 48, x2 = x0 + (i + 1) * step - 48;
      svg += `<line class="flow-line" x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}"/>`;
      svg += `<line class="flow-live" x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}"/>`;
      svg += `<polygon points="${x2},${cy} ${x2 - 9},${cy - 5} ${x2 - 9},${cy + 5}" fill="${KIND_COLOR[STAGES[i + 1].kind]}"/>`;
    }
    STAGES.forEach((s, i) => {
      const cx = x0 + i * step, c = KIND_COLOR[s.kind];
      const lines = s.label.split("\n");
      svg += `<g class="stage" data-id="${s.id}" tabindex="0" role="button" aria-label="${s.label.replace("\n", " ")}">`;
      svg += `<rect class="box" x="${cx - 46}" y="${cy - 28}" width="92" height="56" rx="12" fill="${c}1f" stroke="${c}"/>`;
      svg += `<circle cx="${cx - 32}" cy="${cy - 14}" r="4" fill="${c}"/>`;
      lines.forEach((ln, li) => {
        svg += `<text class="st-label" x="${cx}" y="${cy + 2 + li * 15}" text-anchor="middle">${ln}</text>`;
      });
      svg += `</g>`;
    });
    svg += `</svg>`;
    $("#sysDiagram").innerHTML = svg;

    $$(".stage", $("#sysDiagram")).forEach(g => {
      const show = () => {
        const s = STAGES.find(x => x.id === g.dataset.id);
        $$(".stage").forEach(el => el.classList.remove("active"));
        g.classList.add("active");
        $("#sysInfo").innerHTML =
          `<h3>${s.label.replace("\n", " ")}</h3><p>${s.fn}</p>
           <div class="kv"><span>&#9889; ${s.volt}</span><span>&#128279; ${s.role}</span></div>`;
      };
      g.addEventListener("click", show);
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); } });
    });
  }
  renderSysDiagram();

  /* ============================================================
     CLASSIFICATION
     ============================================================ */
  const PROS = "pros", CONS = "cons";
  const AXES = [
    {
      id: "current", name: "By type of current",
      cats: [
        {
          name: "AC distribution", def: "Electrical energy is distributed using alternating current, whose magnitude and direction change periodically.",
          principle: "Transformers allow AC voltage to be raised or lowered easily, making AC the standard for conventional distribution. Supply may be single-phase or three-phase.",
          pros: ["Voltage can be changed using transformers.", "Three-phase AC suits industrial loads and motors.", "Widely established, economical infrastructure."],
          cons: ["Reactive power considerations (power factor).", "Skin effect and AC losses at high frequency."],
          apps: "Domestic, commercial, and industrial supply; the dominant distribution type.",
          compare: "Compared with DC, AC is easier to transform and is the established standard for bulk distribution.",
          sch: svgAC()
        },
        {
          name: "DC distribution", def: "Electrical energy is distributed using direct current, which flows in one direction.",
          principle: "Voltage conversion uses power-electronic converters rather than transformers. Used where DC is generated or consumed directly.",
          pros: ["Suitable for battery storage and DC loads.", "No reactive power in purely DC circuits.", "Useful in renewable energy and modern electronics."],
          cons: ["Voltage transformation is less conventional than AC.", "Limited established distribution infrastructure."],
          apps: "Battery systems, EV charging, data centres, specialised industrial systems, HVDC links.",
          compare: "Compared with AC, DC avoids reactive-power issues but is less convenient for conventional transformation and distribution.",
          sch: svgDC()
        }
      ]
    },
    {
      id: "phases", name: "By phases &amp; wires",
      cats: [
        {
          name: "Single-phase", def: "Distribution using one phase and a neutral (with earth). Typically two or three wires.",
          principle: "A single alternating voltage is supplied between phase and neutral; used for light, domestic, and small loads.",
          pros: ["Simple and economical for small loads.", "Adequate for domestic lighting and appliances."],
          cons: ["Less efficient for large power transfer.", "Not suitable for large three-phase motor loads."],
          apps: "Domestic lighting, fans, and small appliances (e.g. ~230 V, 50 Hz in India).",
          compare: "Compared with three-phase, single-phase transfers less power for the same conductor and is used mainly for smaller loads.",
          sch: svgSingle()
        },
        {
          name: "Three-phase", def: "Distribution using three phases, optionally with a neutral. Typically three or four wires.",
          principle: "Three voltages displaced by 120&deg; deliver constant power and support efficient power transfer.",
          pros: ["Transmits more power efficiently.", "Suits three-phase induction motors and industrial equipment.", "Balanced loading and better utilisation."],
          cons: ["More conductors and more complex protection.", "Requires balanced loading in practice."],
          apps: "Industrial installations, commercial buildings, large loads (e.g. ~415 V line, 230 V phase).",
          compare: "Compared with single-phase, three-phase is more efficient for large power and is standard for industry.",
          sch: svgThree()
        }
      ]
    },
    {
      id: "construction", name: "By method of construction",
      cats: [
        {
          name: "Overhead", def: "Conductors are installed above ground on poles, towers, and insulators.",
          principle: "Air provides insulation and cooling; poles/towers support the conductors with adequate clearance.",
          pros: ["Lower initial installation cost.", "Faults easier to locate and repair.", "Extensions and modifications are simple."],
          cons: ["Exposed to storms, lightning, and falling trees.", "Requires clearance and supporting structures.", "May affect the appearance of urban areas."],
          apps: "Rural and suburban distribution where cost and accessibility matter.",
          compare: "Compared with underground, overhead is cheaper and easier to service but more exposed to weather.",
          sch: svgOverhead()
        },
        {
          name: "Underground", def: "Insulated cables are installed below ground in trenches, ducts, or conduits.",
          principle: "The ground and cable insulation protect conductors; access is via manholes and joint bays.",
          pros: ["Better protection from weather.", "Improved appearance of urban areas.", "Reduced accidental contact."],
          cons: ["Higher installation cost.", "Fault location and repair are more difficult.", "Specialised equipment and maintenance."],
          apps: "Dense urban areas, city centres, and locations where appearance or safety is important.",
          compare: "Compared with overhead, underground is costlier and harder to service but more protected and tidier.",
          sch: svgUnderground()
        }
      ]
    },
    {
      id: "network", name: "By network configuration",
      cats: [
        {
          name: "Radial", def: "Each consumer or area is fed through a single main path from the supply point.",
          principle: "A single path of supply branches out to loads; no alternative path exists.",
          pros: ["Simple design and operation.", "Low initial cost.", "Easy fault isolation at the source."],
          cons: ["A fault in the path interrupts all downstream loads.", "Poorer voltage regulation on long, loaded lines."],
          apps: "Rural areas, small towns, and low-cost networks.",
          compare: "Compared with ring and interconnected systems, radial is cheapest and simplest but least reliable.",
          sch: netRadial()
        },
        {
          name: "Ring main", def: "The distributor forms a closed loop around the load area.",
          principle: "Consumers may receive power from either direction; an alternative path may be available through switching.",
          pros: ["Improved supply continuity (with switching).", "Greater flexibility during maintenance.", "Potentially better voltage regulation."],
          cons: ["Higher cost than radial.", "More complex protection and switching."],
          apps: "Urban areas, commercial complexes, and industrial installations.",
          compare: "Compared with radial, ring main can improve continuity, but only where switching, protection, and alternative paths are properly provided.",
          sch: netRing()
        },
        {
          name: "Interconnected", def: "Two or more substations or networks are linked, giving multiple supply paths.",
          principle: "Power can be supplied through multiple interconnected paths, improving reliability and load sharing.",
          pros: ["High reliability.", "Improved load sharing.", "Greater operational flexibility."],
          cons: ["Higher capital cost.", "Most complex protection, coordination, and control."],
          apps: "Large cities, major industrial areas, and important load centres.",
          compare: "Compared with ring and radial, interconnected systems give the highest reliability at the highest cost and complexity.",
          sch: netMesh()
        }
      ]
    }
  ];

  function renderAxis() {
    $("#classAxis").innerHTML = AXES.map((a, i) =>
      `<button class="axis-btn ${i === 0 ? "active" : ""}" data-axis="${a.id}">${a.name}</button>`).join("");
    $$("#classAxis .axis-btn").forEach(b => b.addEventListener("click", () => {
      $$("#classAxis .axis-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      renderClassBody(AXES.find(a => a.id === b.dataset.axis));
    }));
    renderClassBody(AXES[0]);
  }

  function renderClassBody(axis) {
    const catTabs = axis.cats.map((c, i) =>
      `<button class="cat-btn ${i === 0 ? "active" : ""}" data-cat="${i}">${c.name}</button>`).join("");
    $("#classBody").innerHTML = `<div class="cat-tabs" id="catTabs">${catTabs}</div>
      <div class="panel-grid"><div class="cat-content" id="catContent"></div><div class="sch" id="catSch"></div></div>`;
    const showCat = (i) => {
      const c = axis.cats[i];
      $("#catContent").innerHTML =
        `<h3>${c.name}</h3><p>${c.def}</p>
         <p class="mt"><b>Operating principle:</b> ${c.principle}</p>
         <ul class="cat-list ${PROS}">${c.pros.map(x => `<li>${x}</li>`).join("")}</ul>
         <ul class="cat-list ${CONS}">${c.cons.map(x => `<li>${x}</li>`).join("")}</ul>
         <p class="mt"><b>Typical applications:</b> ${c.apps}</p>
         <p class="mt"><b>Comparison:</b> ${c.compare}</p>`;
      $("#catSch").innerHTML = c.sch;
    };
    $$("#catTabs .cat-btn").forEach(b => b.addEventListener("click", () => {
      $$("#catTabs .cat-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      showCat(+b.dataset.cat);
    }));
    showCat(0);
  }

  /* ---------- classification schematics ---------- */
  function svgAC() {
    return `<svg viewBox="0 0 360 200">
      <line class="wiresolid" x1="40" y1="100" x2="320" y2="100"/>
      <path class="live" d="M40 100 Q70 40 100 100 T160 100 T220 100 T280 100 T320 100" fill="none"/>
      <circle class="src" cx="40" cy="100" r="14"/><text x="40" y="132" text-anchor="middle">AC source</text>
      <circle class="ld" cx="320" cy="100" r="13"/><text x="320" y="132" text-anchor="middle">Load</text>
      <text x="180" y="40" text-anchor="middle">alternating current</text></svg>`;
  }
  function svgDC() {
    return `<svg viewBox="0 0 360 200">
      <line class="wiresolid" x1="60" y1="100" x2="300" y2="100"/>
      <line class="live" x1="60" y1="100" x2="300" y2="100"/>
      <line x1="150" y1="80" x2="150" y2="120" stroke="#f59e0b" stroke-width="3"/>
      <line x1="170" y1="90" x2="170" y2="110" stroke="#f59e0b" stroke-width="3"/>
      <text x="160" y="65" text-anchor="middle" fill="#f59e0b">battery</text>
      <circle class="ld" cx="300" cy="100" r="13"/><text x="300" y="132" text-anchor="middle">Load</text>
      <text x="180" y="165" text-anchor="middle">one-directional current</text></svg>`;
  }
  function svgSingle() {
    return `<svg viewBox="0 0 360 200">
      <line class="wiresolid" x1="50" y1="70" x2="310" y2="70"/>
      <line class="live" x1="50" y1="70" x2="310" y2="70"/>
      <line class="wire" x1="50" y1="130" x2="310" y2="130"/>
      <text x="30" y="74" text-anchor="end">L</text><text x="30" y="134" text-anchor="end">N</text>
      <circle class="src" cx="50" cy="100" r="13"/><text x="50" y="165" text-anchor="middle">230 V</text>
      <circle class="ld" cx="310" cy="100" r="13"/><text x="310" y="165" text-anchor="middle">Load</text>
      <text x="180" y="35" text-anchor="middle">phase + neutral</text></svg>`;
  }
  function svgThree() {
    return `<svg viewBox="0 0 360 200">
      <line class="wiresolid" x1="60" y1="50" x2="300" y2="50"/>
      <line class="live" x1="60" y1="50" x2="300" y2="50"/>
      <line class="live" x1="60" y1="95" x2="300" y2="95" style="animation-delay:.3s"/>
      <line class="live" x1="60" y1="140" x2="300" y2="140" style="animation-delay:.6s"/>
      <line class="wire" x1="60" y1="175" x2="300" y2="175"/>
      <text x="48" y="54" text-anchor="end">R</text><text x="48" y="99" text-anchor="end">Y</text><text x="48" y="144" text-anchor="end">B</text><text x="48" y="179" text-anchor="end">N</text>
      <circle class="src" cx="60" cy="112" r="12"/><text x="60" y="15" text-anchor="middle">415 V line</text>
      <circle class="ld" cx="300" cy="95" r="12"/></svg>`;
  }
  function svgOverhead() {
    return `<svg viewBox="0 0 360 200">
      <line x1="90" y1="150" x2="90" y2="60" stroke="#94a3b8" stroke-width="4"/>
      <line x1="60" y1="70" x2="120" y2="70" stroke="#94a3b8" stroke-width="4"/>
      <line x1="270" y1="150" x2="270" y2="60" stroke="#94a3b8" stroke-width="4"/>
      <line x1="240" y1="70" x2="300" y2="70" stroke="#94a3b8" stroke-width="4"/>
      <path class="live" d="M60 80 Q180 130 240 80" fill="none"/>
      <path class="live" d="M60 90 Q180 145 240 90" fill="none" style="animation-delay:.4s"/>
      <line x1="20" y1="150" x2="340" y2="150" stroke="#64748b" stroke-width="2"/>
      <text x="180" y="175" text-anchor="middle">ground level</text>
      <text x="180" y="35" text-anchor="middle">conductors on poles</text></svg>`;
  }
  function svgUnderground() {
    return `<svg viewBox="0 0 360 200">
      <line x1="10" y1="70" x2="350" y2="70" stroke="#64748b" stroke-width="2"/>
      <text x="180" y="60" text-anchor="middle" fill="#94a3b8">ground level</text>
      <rect x="10" y="70" width="340" height="110" fill="rgba(120,90,60,.18)"/>
      <rect x="60" y="110" width="240" height="34" rx="17" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
      <line class="live" x1="60" y1="127" x2="300" y2="127"/>
      <text x="180" y="170" text-anchor="middle" fill="#94a3b8">buried insulated cable</text></svg>`;
  }
  function netRadial() {
    return `<svg viewBox="0 0 360 220">
      <line class="wire" x1="50" y1="110" x2="160" y2="110"/>
      <line class="wire" x1="160" y1="110" x2="160" y2="55"/>
      <line class="wire" x1="160" y1="110" x2="160" y2="165"/>
      <line class="wire" x1="160" y1="55" x2="300" y2="55"/>
      <line class="wire" x1="160" y1="165" x2="300" y2="165"/>
      <line class="live" x1="50" y1="110" x2="160" y2="110"/>
      <line class="live" x1="160" y1="110" x2="160" y2="55"/><line class="live" x1="160" y1="55" x2="300" y2="55" style="animation-delay:.3s"/>
      <line class="live" x1="160" y1="110" x2="160" y2="165"/><line class="live" x1="160" y1="165" x2="300" y2="165" style="animation-delay:.5s"/>
      <circle class="src" cx="50" cy="110" r="13"/><text x="50" y="140" text-anchor="middle">Sub</text>
      <circle class="ld" cx="300" cy="55" r="12"/><text x="300" y="35" text-anchor="middle">L1</text>
      <circle class="ld" cx="300" cy="165" r="12"/><text x="300" y="195" text-anchor="middle">L2</text>
      <circle cx="160" cy="110" r="5" fill="#38bdf8"/></svg>`;
  }
  function netRing() {
    return `<svg viewBox="0 0 360 220">
      <ellipse class="wire" cx="180" cy="115" rx="125" ry="72"/>
      <ellipse class="live" cx="180" cy="115" rx="125" ry="72"/>
      <circle class="src" cx="180" cy="43" r="13"/><text x="180" y="25" text-anchor="middle">Sub</text>
      <circle class="ld" cx="305" cy="115" r="12"/><text x="330" y="119" text-anchor="middle">L1</text>
      <circle class="ld" cx="180" cy="187" r="12"/><text x="180" y="212" text-anchor="middle">L2</text>
      <circle class="ld" cx="55" cy="115" r="12"/><text x="32" y="119" text-anchor="middle">L3</text></svg>`;
  }
  function netMesh() {
    return `<svg viewBox="0 0 360 220">
      <line class="wire" x1="60" y1="55" x2="300" y2="55"/><line class="wire" x1="300" y1="55" x2="300" y2="165"/>
      <line class="wire" x1="300" y1="165" x2="60" y2="165"/><line class="wire" x1="60" y1="165" x2="60" y2="55"/>
      <line class="wire" x1="60" y1="55" x2="300" y2="165"/><line class="wire" x1="300" y1="55" x2="60" y2="165"/>
      <line class="wire" x1="60" y1="55" x2="180" y2="110"/><line class="wire" x1="300" y1="55" x2="180" y2="110"/>
      <line class="wire" x1="60" y1="165" x2="180" y2="110"/><line class="wire" x1="300" y1="165" x2="180" y2="110"/>
      <line class="live" x1="60" y1="55" x2="300" y2="55"/><line class="live" x1="300" y1="55" x2="300" y2="165" style="animation-delay:.3s"/>
      <line class="live" x1="60" y1="165" x2="60" y2="55" style="animation-delay:.6s"/>
      <circle class="src" cx="60" cy="55" r="12"/><text x="45" y="40" text-anchor="middle">S1</text>
      <circle class="src" cx="300" cy="165" r="12"/><text x="320" y="185" text-anchor="middle">S2</text>
      <circle class="ld" cx="300" cy="55" r="11"/><circle class="ld" cx="60" cy="165" r="11"/>
      <circle cx="180" cy="110" r="5" fill="#38bdf8"/></svg>`;
  }

  renderAxis();

  /* ============================================================
     NETWORK EXPLORER
     ============================================================ */
  const NETS = {
    radial: {
      name: "Radial distribution system",
      desc: "A single path feeds each load. With a line outage, everything downstream of the fault loses supply &mdash; there is no alternative path unless a separate feeder exists.",
      svg: (fault) => {
        const f = fault;
        return `<svg viewBox="0 0 460 300">
          <line class="wire" x1="70" y1="150" x2="200" y2="150"/>
          <line class="live" x1="70" y1="150" x2="200" y2="150"/>
          <line class="wire" x1="200" y1="150" x2="200" y2="80"/>
          <line class="live" x1="200" y1="150" x2="200" y2="80"/>
          <line class="wire" x1="200" y1="80" x2="360" y2="80"/>
          <line class="live" x1="200" y1="80" x2="360" y2="80" style="animation-delay:.3s"/>
          <line class="wire" x1="200" y1="150" x2="200" y2="220"/>
          <line class="${f ? "live-fault" : "live"}" x1="200" y1="150" x2="200" y2="220"/>
          <line class="${f ? "live dim" : "live"}" x1="200" y1="220" x2="360" y2="220" style="animation-delay:.5s"/>
          <circle class="src" cx="70" cy="150" r="15"/><text x="70" y="182" text-anchor="middle">Substation</text>
          <rect x="188" y="142" width="24" height="16" rx="3" fill="none" stroke="#94a3b8"/>
          <text x="200" y="132" text-anchor="middle">bus</text>
          <circle class="ld" cx="360" cy="80" r="14"/><text x="360" y="58" text-anchor="middle">L1</text>
          <circle class="ld ${f ? "dim" : ""}" cx="360" cy="220" r="14"/><text x="360" y="250" text-anchor="middle">L2</text>
          ${f ? `<g class="faultmark"><line x1="188" y1="196" x2="212" y2="204" stroke="#f87171" stroke-width="3"/><line x1="188" y1="204" x2="212" y2="196" stroke="#f87171" stroke-width="3"/><text x="200" y="238" text-anchor="middle" fill="#f87171">fault</text></g>` : ""}
        </svg>`;
      },
      onFault(fault) {
        return fault
          ? `<span class="fault">&#9888; FAULT</span> on the L2 branch.\n<span class="ok">&#10003;</span> L1 branch stays energised.\n<span class="warn">&#10007;</span> L2 load loses supply &mdash; no alternative path.\nRadial systems are cheap and simple but least reliable.`
          : `<span class="ok">&#9679; Normal operation.</span>\nPower flows from the substation along a single path to each load.`;
      }
    },
    ring: {
      name: "Ring main distribution system",
      desc: "The distributor forms a closed loop. When a segment is faulted, the fault is isolated and supply may be restored through the <b>alternative path</b> &mdash; provided switching and protection are correctly installed.",
      svg: (fault) => {
        let s = `<svg viewBox="0 0 460 300"><ellipse class="wire" cx="230" cy="150" rx="160" ry="95"/>`;
        s += `<ellipse class="${fault ? "live" : "live"}" cx="230" cy="150" rx="160" ry="95"/>`;
        // faulted arc approximation (right side) replaced by dim
        if (fault) s += `<path class="overlay-fault" d="M355 90 A160 95 0 0 1 355 210" fill="none" stroke="#f87171" stroke-width="3" stroke-dasharray="4 8"/>`;
        s += `<circle class="src" cx="230" cy="55" r="15"/><text x="230" y="34" text-anchor="middle">Substation</text>`;
        s += `<circle class="ld" cx="390" cy="150" r="14"/><text x="420" y="154" text-anchor="middle">L1</text>`;
        s += `<circle class="ld" cx="230" cy="245" r="14"/><text x="230" y="278" text-anchor="middle">L2</text>`;
        s += `<circle class="ld" cx="70" cy="150" r="14"/><text x="40" y="154" text-anchor="middle">L3</text>`;
        s += `</svg>`;
        return s;
      },
      onFault(fault) {
        return fault
          ? `<span class="fault">&#9888; FAULT</span> on a ring segment (right side).\n<span class="warn">&#8635;</span> Switchgear isolates the fault.\n<span class="ok">&#10003;</span> Supply continues via the other direction.\nContinuity depends on working switching &amp; protection &mdash; not the topology alone.`
          : `<span class="ok">&#9679; Normal operation.</span>\nLoop is closed; loads can be fed from either direction.`;
      }
    },
    mesh: {
      name: "Interconnected distribution system",
      desc: "Two or more substations are linked. A faulted section can be isolated while the rest of the network keeps running through the remaining paths, sharing load between sources.",
      svg: (fault) => {
        let s = `<svg viewBox="0 0 460 300">`;
        const edges = [
          [80, 70, 380, 70], [380, 70, 380, 230], [380, 230, 80, 230], [80, 230, 80, 70],
          [80, 70, 380, 230], [380, 70, 80, 230],
          [80, 70, 230, 150], [380, 70, 230, 150], [80, 230, 230, 150], [380, 230, 230, 150]
        ];
        edges.forEach((e, i) => { s += `<line class="wire" x1="${e[0]}" y1="${e[1]}" x2="${e[2]}" y2="${e[3]}"/>`; });
        const liveEdges = [[80, 70, 380, 70], [380, 70, 380, 230], [80, 230, 80, 70]];
        liveEdges.forEach((e, i) => { s += `<line class="live" x1="${e[0]}" y1="${e[1]}" x2="${e[2]}" y2="${e[3]}" style="animation-delay:${i * .3}s"/>`; });
        if (fault) s += `<line x1="380" y1="230" x2="80" y2="230" stroke="#f87171" stroke-width="3" stroke-dasharray="5 8"/>`;
        s += `<circle class="src" cx="80" cy="70" r="14"/><text x="60" y="52" text-anchor="middle">S1</text>`;
        s += `<circle class="src" cx="380" cy="230" r="14"/><text x="402" y="250" text-anchor="middle">S2</text>`;
        s += `<circle class="ld" cx="380" cy="70" r="13"/><circle class="ld" cx="80" cy="230" r="13"/><circle cx="230" cy="150" r="5" fill="#38bdf8"/>`;
        s += `</svg>`;
        return s;
      },
      onFault(fault) {
        return fault
          ? `<span class="fault">&#9888; FAULT</span> on a link between S1 and S2.\n<span class="ok">&#10003;</span> Faulted link isolated by protection.\n<span class="ok">&#10003;</span> Loads remain fed via other paths; sources share load.\nHighest reliability &mdash; at the highest cost and complexity.`
          : `<span class="ok">&#9679; Normal operation.</span>\nMultiple paths share load between substations.`;
      }
    }
  };

  let curNet = "radial", curFault = false;
  function renderNet() {
    const n = NETS[curNet];
    $("#netDiagram").innerHTML = n.svg(curFault);
    $("#netInfo").innerHTML = `<h3>${n.name}</h3><p>${n.desc}</p>`;
    $("#eventLog").innerHTML = n.onFault(curFault);
  }
  $$("#netSeg .seg-btn").forEach(b => b.addEventListener("click", () => {
    $$("#netSeg .seg-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    curNet = b.dataset.net;
    renderNet();
  }));
  $("#faultToggle").addEventListener("change", e => { curFault = e.target.checked; renderNet(); });
  renderNet();

  /* ============================================================
     WORKED EXAMPLES
     ============================================================ */
  const RT3 = Math.sqrt(3);
  function I3(PkW, V, pf) { return (PkW * 1000) / (RT3 * V * pf); }
  function loss3(I, R) { return 3 * I * I * R; }
  function fmtW(x) { return x >= 1000 ? (x / 1000).toFixed(2) + " kW" : x.toFixed(1) + " W"; }

  function renderExamples() {
    // Example 1
    const I400 = I3(100, 400, 0.8), I11k = I3(100, 11000, 0.8);
    // Example 2
    const L400 = loss3(I400, 0.1), L11k = loss3(I11k, 0.1);
    // Example 3 : distributor, two loads
    const V = 400, pf = 0.8;
    const totP = 50, Iseg1 = I3(totP, V, pf);
    const Iseg2 = I3(20, V, pf);
    const Rseg = 0.1;
    const dV1 = RT3 * Iseg1 * Rseg * pf;
    const dV2 = RT3 * Iseg2 * Rseg * pf;
    const dVtot = dV1 + dV2;
    const dVpct = (dVtot / V) * 100;

    const ex1 = {
      title: "Current at two working voltages",
      badge: "Three-phase &middot; 100 kW &middot; cos&#966; 0.8",
      given: `Active power P = 100 kW; power factor cos&#966; = 0.8; compare line voltages V&#8343; = 400 V and 11 kV.`,
      formula: `I&#8343; = P / (&#8730;3 &middot; V&#8343; &middot; cos&#966;)`,
      steps: [
        `At 400 V: I&#8343; = 100000 / (&#8730;3 &times; 400 &times; 0.8) = ${I400.toFixed(2)} A`,
        `At 11 kV: I&#8343; = 100000 / (&#8730;3 &times; 11000 &times; 0.8) = ${I11k.toFixed(2)} A`,
        `Voltage ratio = 11000 / 400 = ${(11000 / 400).toFixed(1)}`
      ],
      answer: `Current falls from <b>${I400.toFixed(2)} A</b> to <b>${I11k.toFixed(2)} A</b> &mdash; a reduction of ~${(11000 / 400).toFixed(1)}&times;, matching the voltage ratio.`,
      interp: "Raising the working voltage cuts the current needed for the same power and power factor.",
      note: "Assumes constant power and power factor and steady-state balanced operation."
    };

    const ex2 = {
      title: "Resistive loss at two working voltages",
      badge: "Assumed R = 0.1 &#937; / phase",
      given: `Same 100 kW, cos&#966; 0.8 system, with an assumed per-phase conductor resistance R = 0.1 &#937; in both cases (to isolate the effect of voltage).`,
      formula: `P<sub>loss</sub> = 3 &middot; I&#8343;&sup2; &middot; R`,
      steps: [
        `At 400 V: P<sub>loss</sub> = 3 &times; ${I400.toFixed(2)}&sup2; &times; 0.1 = ${fmtW(L400)}`,
        `At 11 kV: P<sub>loss</sub> = 3 &times; ${I11k.toFixed(2)}&sup2; &times; 0.1 = ${fmtW(L11k)}`,
        `Loss ratio = ${(L400 / L11k).toFixed(0)}&times;`
      ],
      answer: `Loss falls from <b>${fmtW(L400)}</b> to <b>${fmtW(L11k)}</b>.`,
      interp: "Because loss varies with the square of current (and current is inversely proportional to voltage), loss falls with the square of the voltage ratio.",
      note: "Identical resistance is used only to demonstrate the mathematical relationship. A real 400 V and 11 kV installation would use different, appropriately sized conductors."
    };

    const ex3 = {
      title: "Voltage drop in a distributor",
      badge: "Three-phase &middot; 400 V &middot; two tapped loads",
      given: `A 400 V (line), cos&#966; 0.8 three-phase distributor feeds 30 kW at 100 m and a further 20 kW at 200 m from the source. Per-phase conductor resistance = 0.10 &#937; per 100 m.`,
      formula: `I&#8343; = P / (&#8730;3 &middot; V&#8343; &middot; cos&#966;) &nbsp;&nbsp;|&nbsp;&nbsp; &#916;V &#8776; &#8730;3 &middot; I&#8343; &middot; R &middot; cos&#966;`,
      steps: [
        `Source→100 m carries both loads: I&#8343; = 50000 / (&#8730;3 &times; 400 &times; 0.8) = ${Iseg1.toFixed(2)} A`,
        `100 m→200 m carries 20 kW: I&#8343; = 20000 / (&#8730;3 &times; 400 &times; 0.8) = ${Iseg2.toFixed(2)} A`,
        `Drop, first 100 m: &#916;V = &#8730;3 &times; ${Iseg1.toFixed(2)} &times; 0.10 &times; 0.8 = ${dV1.toFixed(2)} V`,
        `Drop, second 100 m: &#916;V = &#8730;3 &times; ${Iseg2.toFixed(2)} &times; 0.10 &times; 0.8 = ${dV2.toFixed(2)} V`,
        `Total drop = ${dV1.toFixed(2)} + ${dV2.toFixed(2)} = ${dVtot.toFixed(2)} V = ${dVpct.toFixed(2)}% of 400 V`
      ],
      answer: `Total voltage drop &asymp; <b>${dVtot.toFixed(2)} V (${dVpct.toFixed(2)}%)</b>.`,
      interp: `Within a typical 5% limit, so voltage at the far consumer is acceptable for this simplified case. Because current steps down along the distributor, drop is largest in the section nearest the source.`,
      note: "Reactance is neglected; resistance is treated as constant. Real designs use conductor resistance/reactance tables, temperature correction, and standards limits."
    };

    const chipBlock = (e) => `
      <article class="card example">
        <div class="ex-head"><h3>${e.title}</h3><span class="ex-badge">${e.badge}</span></div>
        <div class="ex-block"><div class="ex-cap">Given</div><p>${e.given}</p></div>
        <div class="ex-block"><div class="ex-cap">Formula</div><p>${e.formula}</p></div>
        <div class="ex-block"><div class="ex-cap">Calculation</div><ol class="steps">${e.steps.map(s => `<li>${s}</li>`).join("")}</ol></div>
        <div class="ex-answer"><b>Answer:</b> ${e.answer}</div>
        <div class="ex-block" style="margin-top:12px"><div class="ex-cap">Interpretation</div><p>${e.interp}</p></div>
        <p class="ex-note">Assumptions: ${e.note}</p>
      </article>`;
    $("#examples").innerHTML = [ex1, ex2, ex3].map(chipBlock).join("");
  }
  renderExamples();

  /* ============================================================
     RESOURCES
     ============================================================ */
  $("#formulaList").innerHTML = [
    ["P = V &middot; I &middot; cos&#966;", "Single-phase active power"],
    ["I = P / (V &middot; cos&#966;)", "Single-phase current"],
    ["P = &#8730;3 &middot; V&#8343; &middot; I&#8343; &middot; cos&#966;", "Three-phase active power"],
    ["I&#8343; = P / (&#8730;3 &middot; V&#8343; &middot; cos&#966;)", "Three-phase line current"],
    ["P<sub>loss</sub> = I&sup2; &middot; R<sub>loop</sub>", "Single-phase loop loss"],
    ["P<sub>loss</sub> = 3 &middot; I&#8343;&sup2; &middot; R<sub>phase</sub>", "Three-phase resistive loss"],
    ["&#916;V &#8776; &#8730;3 &middot; I&#8343; &middot; R &middot; cos&#966;", "Approx. line drop (3&#966;, X neglected)"],
    ["R = &#961;L / A", "Conductor resistance"],
    ["&#961;<sub>T</sub> = &#961;<sub>20</sub>(1 + &alpha;(T&#8722;20))", "Temperature correction"]
  ].map(([f, d]) => `<li><span class="fx">${f}</span><span class="fd">${d}</span></li>`).join("");

  $("#glossary").innerHTML = [
    ["Feeder", "Conductor carrying power from a substation to distribution points; no consumer tapped along its route."],
    ["Distributor", "Conductor from which consumers are tapped along its length; current varies along it."],
    ["Service mains", "Final conductor connecting a distributor to an individual consumer."],
    ["Working voltage", "Voltage at which a system or part of it operates under normal conditions."],
    ["Voltage drop", "Reduction in voltage along a conductor due to its impedance under load."],
    ["Power factor", "Cosine of the phase angle between voltage and current; ratio of active to apparent power."],
    ["Resistive loss", "Power dissipated as heat in conductors, proportional to current squared."],
    ["Radial system", "Network where each load is fed by a single path."],
    ["Ring main system", "Network arranged as a closed loop around a load area."],
    ["Interconnected system", "Network linking two or more substations/nets for multiple supply paths."]
  ].map(([t, d]) => `<li><b>${t}</b> &mdash; ${d}</li>`).join("");

  $("#notesBtn").addEventListener("click", () => {
    const txt = `GridLab - Formula Sheet\n========================\n\n` +
      `Single-phase active power:      P = V * I * cos(phi)\n` +
      `Single-phase current:           I = P / (V * cos(phi))\n` +
      `Three-phase active power:       P = sqrt(3) * V_L * I_L * cos(phi)\n` +
      `Three-phase line current:       I_L = P / (sqrt(3) * V_L * cos(phi))\n` +
      `Single-phase resistive loss:   P_loss = I^2 * R_loop\n` +
      `Three-phase resistive loss:    P_loss = 3 * I_L^2 * R_phase\n` +
      `Approx line voltage drop:      dV ~ sqrt(3) * I_L * R * cos(phi)\n` +
      `Conductor resistance:           R = rho * L / A\n` +
      `Temperature correction:        rho_T = rho_20 * (1 + alpha * (T - 20))\n\n` +
      `Symbols: P active power (W); V voltage (V); V_L line voltage (V); I current (A);\n` +
      `I_L line current (A); cos(phi) power factor; R resistance (ohm);\n` +
      `R_loop total loop resistance; R_phase per-phase resistance; rho resistivity (ohm.m);\n` +
      `L length (m); A area (m^2); alpha temperature coefficient (per deg C); T temperature (deg C).\n\n` +
      `Rho (20 C): Cu = 1.72e-8 ohm.m ; Al = 2.82e-8 ohm.m\n` +
      `Alpha: Cu = 0.00393 /degC ; Al = 0.00403 /degC\n\n` +
      `Educational use only.`;
    const blob = new Blob([txt], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "GridLab-Formula-Sheet.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ============================================================
     ABOUT / TEAM / QR
     ============================================================ */
  function applyConfig() {
    if (typeof CONFIG === "undefined") return;
    $("#aboutIntro").innerHTML = `This site is an interactive educational project on <b>the classification of electrical distribution systems and the influence of working voltage on feeder and distributor size</b>. It was developed as part of Power Systems coursework at ${CONFIG.university}.`;
    $("#aboutScope").textContent = `${CONFIG.department} \u00b7 ${CONFIG.group}. The content connects theoretical principles with practical calculations for reliable, efficient, and economical distribution design.`;
    $("#guideName").textContent = CONFIG.guide;
    $("#footLine").textContent = `${CONFIG.department} \u00b7 ${CONFIG.group} \u00b7 ${CONFIG.university}`;
    $("#teamHeading").textContent = CONFIG.group;
    $("#teamEyebrow").textContent = "Team";

    const rl = $("#repoLink");
    if (CONFIG.repo) { rl.href = CONFIG.repo; } else { rl.style.display = "none"; }
    const sl = $("#siteLink");
    if (CONFIG.site) { sl.href = CONFIG.site; } else { sl.style.display = "none"; }

    const grid = $("#teamGrid");
    if (CONFIG.members && CONFIG.members.length) {
      grid.innerHTML = CONFIG.members.map((m, i) =>
        `<div class="member"><div class="idx">${String(i + 1).padStart(2, "0")}</div><div class="nm">${m.name}</div><div class="rg">${m.roll}</div></div>`).join("");
    } else {
      grid.innerHTML = `<p class="muted">Team details to be added.</p>`;
    }

    // QR
    const qrTarget = CONFIG.site || CONFIG.repo;
    const box = $("#qrBox");
    if (qrTarget && typeof QRCode !== "undefined") {
      box.innerHTML = "";
      new QRCode(box, { text: qrTarget, width: 150, height: 150, colorDark: "#0b1220", colorLight: "#ffffff" });
      $("#qrCaption").textContent = qrTarget;
    } else {
      box.innerHTML = `<p class="muted small" style="padding:20px">Set <code>CONFIG.site</code> or <code>CONFIG.repo</code> in config.js to generate a QR code.</p>`;
    }
  }
  applyConfig();

  // expose helpers
  window.GridLab = { I3, loss3, fmtW, RT3 };
})();
