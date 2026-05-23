import http.server
import socketserver
import sys

PORT = 8000

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        print(f'Serveur démarré : http://localhost:{PORT}')
        print('Ctrl+C pour arrêter.')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nArrêt.')
            sys.exit(0)