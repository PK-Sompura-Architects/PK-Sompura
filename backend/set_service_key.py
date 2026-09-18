"""Set SUPABASE_SERVICE_KEY in backend/.env without it touching your shell history.

    python backend/set_service_key.py

Prompts for the key (hidden), checks it is the service_role key and not the
anon key, writes it to backend/.env, then proves it by uploading and deleting
a tiny object in each bucket the admin panel uses.
"""
import base64
import getpass
import json
import os
import pathlib
import sys

ENV = pathlib.Path(__file__).with_name(".env")
BUCKETS = ("temples", "lineage")


def role_of(jwt: str) -> str:
    """Read the role claim without verifying — we only need to catch the
    anon/service_role mix-up, not to trust the token."""
    try:
        payload = jwt.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload)).get("role", "")
    except Exception:
        return ""


def put(lines, key, value):
    """Replace KEY= in place, or append it if absent."""
    out, done = [], False
    for line in lines:
        if line.split("=", 1)[0].strip() == key:
            out.append(f"{key}={value}")
            done = True
        else:
            out.append(line)
    if not done:
        out.append(f"{key}={value}")
    return out


def main():
    if not ENV.exists():
        sys.exit(f"No {ENV}. Create it first.")

    key = getpass.getpass("Paste the Supabase service_role key (input hidden): ").strip()
    if not key:
        sys.exit("Nothing entered.")

    role = role_of(key)
    if role == "anon":
        sys.exit("That is the anon key, not service_role. Uploads would still fail.")
    if role != "service_role":
        print(f"WARNING: role claim is {role!r}, expected 'service_role'.")

    lines = ENV.read_text(encoding="utf-8").splitlines()
    ENV.write_text("\n".join(put(lines, "SUPABASE_SERVICE_KEY", key)) + "\n", encoding="utf-8")
    print(f"Wrote SUPABASE_SERVICE_KEY to {ENV}")

    url = next((l.split("=", 1)[1].strip() for l in lines
                if l.split("=", 1)[0].strip() == "SUPABASE_URL"), None)
    if not url:
        sys.exit("SUPABASE_URL is not set, so the key cannot be verified.")

    try:
        from supabase import create_client
    except ImportError:
        sys.exit("supabase package not installed; key written but unverified.")

    client = create_client(url, key)
    for bucket in BUCKETS:
        probe = ".keycheck"
        try:
            client.storage.from_(bucket).upload(probe, b"ok", {"upsert": "true"})
            client.storage.from_(bucket).remove([probe])
            print(f"  {bucket}: write OK")
        except Exception as exc:
            print(f"  {bucket}: FAILED - {exc}")
            return 1
    print("\nService key works. Restart the backend and admin uploads will go through.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
