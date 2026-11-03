"""Local Document Studio launcher. No external Python packages required."""
import http.server
import os
from pathlib import Path
import sys
import webbrowser

os.chdir(Path(__file__).resolve().parent)
try:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 18798
    if not 1 <= port <= 65535:
        raise ValueError
except ValueError:
    print('Invalid port. Example: start.bat 18799')
    sys.exit(1)
class FreshFiles(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

try:
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), FreshFiles)
except OSError as exc:
    print(f'Cannot start on port {port}: {exc}')
    print('Another server may be running. Stop it or run: start.bat 18799')
    sys.exit(1)
url = f'http://localhost:{port}/'
print('Document Studio 3.7.0')
print(f'Folder: {Path.cwd()}')
print(f'URL: {url}')
print('Keep this window open. Press Ctrl+C to stop.')
print('Documents are stored per browser address and port.')
try:
    webbrowser.open(url)
    server.serve_forever()
except KeyboardInterrupt:
    print('\nServer stopped.')
finally:
    server.server_close()
