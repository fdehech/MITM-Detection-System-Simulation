import socket
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

HOST = "0.0.0.0"
PORT = 9001

server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

client_socket = None

try:
    server_socket.bind((HOST, PORT))
    server_socket.listen(1)
    logging.info(f"Server started on {HOST}:{PORT}")
    logging.info("Waiting for connection...")

    client_socket, address = server_socket.accept()
    logging.info(f"Connected with {address}")

    while True:
        data = client_socket.recv(1024)
        if not data:
            logging.info("Client disconnected.")
            break

        msg = data.decode("utf-8", errors="replace").strip()
        if msg:
            logging.info(f"Received: {msg}")

except KeyboardInterrupt:
    logging.info("Ctrl+C received. Shutting down server...")

except Exception as e:
    logging.exception(f"Server error: {e}")

finally:
    try:
        if client_socket is not None:
            client_socket.close()
    finally:
        server_socket.close()
    logging.info("Server closed.")
