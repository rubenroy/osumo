import os

DEBUG = False

DEPLOY_IP = '127.0.0.1'
PORT = 5291

BASE_URL = 'http://osumo.paas.allizom.org/'
SUMO_URL = 'https://support.mozilla.org/'

APP_FOLDER = os.path.dirname(os.path.abspath(__file__))
APP_FOLDER_LENGTH = len(APP_FOLDER)
STATIC_FOLDER = os.path.join(APP_FOLDER, 'static')
TEMPLATES_FOLDER = os.path.join(APP_FOLDER, 'templates')
JS_DEVELOP_FOLDER = os.path.join(STATIC_FOLDER, 'js', 'develop')
PARTIALS_FOLDER = os.path.join(STATIC_FOLDER, 'partials')
CSS_FOLDER = os.path.join(STATIC_FOLDER, 'css')
MANIFEST_FILE_LOCATION = os.path.join(APP_FOLDER, 'manifest.webapp')

PRODUCTION_JS_FILE = os.path.join(STATIC_FOLDER, 'js', 'app.min.js')
PRODUCTION_CSS_FILE = os.path.join(STATIC_FOLDER, 'css', 'app.min.css')

try:
    from settings_local import *
except ImportError:
    pass
