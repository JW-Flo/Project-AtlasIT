import os
import time

LOG_FILE = "logs/application.log"

def tail_log_file(filepath):
    with open(filepath, "r") as f:
        f.seek(0, os.SEEK_END)  # Move to the end of the file
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.1)  # Wait for new lines
                continue
            print(line, end="")

if __name__ == "__main__":
    if not os.path.exists(LOG_FILE):
        print(f"Log file does not exist: {LOG_FILE}")
    else:
        print(f"Monitoring log file: {LOG_FILE}")
        tail_log_file(LOG_FILE)
