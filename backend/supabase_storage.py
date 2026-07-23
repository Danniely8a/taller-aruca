import os
import urllib.request
import urllib.error
import json

SUPABASE_URL = None
SUPABASE_KEY = None

def _get_config():
    global SUPABASE_URL, SUPABASE_KEY
    if SUPABASE_URL is None:
        SUPABASE_URL = os.getenv('SUPABASE_URL', '')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')
    return SUPABASE_URL, SUPABASE_KEY

def upload_to_storage(bucket, path, file_bytes, content_type='image/jpeg'):
    url, key = _get_config()
    if not url or not key:
        raise Exception('Supabase no configurado')
    full_url = f'{url}/storage/v1/object/{bucket}/{path}'
    headers = {
        'Authorization': f'Bearer {key}',
        'apikey': key,
        'Content-Type': content_type,
    }
    req = urllib.request.Request(full_url, data=file_bytes, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            pass
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise Exception(f'Upload failed ({e.code}): {body}')
    return path

def delete_from_storage(bucket, path):
    url, key = _get_config()
    if not url or not key:
        return
    try:
        full_url = f'{url}/storage/v1/object/{bucket}/{path}'
        headers = {'Authorization': f'Bearer {key}', 'apikey': key}
        req = urllib.request.Request(full_url, headers=headers, method='DELETE')
        with urllib.request.urlopen(req):
            pass
    except:
        pass

def get_public_url(bucket, path):
    url, key = _get_config()
    if not url:
        return f'/api/photos/uploads/{path}'
    return f'{url}/storage/v1/object/public/{bucket}/{path}'

def download_file(bucket, path):
    url, key = _get_config()
    if not url or not key:
        raise Exception('Supabase no configurado')
    full_url = f'{url}/storage/v1/object/{bucket}/{path}'
    headers = {'Authorization': f'Bearer {key}', 'apikey': key}
    req = urllib.request.Request(full_url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return resp.read()
