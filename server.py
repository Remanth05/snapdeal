"""
Snapdeal AI Virtual KAM - Local Server
Zero external dependency server using Python standard library.
Serves the web application and automatically opens your browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

DEFAULT_PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable cache for smooth local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run_server():
    os.chdir(DIRECTORY)
    
    # Try preferred ports
    candidate_ports = [DEFAULT_PORT, 8080, 8001, 8002, 8888, 3000]
    httpd = None
    port = DEFAULT_PORT

    for p in candidate_ports:
        try:
            httpd = socketserver.TCPServer(("", p), Handler)
            port = p
            break
        except OSError:
            continue

    if httpd is None:
        # Let OS assign a free port
        httpd = socketserver.TCPServer(("", 0), Handler)
        port = httpd.server_address[1]

    url = f"http://localhost:{port}"
    print("=" * 65)
    print("🚀 SNAPDEAL AI VIRTUAL KEY ACCOUNT MANAGER (KAM) SERVER")
    print("=" * 65)
    print(f"📡 Serving demo at: {url}")
    print("💡 Microphones work best on http://localhost or HTTPS.")
    print("Press Ctrl+C in this terminal window to stop the server.")
    print("=" * 65)
    
    # Open browser automatically
    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server. Goodbye!")
        httpd.server_close()
        sys.exit(0)

if __name__ == "__main__":
    run_server()

