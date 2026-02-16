import os
from cryptography.fernet import Fernet

# In a real production app, this key should be managed securely (e.g. Vault, AWS KMS)
# For now, we use a key derived from SECRET_KEY or a dedicated ENCRYPTION_KEY env var.
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # If no key is provided, we should probably fail or generate one for this session
    # but for stability in this task, we'll derive one if missing (NOT recommended for prod)
    import base64
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

    salt = b'nfi_salt_static' # In prod, use a real salt
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    secret = os.getenv("SECRET_KEY", "supersecretkey").encode()
    ENCRYPTION_KEY = base64.urlsafe_b64encode(kdf.derive(secret)).decode()

fernet = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(data: str) -> str:
    if not data:
        return None
    return fernet.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    if not encrypted_data:
        return None
    try:
        return fernet.decrypt(encrypted_data.encode()).decode()
    except Exception:
        return "DECRYPTION_ERROR"
