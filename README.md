# Network Forensic Inventory (NFI)

## Overview

Network Forensic Inventory (NFI) is a comprehensive network administration and forensic auditing tool. It transforms traditional Ansible-based inventory collection into a modern, interactive web application. NFI allows network admins to monitor their infrastructure, perform deep forensic scans, track changes over time, and search across their entire network for specific programs, IP addresses, or configurations.

The core of NFI is an enhanced Ansible engine that collects detailed system state information, which is then processed and visualized through a professional web interface.

## Key Features

*   **Modern Web Dashboard:** A sleek, responsive UI built with React and Tailwind CSS.
*   **Automated Forensic Scanning:** Trigger deep-dive scans on remote hosts with a single click.
*   **Historical Comparison (Diff):** Automatically identify changes between scans (e.g., new packages, modified services, added SSH keys, open ports).
*   **Global Search:** Powerful search capability across all collected forensic data from all hosts. Find which server has "nginx" installed or which one has a specific user account.
*   **Secure Credential Management:** Encrypted storage for SSH passwords and private keys using industry-standard Fernet encryption.
*   **Host Management:** Easily add, edit, and organize hosts in your network inventory.
*   **Dockerized Architecture:** Simple deployment using Docker Compose.

## Architecture

NFI is composed of three main services:

1.  **Frontend (React):** A modern SPA providing the user interface.
2.  **Backend (FastAPI):** A high-performance Python API that manages the database, handles authentication, and orchestrates Ansible scans.
3.  **Database (PostgreSQL):** Stores host information, encrypted credentials, and forensic scan results (using JSONB for high-performance searching).

## Data Collected

NFI's forensic engine collects:
*   **System Info:** Uptime, boot time, OS details, filesystem usage.
*   **Network:** Listening ports, established connections, firewall rules.
*   **Services & Packages:** All installed packages, running services, and systemd timers.
*   **Security:** SSH authorized keys, login history, cron jobs, sudoers configuration.
*   **Containers:** Docker version and running container lists.

## Getting Started

### Prerequisites
*   Docker and Docker Compose installed.
*   Target hosts must be accessible via SSH (User needs `sudo` privileges for full forensic data).

### Deployment

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd nfi
    ```

2.  **Start the application:**
    ```bash
    docker-compose up -d
    ```

3.  **Access the UI:**
    Open your browser and navigate to `http://localhost:5173`.

4.  **Initial Login:**
    The first time you access NFI, you will be prompted to create an admin account.

## How it Works

1.  **Add a Host:** Enter the hostname/IP and SSH credentials. Credentials are encrypted before being saved to the database.
2.  **Trigger a Scan:** NFI launches an asynchronous Ansible playbook that connects to the host and collects forensic data.
3.  **View Report:** Once complete, a detailed forensic report is generated.
4.  **Compare:** If you've scanned a host before, use the "View Changes" button to see what has changed since the last successful scan.
5.  **Search:** Use the Global Search to find data across your entire infrastructure.

## Development

If you wish to run the components individually for development:

### Backend
```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql://user:pass@localhost/nfi
export SECRET_KEY=your-secret-key
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Security Best Practices

*   NFI uses JWT-based authentication.
*   Sensitive SSH credentials never leave the backend in plain text.
*   Ansible output is sanitized to prevent leaking passwords in logs.
*   The application is designed to be run within a trusted management network.
