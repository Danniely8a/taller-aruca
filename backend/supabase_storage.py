import os

_supabase_client = None

def get_supabase():
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_KEY')
        if url and key:
            try:
                from supabase import create_client
                _supabase_client = create_client(url, key)
            except Exception as e:
                print(f"Supabase init error: {e}")
                _supabase_client = False
    if _supabase_client is False:
        return None
    return _supabase_client

def upload_to_storage(bucket, path, file_bytes, content_type='image/jpeg'):
    sb = get_supabase()
    if not sb:
        raise Exception('Supabase no configurado')
    sb.storage.from_(bucket).upload(path, file_bytes, {'content-type': content_type})
    return path

def delete_from_storage(bucket, path):
    sb = get_supabase()
    if sb:
        try:
            sb.storage.from_(bucket).remove([path])
        except:
            pass

def get_public_url(bucket, path):
    sb = get_supabase()
    if not sb:
        return f'/api/photos/uploads/{path}'
    try:
        res = sb.storage.from_(bucket).get_public_url(path)
        return res
    except:
        return f'/api/photos/uploads/{path}'

def download_file(bucket, path):
    sb = get_supabase()
    if not sb:
        raise Exception('Supabase no configurado')
    return sb.storage.from_(bucket).download(path)
