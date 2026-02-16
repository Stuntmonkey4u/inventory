def compare_forensic_data(old_data: dict, new_data: dict) -> dict:
    diff = {}

    # Fields that are usually lists
    list_fields = [
        'verified_services', 'all_services', 'packages',
        'upgradable_packages', 'docker', 'listening_ports',
        'firewall_rules', 'login_history', 'filesystem',
        'process_list', 'systemd_timers'
    ]

    for field in list_fields:
        old_list = old_data.get(field, [])
        new_list = new_data.get(field, [])

        if isinstance(old_list, str): old_list = [] # Handle "Skipped" or "N/A"
        if isinstance(new_list, str): new_list = []

        added = list(set(new_list) - set(old_list))
        removed = list(set(old_list) - set(new_list))

        if added or removed:
            diff[field] = {
                "added": added,
                "removed": removed
            }

    # Special handling for SSH keys (list of dicts)
    old_keys = {k['user']: k['key'] for k in old_data.get('ssh_keys', []) if isinstance(k, dict)}
    new_keys = {k['user']: k['key'] for k in new_data.get('ssh_keys', []) if isinstance(k, dict)}

    ssh_diff = {
        "added": [u for u in new_keys if u not in old_keys],
        "removed": [u for u in old_keys if u not in new_keys],
        "changed": [u for u in new_keys if u in old_keys and new_keys[u] != old_keys[u]]
    }

    if any(ssh_diff.values()):
        diff['ssh_keys'] = ssh_diff

    return diff
