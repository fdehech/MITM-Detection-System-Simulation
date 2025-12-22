"""
TCP Server
Receives messages and detects potential MITM attacks
"""

import socket
import logging
import time
import os


class Message:
    """Structured message with sequence number, timestamp, and payload."""
    def __init__(self, sequence, timestamp, payload):
        self.sequence = sequence
        self.timestamp = timestamp
        self.payload = payload


class DetectionServer:
    """Server that detects MITM attacks"""
    def __init__(self, host, port, max_delay, buffer_size):
        
        # Initialize attributes
        self.host = host 
        self.port = port
        self.max_delay = max_delay
        self.buffer_size = buffer_size
        
        self.expected_sequence = 1  # Track expected sequence number
        self.server_socket = None
        self.client_socket = None
        self._setup_logging()

    def _setup_logging(self):
        """Configure logging for the server"""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - [SERVER] - %(levelname)s - %(message)s"
        )
        self.logger = logging.getLogger(__name__)

    def _parse_message(self, raw_message):
        """Parse message into structured format"""
        parts = raw_message.split("|")
        fields = {}

        for part in parts:
            key, value = part.split("=", 1)
            fields[key] = value

        return Message(
            sequence=int(fields["SEQ"]),
            timestamp=int(fields["TS"]),
            payload=fields["DATA"]
        )

    def _detect_dropped_packets(self, sequence):
        """Detect dropped packets by checking for sequence number gaps"""
        if sequence > self.expected_sequence:
            # Gap detected - packets were dropped
            missing_range = list(range(self.expected_sequence, sequence))
            self.logger.critical(
                f"[ALERT] DROPPED PACKETS DETECTED: Missing sequence numbers {missing_range}"
            )
            self.expected_sequence = sequence + 1
            return True
        elif sequence == self.expected_sequence:
            # Normal case - sequence is as expected
            self.expected_sequence = sequence + 1
            return False
        else:
            # sequence < expected_sequence - handled by reorder detection
            return False

    def _detect_reorder_attack(self, sequence):
        """Detect out-of-order packet delivery"""
        if sequence < self.expected_sequence:
            self.logger.critical(
                f"[ALERT] OUT-OF-ORDER PACKET: Received SEQ={sequence}, Expected SEQ={self.expected_sequence}"
            )
            return True
        return False

    def _detect_delay_attack(self, timestamp):
        """Detect delay attacks"""
        current_time = int(time.time())
        delay = current_time - timestamp

        if delay > self.max_delay:
            self.logger.critical(
                f"[ALERT] DELAY ATTACK DETECTED: {delay}s > {self.max_delay}s"
            )
            return True
        
        return False

    def _detect_integrity_violation(self, raw_message):
        """Detect message integrity violations"""
        try:
            self._parse_message(raw_message)
            return False
        except Exception:
            self.logger.critical(
                f"[ALERT] Message integrity violation detected: {raw_message}"
            )
            return True

    def _process_message(self, raw_message):
        """Process and analyze incoming message"""
        if self._detect_integrity_violation(raw_message):
            return

        try:
            message = self._parse_message(raw_message) 
            
            # Check if detection is enabled
            detection_enabled = os.getenv("SERVER_DETECTION_ENABLED", "true").lower() == "true"

            # Detection algorithms (only if enabled)
            if detection_enabled:
                # Check for reordering first (sequence < expected)
                self._detect_reorder_attack(message.sequence)
                
                # Check for dropped packets (sequence > expected)
                self._detect_dropped_packets(message.sequence)
                
                # Check for delay attacks
                self._detect_delay_attack(message.timestamp)
            
            delay = int(time.time()) - message.timestamp

            # Log normal message
            self.logger.info(
                f"SEQ={message.sequence} | TS={message.timestamp} | Delay={delay}s | DATA={message.payload}"
            )

        except Exception as e:
            self.logger.error(f"Error processing message: {e}")

    def _handle_client(self, client_socket, address):
        """Handle client connection and message processing."""
        self.logger.info(f"Connected with {address}")

        try:
            while True:
                data = client_socket.recv(self.buffer_size)
                if not data:
                    self.logger.info("Client disconnected")
                    break

                # Decode and split by line to process each message individually
                raw_data = data.decode("utf-8", errors="replace")
                messages = raw_data.strip().split("\n")
                
                for msg in messages:
                    if msg.strip():
                        self._process_message(msg.strip())

        except Exception as e:
            self.logger.error(f"Error handling client: {e}")

        finally:
            client_socket.close()

    def run(self):
        """Start detection server and listen for connections."""
        try:
            # Create and configure server socket
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(1)

            # Log server startup
            self.logger.info(f"Server started on {self.host}:{self.port}")
            self.logger.info(f"MAX_DELAY is set to {self.max_delay}s")
            self.logger.info("Waiting for connection...")

            # Accept client connection
            self.client_socket, address = self.server_socket.accept()
            self._handle_client(self.client_socket, address)

        except KeyboardInterrupt:
            self.logger.info("Server interrupted (Ctrl+C)")

        except Exception as e:
            self.logger.exception(f"Server error: {e}")

        finally:
            self.close()

    def close(self):
        """Close all sockets and cleanup resources."""
        if self.client_socket:
            self.client_socket.close()
        if self.server_socket:
            self.server_socket.close()
        self.logger.info("Server closed")


def main():
    """Application entry point."""
    
    # Read configuration from environment variables
    host = os.getenv("SERVER_LISTEN_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_LISTEN_PORT", "9001"))
    max_delay = float(os.getenv("SERVER_MAX_DELAY", "2"))
    buffer_size = int(os.getenv("SERVER_BUFFER_SIZE", "4096"))

    # Create and run server
    server = DetectionServer(host=host, port=port, max_delay=max_delay, buffer_size=buffer_size)
    server.run()


if __name__ == "__main__":
    main()
