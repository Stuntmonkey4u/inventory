# Network Forensic Inventory Ansible Playbook

## Overview

This Ansible playbook is designed to collect detailed forensic-style inventory information from target hosts. It gathers a wide range of data about the system's configuration, running state, and potential indicators of activity, which can be useful for system auditing, troubleshooting, or preliminary forensic investigations. The playbook generates comprehensive HTML and JSON reports.

## Features / Data Collected

The playbook collects the following types of information:

*   **System Information:**
    *   Hostname
    *   IP Address
    *   Operating System (Distribution and Version)
    *   System Uptime
    *   Boot Time
    *   Filesystem Usage (`df -h`)
*   **Service Information:**
    *   All system service statuses (`systemctl list-unit-files`)
    *   Verified running system services (`systemctl list-units --type=service --state=running`)
*   **Package Information:**
    *   List of all installed packages (via `ansible.builtin.package_facts`)
    *   List of upgradable packages (for apt-based systems via `apt list --upgradable`)
*   **Docker Information (if installed):**
    *   Docker version
    *   List of running Docker containers (names and images)
*   **Network Information:**
    *   Listening TCP/UDP ports (`ss` or `netstat`)
    *   Firewall rules (from `iptables` or `ufw` status)
*   **User and Log Information:**
    *   Login history (`lastlog`)
    *   Root user's cron jobs (`crontab -l`)

## Prerequisites

*   **Control Node:**
    *   Ansible installed (core version compatible with the playbook features, e.g., 2.16+).
*   **Target Hosts:**
    *   SSH access from the control node to the target hosts.
    *   Python installed (typically Python 2.7 or Python 3.x, as required by Ansible modules).
    *   Sudo access for the Ansible user on target hosts is required for many data gathering commands. The playbook uses `become: true` for these tasks.
    *   Standard system utilities (like `systemctl`, `ss`, `netstat`, `iptables`, `ufw`, `lastlog`, `crontab`, `df`, `uptime`) should be available for corresponding data collection. The playbook attempts to gracefully handle missing tools for some sections.

## How to Use

1.  **Prepare an Inventory File:**
    Create an Ansible inventory file (e.g., `inventory.ini` or `hosts.yml`) listing the target hosts.
    Example `inventory.ini`:
    ```ini
    [webservers]
    server1.example.com
    server2.example.com ansible_user=anotheruser

    [databases]
    db1.example.com ansible_ssh_private_key_file=~/.ssh/db_key
    ```

2.  **Run the Playbook:**
    Execute the playbook using the following command:
    ```bash
    ansible-playbook -i <inventory_file> inventory_report.yml
    ```
    Replace `<inventory_file>` with the path to your inventory file.

## Output

The playbook generates reports in the `./reports/` directory (relative to where the playbook is run):

*   **HTML Report:** `reports/inventory_report_<date>.html` (e.g., `reports/inventory_report_2023-10-27.html`)
    *   A human-readable report summarizing the collected data for each host, including a summary section and detailed tables for various information categories.
*   **JSON Report:** `reports/inventory_report_<datetime>.json` (e.g., `reports/inventory_report_YYYY-MM-DDTHHMMSS.mmmmmmZ.json`)
    *   A machine-readable JSON file containing all the raw data collected from the hosts. This can be used for programmatic analysis or ingested into other tools.

Each playbook run creates new timestamped/dated report files.

## Customization

*   **Report Directory:** The output directory for reports can be customized by passing the `report_dir` variable during playbook execution:
    ```bash
    ansible-playbook -i <inventory_file> inventory_report.yml -e "report_dir=/custom/path/reports"
    ```
    Ensure the specified directory is writable by the user running Ansible on the control node (for Play 2 tasks). The temporary files created by Play 1 on the control node (if `report_dir` is customized for that too) also need to be writable.

## Minimal Dependencies

This playbook aims to rely on standard system tools and Python libraries typically found on Linux systems. It uses the `ansible.builtin.package_facts` module for robust package collection across different distributions. For other information, it uses common shell commands and tries to degrade gracefully if a specific tool is not found (e.g., by trying `ss` then `netstat`).
