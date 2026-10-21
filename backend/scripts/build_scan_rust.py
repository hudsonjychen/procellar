"""
Build/install optional Rust scan backend into backend/app/algo.

Usage:
  python scripts/build_scan_rust.py
"""

import subprocess
import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    crate_dir = root / "rust" / "scan_backend"
    cmd = [sys.executable, "-m", "maturin", "develop", "--release"]
    print(f"Running in {crate_dir}: {' '.join(cmd)}")
    subprocess.check_call(cmd, cwd=str(crate_dir))
    print("Rust scan backend installed: app.algo._scan_rust")


if __name__ == "__main__":
    main()
