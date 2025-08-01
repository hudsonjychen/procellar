# Procellar

Procellar is a user-freindly and powerful tool that allows users to define and embed processes on OCEL.

## Features
1. **Process Scope Definition**  
Define user-specific process scopes by combining object types, activities, and filtering conditions. Supports both basic and advanced rule editing.

2. **Process-Enriched OCEL Generation**  
Embed defined process scopes directly into event data to produce a process-enriched Object-Centric Event Log (OCEL 2.0 format).

3. **Visual Rule Management**  
Intuitive card-based visualization of rules and processes, with support for rule editing, deletion, and semantic summaries.

4. **Advanced Filtering Logic**  
Use attribute-level conditions and logical operators (AND / OR) to build complex, fine-grained process definitions.

5. **Flexible Export and Integration**  
Export results as a .zip package containing both the process definitions and enriched OCEL, ready for downstream analysis or use with companion tool [Business Execution Graph](https://github.com/hudsonjychen/business-execution-graph).

## Project Structure

- `backend/app` - Backend source code
- `backend/requirements.txt` - Requirements txt for setting up
- `backend/run.py` - Entry point for starting the Flask server
- `documentation` - Documentation for Procellar
- `frontend/src` - Frontend source code
- `frontend/package.json` - Frontend dependencies and build scripts
- `README.md` - README

## Documentation
Refer to the documentation for a quick start and comprehensive information.

- [Introduction](./documentation/introduction.md)
- [Getting Started](./documentation/getting-started.md)
- [Usage Guide](./documentation/usage-guide.md)