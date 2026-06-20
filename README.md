# Support Intelligence Assistant 🤖

> **Live Demo:** [https://piyush-patole.github.io/Support.AI/](https://piyush-patole.github.io/Support.AI/)

An AI-powered support ticket analysis tool that helps support teams instantly extract insights, detect duplicates, and generate structured documentation — all running **entirely in the browser** with no backend required.

---

## ✨ Features

| Feature | Description |
|---|---|
| **AI Analysis** | Google Gemini 2.0 Flash analyzes each ticket for root cause, severity, and recommended actions |
| **File Upload** | Drag & drop `.xlsx` and `.csv` ticket files — parsed directly in the browser |
| **Paste Support** | Paste ticket tables (CSV/TSV) or raw email text directly |
| **Duplicate Detection** | Browser-native TF-IDF cosine similarity clusters similar issues automatically |
| **Custom Categories** | Define dynamic classification columns with predefined values (e.g., Plant, Region, Module) |
| **Editable Grid** | Sort, filter, search, and inline-edit any field in the results table |
| **Export** | Download results as `.csv` or `.xlsx` with one click |
| **Dashboard Analytics** | Severity distribution charts, top recurring issues, category breakdowns, stat cards |
| **Dark Mode** | Full iOS-inspired dark palette toggle |
| **Zero Backend** | Everything runs in the browser — no server, no database, no sign-in |

---

## 🚀 Live Demo

**[https://piyush-patole.github.io/Support.AI/](https://piyush-patole.github.io/Support.AI/)**

1. Open the link above
2. Upload a `.xlsx` or `.csv` ticket file (or paste ticket data)
3. Optionally add custom category columns
4. Click **Analyze with AI**
5. View results, edit cells, export to Excel

---

## 🏗️ Architecture

```
Browser Only — No Backend Required
┌─────────────────────────────────────────────────────────────┐
│                   React + TypeScript (Vite)                  │
│                                                               │
│  ┌───────────┐  ┌─────────────┐  ┌────────┐  ┌──────────┐  │
│  │  Upload   │  │  Category   │  │  Grid  │  │Dashboard │  │
│  │  Panel    │  │  Manager    │  │        │  │          │  │
│  └─────┬─────┘  └─────────────┘  └────────┘  └──────────┘  │
│        │                                                      │
│  ┌─────▼──────────────────────────────────────┐              │
│  │              Browser Services               │              │
│  │  fileParser.ts   →  xlsx library (browser)  │              │
│  │  geminiClient.ts →  fetch() to Gemini API   │              │
│  │  duplicateDetector.ts → TF-IDF + Union-Find │              │
│  └────────────────────────────────────────────┘              │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS fetch
                               ▼
              Google Gemini 2.0 Flash API
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (Vite 8) |
| State | Zustand |
| Styling | Vanilla CSS with iOS design system |
| Animations | Framer Motion |
| File Parsing | SheetJS (xlsx) — runs in browser |
| Charts | Recharts |
| AI | Google Gemini 2.0 Flash |
| Hosting | GitHub Pages |

---

## 💻 Local Development

```bash
# Clone the repo
git clone https://github.com/Piyush-Patole/Support.AI.git
cd Support.AI/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → Opens at http://localhost:5173
```

---

## 📦 Build & Deploy

Deployment is **automatic** via GitHub Actions on every push to `main`.

To build manually:
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

---

## 📁 Project Structure

```
Support.AI/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions auto-deploy
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── fileParser.ts   ← Browser XLSX/CSV parsing
│   │   │   ├── geminiClient.ts ← Direct Gemini API calls
│   │   │   └── duplicateDetector.ts ← TF-IDF clustering
│   │   ├── components/
│   │   │   ├── layout/         ← AppShell, Sidebar, Header
│   │   │   ├── upload/         ← DropZone, PasteInput, UploadPanel
│   │   │   ├── category/       ← CategoryManager
│   │   │   ├── grid/           ← OutputGrid with sort/filter/edit
│   │   │   ├── dashboard/      ← Charts and stat cards
│   │   │   └── common/         ← Toast, LoadingOverlay, ConfirmDialog
│   │   ├── store/              ← Zustand state management
│   │   ├── types/              ← TypeScript interfaces
│   │   ├── styles/             ← iOS-inspired CSS design system
│   │   └── utils/              ← Export utilities (CSV, Excel)
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 📝 How to Use

### Upload Tickets
- **File Upload tab**: Drag & drop or browse for `.xlsx`, `.xls`, or `.csv` files
- **Paste Tickets tab**: Paste comma/tab-separated ticket data
- **Paste Email tab**: Paste a raw email for single-ticket analysis

### Custom Categories (Optional)
Define custom columns like `Plant`, `Region`, or `Module` with predefined values. Gemini will auto-detect and fill these for every ticket.

### Analyze
Click **Analyze with AI** — Gemini processes tickets in batches of 20, then the browser clusters similar issues automatically.

### Results Grid
- **Sort** any column by clicking the header
- **Filter** by severity using the dropdown
- **Search** across all fields
- **Edit** any cell inline (click to edit)
- **Export** to CSV or Excel

---

## ⚠️ Notes

- The Gemini API key is embedded for demo purposes. For production use, replace it with your own key in `src/services/geminiClient.ts`.
- All ticket data stays in your browser — nothing is sent to any server except the Gemini API.
- For large batches (500+ tickets), analysis may take a few minutes due to API rate limits.
