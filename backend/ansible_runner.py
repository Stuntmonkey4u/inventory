import os
import json
import subprocess
import tempfile
import shutil
from datetime import datetime
from sqlalchemy.orm import Session
import models, security

def run_ansible_scan(host_id: int, db: Session):
    host = db.query(models.Host).filter(models.Host.id == host_id).first()
    if not host:
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

        # Run ansible-playbook
        # We need to make sure we point to the correct playbook path
        # Assuming we are in backend/ and playbook is in root
        playbook_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "inventory_report.yml")

        cmd = [
            "ansible-playbook",
            "-i", inventory_path,
            playbook_path,
            "-e", f"report_dir={tmpdir}"
        ]

        process = subprocess.run(cmd, capture_output=True, text=True)

        if process.returncode == 0:
            # Find the generated JSON report
            report_file = None
            for file in os.listdir(tmpdir):
                if file.endswith(".report.json"):
                    report_file = os.path.join(tmpdir, file)
                    break

            if report_file:
                with open(report_file, "r") as f:
                    # The host report file contains { "hostname": { ...data... } }
                    report_data_raw = json.load(f)
                    # Extract the data for this host
                    report_data = report_data_raw.get(host.hostname, report_data_raw)

                    # Save to database
                    scan_result = models.ScanResult(
                        host_id=host.id,
                        data=report_data,
                        status="success"
                    )
                    db.add(scan_result)
                    db.commit()
            else:
                # No report file found
                scan_result = models.ScanResult(
                    host_id=host.id,
                    data={"error": "Report file not found", "stdout": process.stdout},
                    status="failed"
                )
                db.add(scan_result)
                db.commit()
        else:
            # Ansible failed
            scan_result = models.ScanResult(
                host_id=host.id,
                data={"error": "Ansible execution failed", "stdout": process.stdout, "stderr": process.stderr},
                status="failed"
            )
            db.add(scan_result)
            db.commit()
