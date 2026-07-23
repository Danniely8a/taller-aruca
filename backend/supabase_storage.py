import os
import requests

SUPABASE_URL = None
SUPABASE_KEY = None

def _get_config():
    global SUPABASE_URL, SUPABASE_KEY
    if SUPABASE_URL is None:
        SUPABASE_URL = os.getenv('SUPABASE_URL', '')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')
    return SUPABASE_URL, SUPABASE_KEY

def _headers():
    url, key = _get_config()
    return {
        'Authorization': f'Bearer {key}',
        'apikey': key,
    }

def upload_to_storage(bucket, path, file_bytes, content_type='image/jpeg'):
    url, key = _get_config()
    if not url or not key:
        raise Exception('Supabase no configurado')
    res = requests.post(
        f'{url}/storage/v1/object/{bucket}/{path}',
        headers={**_headers(), 'Content-Type': content_type},
        data=file_bytes
    )
    if res.status_code not in (200, 201):
        raise Exception(f'Upload failed: {res.text}')
    return path

def delete_from_storage(bucket, path):
    url, key = _get_config()
    if not url or not key:
        return
    try:
        requests.delete(
            f'{url}/storage/v1/object/{bucket}/{path}',
            headers=_headers()
        )
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
    res = requests.get(
        f'{url}/storage/v1/object/{bucket}/{path}',
        headers=_headers()
    )
    if res.status_code != 200:
        raise Exception(f'Download failed: {res.text}')
    return res.content
