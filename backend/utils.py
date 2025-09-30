# utils.py
import sys
import os


def resource_path(relative_path):
    """
    Resolve a path to bundled resources if it exists in the executable.
    If it’s not a local file, return the string as-is (for IP streams).
    """
    # If it’s a URL / stream, just return as-is
    if relative_path.startswith(("rtsp://", "http://", "https://")):
        return relative_path

    # Check if the path exists externally first
    if os.path.isfile(relative_path):
        return os.path.abspath(relative_path)

    # Then fallback to bundled resource inside EXE
    if hasattr(sys, "_MEIPASS"):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)
