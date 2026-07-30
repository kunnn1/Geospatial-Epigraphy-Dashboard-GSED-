from __future__ import annotations

import argparse
import functools
import http.server
import socketserver
import webbrowser
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class QuietHandler(http.server.SimpleHTTPRequestHandler):
   

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:  # noqa: A002 - stdlib signature
        print(f"  {self.command} {self.path}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000, help="port to listen on (default 8000)")
    parser.add_argument("--no-open", action="store_true", help="do not open a browser window")
    args = parser.parse_args()

    handler = functools.partial(QuietHandler, directory=str(PROJECT_ROOT))

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", args.port), handler) as httpd:
        url = f"http://localhost:{args.port}/index.html"
        print(f"Serving {PROJECT_ROOT} at {url}\nPress Ctrl+C to stop.\n")
        if not args.no_open:
            webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
