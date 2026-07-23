import os
from supabase import create_client, Client

_supabase_client = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_KEY')
        if url and key:
            _supabase_client = create_client(url, key)
    return _supabase_client

def upload_to_storage(bucket: str, path: str, file_bytes: bytes, content_type: str = 'image/jpeg') -> str:
    """Upload file to Supabase Storage, returns the path"""
    sb = get_supabase()
    if not sb:
        raise Exception('Supabase no configurado')
    sb.storage.from_(bucket).upload(path, file_bytes, {'content-type': content_type})
    return path

def delete_from_storage(bucket: str, path: str):
    """Delete file from Supabase Storage"""
    sb = get_supabase()
    if sb:
        try:
            sb.storage.from_(bucket).remove([path])
        except:
            pass

def get_public_url(bucket: str, path: str) -> str:
    """Get public URL for a file in Supabase Storage"""
    sb = get_supabase()
    if not sb:
        return f'/api/photos/uploads/{path}'
    res = sb.storage.from_(bucket).get_public_url(path)
    return res

def download_file(bucket: str, path: str) -> bytes:
    """Download file from Supabase Storage"""
    sb = get_supabase()
    if not sb:
        raise Exception('Supabase no configurado')
    return sb.storage.from_(bucket).download(path)
