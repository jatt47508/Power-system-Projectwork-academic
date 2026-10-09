# GridLab &mdash; Power System Project

> **Classification of Distribution Systems &amp; the Influence of Working Voltage on the Size of Feeders and Distributors**

An interactive explorer we built for our Power Systems coursework. It covers how electrical distribution systems are classified and why working voltage matters for feeders and distributors. Everything runs in the browser — no backend, no install.

**Live site:** [https://jatt47508.github.io/Power-system-Projectwork-academic/](https://jatt47508.github.io/Power-system-Projectwork-academic/)

---

## What's inside

- **Overview** — clickable power-system flow diagram (generation → transmission → distribution → consumers) with per-stage details and typical voltage levels.
- **Theory** — distribution fundamentals, transmission vs distribution, and the roles of feeders, distributors, and service mains.
- **Classification** — four axes: current type, phases & wires, construction method, and network configuration, each with schematics, pros/cons, applications, and comparisons.
- **Network Explorer** — radial, ring main, and interconnected systems with a fault-simulation toggle that shows how continuity really depends on switching, protection, and alternative paths.
- **Voltage Lab** — single/three-phase calculator for current, resistive loss, voltage drop, and efficiency, with live charts.
- **Calculations** — feeder/conductor sizing estimates (material, length, temperature, permissible drop) and a multi-load distributor voltage profile.
- **Numerical Examples** — three worked examples with step-by-step calculations.
- **Resources** — formula reference, glossary, and a downloadable formula sheet.

## Formulas used

- Single-phase: `P = V·I·cosφ`, `I = P/(V·cosφ)`, `P_loss = I²·R_loop`
- Three-phase: `P = √3·Vₗ·Iₗ·cosφ`, `Iₗ = P/(√3·Vₗ·cosφ)`, `P_loss = 3·Iₗ²·R_phase`
- Approx. voltage drop: `ΔV ≈ √3·Iₗ·R·cosφ`
- Conductor resistance: `R = ρL/A`, temperature-corrected.

> **Honest note:** reactance is neglected and all results are educational estimates. Real designs must satisfy ampacity, short-circuit, mechanical, and standards requirements. The identical-resistance comparison across voltages is only to isolate the effect of voltage — not a comparison of real installations.

## Project structure

```
├── index.html         page structure
├── style.css          theme & layout (dark / light)
├── script.js          diagrams, classification, network sim, examples, team, QR
├── config.js          team, links, institution (edit here)
├── js/
│   ├── voltagelab.js  voltage calculator + charts
│   └── feederlab.js   feeder/distributor calculator + voltage profile
└── README.md
```

## Tech

HTML5 · CSS3 · vanilla JavaScript · [Chart.js](https://www.chartjs.org/) · [qrcodejs](https://github.com/davidshimjs/qrcodejs) — no backend, no API keys, no build step.

## Team

Group 3 · Department of Electrical and Electronics Engineering · C. V. Raman Global University, Odisha.

- Aditya Kumar Barik &mdash; 2401020979
- Abhay Kumar &mdash; 2401021025
- Jatin Kumar Mallick &mdash; 2401021032
- Santosh Kumar Baliarsingh &mdash; 2401021047
- Chandramouli Shil &mdash; 2401021061
- Rounak Prajapati &mdash; 2401021062
- Aditya Prakash Mohapatra &mdash; 2401021063
- Suryakant Thakur &mdash; 2401021071
- Sanat Soyansu Jena &mdash; 2401021080
- Kuldeep Keshari &mdash; 2401021106
- Priyanka Pradhan &mdash; 2401020946

Guided by **Smrutirekha Samal Ma'am**.

---

&copy; 2026 · Built by **Jatin Kumar Mallick** with **OpenCode** · for academic use