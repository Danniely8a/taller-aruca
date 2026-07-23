import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))
try:
    from routes import photos_bp
    print('photos_bp OK')
except Exception as e:
    print(f'photos_bp FAIL: {e}')
try:
    from routes import payments_bp
    print('payments_bp OK')
except Exception as e:
    print(f'payments_bp FAIL: {e}')
try:
    from api import index
    print('index OK')
except Exception as e:
    print(f'index FAIL: {e}')
print('DONE')
