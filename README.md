# Procellar (POCEL Stellar)

Procellar is a user-freindly and powerful web app that allows users to define processes on event logs.

---

## What's new
### Jul 25
- Condition filtering is now fully supported accross frontend and backend.

### Jul 24
- Now we have a completely redesigned **Logic Editor** which allows users to fully control logic relations. 
- Various bugs and issues have been fixed.

## Notes
### Jul 24
- The frontend is nearly complete, though some parts still need refinement.
- The backend for condition filtering is not ready yet but will be delivered very soon.

### Jul 22
- The **Advanced Rule Editor** is functional on frontend. Conditions can now be defined and displayed. However, the backend is not yet ready, so exported PROCEL is not filtered by conditions. 

### Earlier
- This project is currently under development. 
- The **Advanced Rule Editor** is not functional yet. 
- For demonstratio purpose, it's recommended to use `example_data_3` from the `example-data/` directory.

## Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)

---

## Project Structure

```bash
.
├── backend/ # Flask backend
│ ├── app/ # Backend source code
│ ├── run.py
│ └── requirements.txt
├── frontend/ # Frontend (Vite + React)
│ ├── src/ # Frontend source code
│ ├── eslint.config.js
│ ├── index.html
│ ├── logo.png
│ ├── vite.config.js
│ └── package.json
├── example-data/ # Example event logs for demo or test
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisties
- [Node.js](https://nodejs.org/) >= 16.x
- [Python](https://www.python.org/) >= 3.8
- [pip](https://pip.pypa.io/en/stable/)

### 1. Clone the Repository
```bash
git clone https://github.com/hudsonjychen/procellar.git
cd procellar
```

### 2. Set Up the Backend
#### Windows
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
#### macOS
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

### 3. Set Up the Frontend
```bash
# In another terminal
cd frontend
npm install
npm run dev
```