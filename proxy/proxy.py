import socket
import threading
import logging
import os
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

PROXY_HOST = "0.0.0.0"
PROXY_PORT = 9000

SERVER_HOST = "server"
SERVER_PORT = 9001

MODE = os.getenv("MODE", "transparent")
DELAY_SECONDS = 3

last_message = None  # used for replay mode


def process_data(data):
    """
    Apply MITM simulation based on MODE.
    """
    global last_message

    if MODE == "transparent":
        return data

    if MODE == "modify":
        modified = data.replace(b"HELLO", b"HACKED")
        logging.warning("MODE=modify → message altered")
        return modified

    if MODE == "replay":
        if last_message is not None:
            logging.warning("MODE=replay → replaying old message")
            return last_message
        last_message = data
        return data

    if MODE == "delay":
        logging.warning(f"MODE=delay → delaying {DELAY_SECONDS}s")
        time.sleep(DELAY_SECONDS)
        return data

    return data


def forward(source, destination, direction):
    global last_message

    try:
        while True:
            data = source.recv(4096)
            if not data:
                break

            last_message = data
            processed = process_data(data)
            destination.sendall(processed)

            logging.info(f"{direction}: forwarded {len(processed)} bytes")

    except Exception as e:
        logging.info(f"{direction}: stopped ({e})")

    finally:
        source.close()
        destination.close()


def main():
    proxy_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    proxy_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    proxy_socket.bind((PROXY_HOST, PROXY_PORT))
    proxy_socket.listen(1)

    logging.info(f"Proxy listening on {PROXY_HOST}:{PROXY_PORT}")
    logging.info(f"Running in MODE={MODE}")

    client_socket, client_addr = proxy_socket.accept()
    logging.info(f"Client connected from {client_addr}")

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.connect((SERVER_HOST, SERVER_PORT))
    logging.info(f"Connected to server at {SERVER_HOST}:{SERVER_PORT}")

    t1 = threading.Thread(
        target=forward,
        args=(client_socket, server_socket, "CLIENT → SERVER"),
        daemon=True
    )
    t2 = threading.Thread(
        target=forward,
        args=(server_socket, client_socket, "SERVER → CLIENT"),
        daemon=True
    )

    t1.start()
    t2.start()

    t1.join()
    t2.join()
    proxy_socket.close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logging.info("Proxy interrupted (Ctrl+C).")
