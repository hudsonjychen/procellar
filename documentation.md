# Getting Started

Procellar is a tool that allows defining processes based on a defined language. It comes with a beautiful user interface and easy-to-use design.

To start, let's follow the steps.

## Installation and Set Up
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
Open a new terminal. Go to the location where you clone the project and follow the instructions below to run the frontend.
```bash
cd frontend
npm install
npm run dev
```

## Start Exploring
### Import a File
Start by importing a file. Procellar accepts OCEL 2.0 in format of json only. Please make sure that your file follows this standard. To try our tool, you can go to https://ocel-standard.org/event-logs/overview/ to find some json files.

Click on the import button on the right top corner.