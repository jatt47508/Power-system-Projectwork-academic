# GridLab — Electrical Power Distribution Systems Explorer

An interactive, single-page engineering explorer for the Power Systems topic:

> **“Classification of Distribution Systems and the Influence of Working Voltage on the Size of Feeders and Distributors.”**

Built as a university project for **Group 3, Department of Electrical and Electronics Engineering, C. V. Raman Global University, Odisha**, and deployable directly to GitHub Pages.

---

## What it does

| Section | Feature |
|---------|---------|
| **Overview** | Clickable power-system flow diagram (generation → transmission → distribution → consumers) with per-stage details and typical voltage ranges. |
| **Theory** | Distribution fundamentals, transmission vs distribution levels, and the roles of feeders, distributors, and service mains. |
| **Classification** | Four axes — current type, phases & wires, construction method, network configuration — each with definitions, interactive schematics, advantages/disadvantages, applications, and comparisons. |
| **Network Explorer** | Radial, ring main, and interconnected systems with a live fault simulation and event log explaining the role of switching, protection, and alternative paths. |
| **Voltage Lab** | Single/three-phase calculator for line current, resistive loss, voltage drop, and efficiency, with live charts of current-vs-voltage and loss-vs-voltage. |
| **Calculations** | Feeder/distributor conductor calculator (material, size, length, temperature, permissible drop) plus a multi-load distributor voltage profile. |
| **Numerical Examples** | Three fully worked examples with given data, formula, calculation, answer, and interpretation. |
| **Resources** | Formula reference, glossary, downloadable formula sheet, project report PDF, and references. |
| **About** | Team, guide, institution, repository link, and a QR code to the deployed site. |

## Engineering basis

- Single-phase: `P = V·I·cosφ`, `I = P/(V·cosφ)`, `P_loss = I²·R_loop`
- Three-phase: `P = √3·Vₗ·Iₗ·cosφ`, `Iₗ = P/(√3·Vₗ·cosφ)`, `P_loss = 3·Iₗ²·R_phase`
- Approx. line drop: `ΔV ≈ √3·Iₗ·R·cosφ`
- Conductor resistance: `R = ρL/A`, temperature-corrected `ρ_T = ρ₂₀(1+α(T−20))`

### Assumptions & honesty

- Steady-state balanced operation; **reactance is neglected**, so voltage drop is a resistive approximation.
- All results are **educational estimates**. Real designs must also satisfy current-carrying capacity, short-circuit, mechanical, installation, safety, and standards requirements.
- The identical-resistance comparison across voltages is used **only** to isolate the mathematical effect of voltage — it is not a comparison of real installations with different conductors.
- No standards, ratings, or citations are fabricated.

## Project structure

```
GridLab/
├── index.html            Page structure and content
├── style.css             Theme, layout, dashboard styling (dark/light)
├── script.js             Navigation, flow diagram, classification, network explorer, examples, resources, team, QR
├── config.js             Team names, institution, links, report path (edit here)
├── js/
│   ├── voltagelab.js     Working voltage calculator + Chart.js graphs
│   └── feederlab.js      Feeder/distributor calculator + voltage profile
├── report/
│   └── PowerSystems_ReportV1.pdf
└── README.md
```

## Run locally

No build step is required. Because the page loads local scripts, use a simple local server (opening `file://` may block some features):

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. Repository **Settings → Pages → Source: Deploy from a branch → `main` / root → Save**.
3. Your site will be published at `https://<username>.github.io/<repo>/`.

Then update the links in `config.js`:

```js
repo: "https://github.com/<username>/<repo>",
site: "https://<username>.github.io/<repo>/"
```

The QR code generates automatically from `CONFIG.site` (or `CONFIG.repo`).

## Tech

HTML5 · CSS3 · vanilla JavaScript · [Chart.js](https://www.chartjs.org/) · [qrcodejs](https://github.com/davidshimjs/qrcodejs) — no backend, no API keys, no build system.

## License

For academic / educational use.
