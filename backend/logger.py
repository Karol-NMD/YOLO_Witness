import logging
import sys
import os

LOG_FILE = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'camera_app.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

def get_logger():
    return logging.getLogger('camera_app')