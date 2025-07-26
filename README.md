# Procellar (POCEL Stellar)

Procellar is a user-freindly and powerful web app that allows users to define processes on event logs.

---

## What's new
### Jul 26
- The information of imported files is provided.
- Constraints for user behaviours are added.
- Notifications when facing error or importing file successfully.

### Jul 25
- Condition filtering is now fully supported accross frontend to backend.

### Jul 24
- Now we have a completely redesigned **Logic Editor** which allows users to fully control logic relations. 
- Various bugs and issues have been fixed.

---

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