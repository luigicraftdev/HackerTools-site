import hashlib
import time
from typing import Generator, Optional, List


def hash_word(word: str, hash_type: str) -> Optional[str]:
    word_bytes = word.encode('utf-8', errors='ignore')
    
    algorithms = {
        'MD5':    lambda b: hashlib.md5(b).hexdigest(),
        'NTLM':   lambda b: hashlib.new('md4', b.encode('utf-16-le') if isinstance(b, str) else b).hexdigest(),
        'SHA1':   lambda b: hashlib.sha1(b).hexdigest(),
        'SHA224': lambda b: hashlib.sha224(b).hexdigest(),
        'SHA256': lambda b: hashlib.sha256(b).hexdigest(),
        'SHA384': lambda b: hashlib.sha384(b).hexdigest(),
        'SHA512': lambda b: hashlib.sha512(b).hexdigest(),
        'CRC32':  lambda b: format(0xffffffff & __import__('zlib').crc32(b), '08x'),
        'MD4':    lambda b: hashlib.new('md4', b).hexdigest() if 'md4' in hashlib.algorithms_available else None,
        'Whirlpool': lambda b: hashlib.new('whirlpool', b).hexdigest() if 'whirlpool' in hashlib.algorithms_available else None,
    }

    fn = algorithms.get(hash_type)
    if fn is None:
        return None
    try:
        return fn(word_bytes)
    except Exception:
        return None


def crack_hash(
    target_hash: str,
    hash_type: str,
    wordlist_path: Optional[str] = None,
    custom_list: Optional[List[str]] = None,
) -> Generator[dict, None, None]:
    target_hash = target_hash.strip().lower()

    if hash_type == 'bcrypt':
        yield {'type': 'warning', 'message': 'bcrypt is really low. Try using a short wordlist..'}
        try:
            import bcrypt as _bcrypt
            words = custom_list or []
            if wordlist_path:
                try:
                    with open(wordlist_path, 'r', encoding='utf-8', errors='ignore') as f:
                        words = [line.strip() for line in f if line.strip()]
                except FileNotFoundError:
                    yield {'type': 'error', 'message': f'Wordlist non trovata: {wordlist_path}'}
                    return

            total = len(words)
            for i, word in enumerate(words):
                if _bcrypt.checkpw(word.encode(), target_hash.encode()):
                    yield {'type': 'found', 'word': word, 'tried': i + 1, 'total': total}
                    return
                if i % 5 == 0:
                    yield {'type': 'progress', 'tried': i + 1, 'total': total, 'current': word}
            yield {'type': 'not_found', 'tried': total, 'total': total}
        except ImportError:
            yield {'type': 'error', 'message': 'Installa bcrypt: pip install bcrypt'}
        return

    words = []
    if custom_list:
        words = custom_list
    elif wordlist_path:
        try:
            with open(wordlist_path, 'r', encoding='utf-8', errors='ignore') as f:
                words = [line.strip() for line in f if line.strip()]
        except FileNotFoundError:
            yield {'type': 'error', 'message': f'Wordlist non trovata: {wordlist_path}'}
            return
    else:
        yield {'type': 'error', 'message': 'Nessuna wordlist disponibile'}
        return

    total = len(words)
    yield {'type': 'start', 'total': total, 'hash_type': hash_type}

    start_time = time.time()

    for i, word in enumerate(words):
        computed = hash_word(word, hash_type)
        if computed is None:
            yield {'type': 'error', 'message': f'Algoritmo {hash_type} not supported on this system'}
            return

        if computed == target_hash:
            elapsed = round(time.time() - start_time, 3)
            yield {
                'type': 'found',
                'word': word,
                'tried': i + 1,
                'total': total,
                'elapsed': elapsed,
            }
            return

        if i % 100 == 0:
            elapsed = round(time.time() - start_time, 3)
            speed = round((i + 1) / elapsed) if elapsed > 0 else 0
            yield {
                'type': 'progress',
                'tried': i + 1,
                'total': total,
                'current': word,
                'elapsed': elapsed,
                'speed': speed,
            }

    elapsed = round(time.time() - start_time, 3)
    yield {
        'type': 'not_found',
        'tried': total,
        'total': total,
        'elapsed': elapsed,
    }