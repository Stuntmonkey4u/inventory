# Network Forensic Inventory Ansible Playbook

## Overview

This Ansible playbook is designed to collect detailed forensic-style inventory information from target hosts. It gathers a wide range of data about the system's configuration, running state, and potential indicators of activity, which can be useful for system auditing, troubleshooting, or preliminary forensic investigations.

The playbook generates two key outputs:
1.  An **interactive and visually enhanced HTML report** with features like light/dark mode, filtering, and sorting.
2.  A **machine-readable JSON report** containing all the raw data for programmatic analysis.

## Features / Data Collected

The playbook collects the following types of information:

*   **System Information:**
    *   Hostname, IP Address, OS (Distribution and Version)
    *   System Uptime and exact Boot Time
    *   Filesystem Usage (`df -h`)
*   **Service & Package Management:**
    *   All system service statuses (`systemctl list-unit-files`)
    *   Verified running system services (`systemctl list-units`)
    *   List of all installed packages
    *   List of upgradable packages (for apt-based systems)
*   **Running Processes & Network:**
    *   Full process list (`ps auxwww`)
    *   Open files and network connections (`lsof -n`)
    *   Listening TCP/UDP ports (`ss` or `netstat`)
    *   Firewall rules (`iptables` or `ufw` status)
*   **User and Privilege Auditing:**
    *   Login history for all users (`lastlog`)
    *   Sudoers configuration (`/etc/sudoers` and included files in `/etc/sudoers.d/`)
    *   Cron jobs for the root user and all other users on the system
    *   SSH `authorized_keys` for all users with a standard home directory
*   **Persistence Mechanisms:**
    *   Active `systemd` timers
*   **Containerization (if installed):**
    *   Docker version and list of running containers
*   **Security Scans (if tools are installed):**
    *   **Lynis:** Performs a system audit.
    *   **Rkhunter:** Checks for rootkits and other malware.
*   **File Integrity Monitoring (with AIDE):**
    *   If enabled, initializes an AIDE baseline on the first run for a host.
    *   Subsequent runs check file integrity against this baseline and report any changes.

## HTML Report Features

The generated HTML report is designed for ease of use and quick analysis:
*   **Light & Dark Mode:** Toggle between themes for comfortable viewing.
*   **Quick Navigation:** A navigation bar at the top of each host's section allows you to jump directly to the data you need.
*   **Filterable Tables:** Most tables include a search box to quickly filter rows.
*   **Sortable Tables:** Click on table headers to sort the data by that column.
*   **Collapsible Sections:** All data sections are collapsible, making it easy to focus on specific areas of interest.
*   **Multi-Column Layout:** Large lists, such as installed packages, are displayed in a space-saving multi-column format.

## Prerequisites

*   **Control Node:**
    *   Ansible installed (core version 2.16+ recommended).
*   **Target Hosts:**
    *   SSH access with a user that has `sudo` privileges. The playbook uses `become: true` for tasks that require root access.
    *   Python installed (version compatible with Ansible).
    *   For specific data collection, the relevant tools must be installed on the target (e.g., `lsof`, `lynis`, `rkhunter`, `aide`). The playbook attempts to handle missing tools gracefully.

## How to Use

1.  **Prepare an Inventory File:**
    Create an Ansible inventory file (e.g., `inventory.ini`) listing your target hosts.
    ```ini
    [servers]
    host1.example.com
    host2.example.com ansible_user=admin ansible_ssh_private_key_file=~/.ssh/id_rsa
    ```

2.  **Run the Playbook:**
    Execute the playbook from your control node:
    ```bash
    ansible-playbook -i inventory.ini inventory_report.yml
    ```

## Output

The playbook generates reports in the `./reports/` directory:

*   **HTML Report:** `reports/inventory_report_<date>.html` - An interactive, human-readable report.
*   **JSON Report:** `reports/inventory_report_<datetime>.json` - A machine-readable file with all raw data.

## Customization

You can control which data is collected by passing variables with the `-e` flag. By default, most data collection is enabled, but security scans are disabled as they can be time-consuming.

**Available Variables (Defaults Shown):**
```yaml
collect_services_info: true
collect_packages_info: true
collect_docker_info: true
collect_network_info: true
collect_user_logs_info: true
collect_system_info: true
collect_process_info: true
collect_privilege_info: true
collect_persistence_info: true
collect_lynis_info: false
collect_rkhunter_info: false
collect_aide_info: false
```

**Example: Enable AIDE and Lynis scans**
```bash
ansible-playbook -i inventory.ini inventory_report.yml -e "collect_aide_info=true collect_lynis_info=true"
```

**Example: Skip package and Docker collection**
```bash
ansible-playbook -i inventory.ini inventory_report.yml -e "collect_packages_info=false collect_docker_info=false"
```

### AIDE Baseline Management

*   When `collect_aide_info: true`, the playbook manages AIDE baselines in the `./aide_baselines/` directory on the Ansible controller.
*   **First Run:** The playbook will initialize AIDE on the target host and fetch the baseline database to the controller.
*   **Subsequent Runs:** The playbook copies the stored baseline to the target and runs `aide --check` to find changes.
*   **To re-baseline a host:** Simply delete its baseline file (e.g., `aide_baselines/hostname.db.gz`) from the controller. The playbook will automatically generate a new one on the next run.
