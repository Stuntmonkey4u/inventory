import os
import json
import subprocess
import tempfile
import logging
from database import SessionLocal
import models, security

logger = logging.getLogger(__name__)

def run_ansible_scan(host_id: int, scan_id: int):
    db = SessionLocal()
    try:
        scan_result = db.query(models.ScanResult).filter(models.ScanResult.id == scan_id).first()
        if not scan_result:
            return

        host = db.query(models.Host).filter(models.Host.id == host_id).first()
        if not host:
            scan_result.status = "failed"
            scan_result.data = {"error": "Host not found"}
            db.commit()
            return

    # Create a temporary directory for this scan
    with tempfile.TemporaryDirectory() as tmpdir:
        inventory_path = os.path.join(tmpdir, "inventory.json")
        key_path = None

        # Prepare host variables
        host_vars = {
            "ansible_host": host.ip_address,
            "ansible_user": host.ssh_user,
            "ansible_ssh_common_args": "-o StrictHostKeyChecking=no"
        }

        if host.ssh_password:
            host_vars["ansible_password"] = security.decrypt_data(host.ssh_password)

        if host.ssh_key:
            key_path = os.path.join(tmpdir, "id_rsa")
            with open(key_path, "w") as f:
                f.write(security.decrypt_data(host.ssh_key))
            os.chmod(key_path, 0o600)
            host_vars["ansible_ssh_private_key_file"] = key_path

        # Create JSON inventory
        inventory = {
            "all": {
                "hosts": {
                    host.hostname: host_vars
                }
            }
        }

        with open(inventory_path, "w") as f:
            json.dump(inventory, f)

        # Robust path finding for the playbook
        # Check current dir, then parent, then /app (Docker)
        possible_paths = [
            "inventory_report.yml",
            "../inventory_report.yml",
            "/app/inventory_report.yml"
        ]
        playbook_path = None
        for p in possible_paths:
            if os.path.exists(p):
                playbook_path = p
                break

        if not playbook_path:
            # Fallback to absolute path relative to this file
            playbook_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "inventory_report.yml")

        cmd = [
            "ansible-playbook",
            "-i", inventory_path,
            playbook_path,
            "-e", f"report_dir={tmpdir}"
        ]

        try:
            # Add a 10-minute timeout for the scan
            process = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

            # Sanitization function to remove passwords from output
            def sanitize(text: str) -> str:
                if not text: return ""
                if host.ssh_password:
                    pass_val = security.decrypt_data(host.ssh_password)
                    text = text.replace(pass_val, "********")
                return text

            if process.returncode == 0:
                report_file = None
                for file in os.listdir(tmpdir):
                    if file.endswith(".report.json"):
                        report_file = os.path.join(tmpdir, file)
                        break

                if report_file:
                    with open(report_file, "r") as f:
                        report_data_raw = json.load(f)
                        report_data = report_data_raw.get(host.hostname, report_data_raw)

                        scan_result.data = report_data
                        scan_result.status = "success"
                        db.commit()
                else:
                    scan_result.data = {"error": "Report file not found", "stdout": sanitize(process.stdout)}
                    scan_result.status = "failed"
                    db.commit()
            else:
                scan_result.data = {
                    "error": "Ansible execution failed",
                    "stdout": sanitize(process.stdout),
                    "stderr": sanitize(process.stderr)
                }
                scan_result.status = "failed"
                db.commit()
        except subprocess.TimeoutExpired:
            scan_result.data = {"error": "Scan timed out after 10 minutes"}
            scan_result.status = "failed"
            db.commit()
        except Exception as e:
            scan_result.data = {"error": f"Unexpected error: {str(e)}"}
            scan_result.status = "failed"
            db.commit()
    finally:
        db.close()
