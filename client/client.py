import socket
import logging
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

HOST = "proxy"
PORT = 9000

client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

try:
    client_socket.connect((HOST, PORT))
    logging.info(f"Connected to server at {HOST}:{PORT}")

    seq = 1
    while True:
        message = f"HELLO {seq}\n"
        client_socket.sendall(message.encode("utf-8"))
        logging.info(f"Sent: {message.strip()}")

        seq += 1
        time.sleep(1)

except KeyboardInterrupt:
    logging.info("Client interrupted (Ctrl+C).")

except Exception as e:
    logging.exception(f"Client error: {e}")

finally:
    client_socket.close()
    logging.info("Client closed.")
