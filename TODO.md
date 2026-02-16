# Project TODO & Roadmap: Network Forensic Inventory (NFI) GUI

## Project Vision
Turn the existing Ansible forensic playbook into a comprehensive network administration tool with a Dockerized backend, a modern GUI, and visualization capabilities (Rack & Topology).

## Requirements
- [x] **Dockerization**: Full suite orchestrated via `docker-compose`.
- [x] **GUI**: Professional web interface (React).
- [x] **Authentication**: Secure login/registration (even for single user).
- [x] **Searchability**: Search across all scanned computers for programs, IPs, files, etc. (Partial: Scans are searchable via browser/API)
- [x] **Inventory Management**: Add/Edit/Delete hosts via GUI.
- [x] **Credential Management**: Encrypted storage for SSH credentials.
- [x] **Scanning**: Manual scans via GUI.
- [ ] **Visualization**:
    - [ ] Physical Rack view (Rack Designer).
    - [ ] Network Topology map (Auto-discovery).
- [x] **Data Persistence**: Store all scan results in a database (PostgreSQL).

## Roadmap

### Phase 1: Core Infrastructure (Completed)
- [x] Setup `docker-compose` with Backend, Frontend, and DB.
- [x] Implement Backend foundation (FastAPI, Auth, DB Schema).
- [x] Implement Frontend foundation (React, Layout, Login).
- [x] Verification of core services.

### Phase 2: Host & Scan Management (Completed)
- [x] Host management UI (CRUD operations).
- [x] Secure/Encrypted storage for SSH credentials.
- [x] Integration of the Ansible playbook via background tasks.
- [x] Displaying scan results in the GUI (JSON parsing & detailed report view).

### Phase 3: Search & Advanced Reporting (Completed)
- [x] Global search functionality (searching across all scan data).
- [x] Historical data comparison (finding changes over time - "Diff" view).
- [ ] Exporting reports (PDF).

### Phase 4: Visualization & Discovery (Next)
- [ ] Rack Designer (Drag & Drop).
- [ ] Network Topology auto-discovery.
- [ ] Real-time status monitoring.

## Completed Tasks
- [x] Initial Project Discovery & Planning.
- [x] Creation of `TODO.md`.
- [x] Phase 1: Core Infrastructure.
- [x] Phase 2: Host & Scan Management.
- [x] Phase 3: Search & Diff reporting.
