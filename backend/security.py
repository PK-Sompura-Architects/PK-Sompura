"""
Password hashing for the admin panel.

Uses scrypt from the standard library. It is memory-hard, so it resists the
GPU and ASIC attacks that make plain SHA-256 unsuitable for passwords, and it
needs no third-party dependency.

Generate a hash to put in backend/.env:

    python -m backend.security

The plaintext password is never stored: .env holds only the hash, so a leaked
env file does not hand over the password itself.
"""

import base64
import hashlib
import secrets
import pathlib
import sys

# ~64MB of memory per verification. High enough to make bulk guessing
# expensive, low enough to stay instant for a human logging in.
SCRYPT_N = 2 ** 16
SCRYPT_R = 8
SCRYPT_P = 1
MAXMEM = 128 * SCRYPT_R * SCRYPT_N * 2


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P,
        maxmem=MAXMEM,
        dklen=32,
    )
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${_b64(salt)}${_b64(derived)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, n, r, p, salt_b64, hash_b64 = encoded.split("$")
        if scheme != "scrypt":
            return False
        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=_unb64(salt_b64),
            n=int(n), r=int(r), p=int(p),
            maxmem=MAXMEM,
            dklen=len(_unb64(hash_b64)),
        )
    except (ValueError, TypeError):
        return False
    # Constant time, so a wrong password cannot be narrowed down by timing.
    return secrets.compare_digest(derived, _unb64(hash_b64))


if __name__ == "__main__":
    # A password passed as an argument ends up in shell history, so it is
    # either generated here or typed at a hidden prompt.
    if "--own" in sys.argv:
        import getpass
        # Ctrl+V does not paste at a hidden prompt on Windows; it delivers a
        # lone control byte, which the length check below then rejects.
        print("Type it, or paste with a right-click. Ctrl+V will not work here.")
        pw = getpass.getpass("New admin password (hidden): ").strip()
        if len(pw) < 12:
            sys.exit("Too short. Use at least 12 characters.")
    else:
        pw = secrets.token_urlsafe(18)

    digest = hash_password(pw)
    assert verify_password(pw, digest), "hash did not verify"

    print()
    print("  Password - save this in your password manager now:")
    print()
    print("      " + pw)
    print()
    print("  Put this line in Render > Environment:")
    print()
    print("      ADMIN_PASSWORD_HASH=" + digest)
    print()

    env = pathlib.Path(__file__).with_name(".env")
    if "--set" in sys.argv and env.exists():
        lines, done = [], False
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.partition("=")[0].strip() == "ADMIN_PASSWORD_HASH":
                lines.append("ADMIN_PASSWORD_HASH=" + digest)
                done = True
            else:
                lines.append(line)
        if not done:
            lines.append("ADMIN_PASSWORD_HASH=" + digest)
        env.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print("  Also written to backend/.env for local use.")
    else:
        print("  (Add --set to also update backend/.env for local use.)")
    print()
