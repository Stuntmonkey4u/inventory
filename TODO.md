# Project TODO & Roadmap: Network Forensic Inventory (NFI) GUI

## Project Vision
Turn the existing Ansible forensic playbook into a comprehensive network administration tool with a Dockerized backend, a modern GUI, and visualization capabilities (Rack & Topology).

## Requirements
- [ ] **Dockerization**: Full suite orchestrated via `docker-compose`.
- [ ] **GUI**: Professional web interface (React).
- [ ] **Authentication**: Secure login/registration (even for single user).
- [ ] **Searchability**: Search across all scanned computers for programs, IPs, files, etc.
- [ ] **Inventory Management**: Add/Edit/Delete hosts via GUI.
- [ ] **Credential Management**: Encrypted storage for SSH credentials.
- [ ] **Scanning**: Manual and scheduled scans.
- [ ] **Visualization**:
    - [ ] Physical Rack view (Rack Designer).
    - [ ] Network Topology map (Auto-discovery).
- [ ] **Data Persistence**: Store all scan results in a database (PostgreSQL).

## Roadmap

### Phase 1: Core Infrastructure (Current)
- [ ] Setup `docker-compose` with Backend, Frontend, and DB.
- [ ] Implement Backend foundation (FastAPI, Auth, DB Schema).
- [ ] Implement Frontend foundation (React, Layout, Login).
- [ ] Verification of core services.

### Phase 2: Host & Scan Management
- [ ] Host management (CRUD operations).
- [ ] Encrypted credential storage.
- [ ] Integration of the Ansible playbook as a background task (Celery or similar).
- [ ] Displaying scan results in the GUI.

### Phase 3: Search & Advanced Reporting
- [ ] Global search functionality.
- [ ] Historical data comparison (finding changes over time).
- [ ] Exporting reports (JSON/PDF).

### Phase 4: Visualization & Discovery
- [ ] Rack Designer (Drag & Drop).
- [ ] Network Topology auto-discovery.
- [ ] Real-time status monitoring.

## Completed Tasks
- [x] Initial Project Discovery & Planning.
- [x] Creation of `TODO.md`.
