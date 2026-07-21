from datetime import datetime, timezone, timedelta

TZ_VENEZUELA = timezone(timedelta(hours=-4))

def now_ve():
    return datetime.now(TZ_VENEZUELA)
