import math
import re
import unicodedata

# ---------------------------------------------------------------------------
# Real attack speeds (hashes/second)
# Source: Hashcat benchmarks on consumer/professional hardware
# ---------------------------------------------------------------------------
ATTACK_SPEEDS = {
    'md5_gpu_rtx4090':     164_000_000_000,   # RTX 4090 — MD5
    'sha1_gpu_rtx4090':     51_000_000_000,   # RTX 4090 — SHA1
    'sha256_gpu_rtx4090':   22_000_000_000,   # RTX 4090 — SHA256
    'bcrypt_gpu_rtx4090':          184_000,   # RTX 4090 — bcrypt (slow by design)
    'md5_cpu':               1_000_000_000,   # Modern CPU — MD5
    'sha256_cpu':              500_000_000,   # Modern CPU — SHA256
    'bcrypt_cpu':                   10_000,   # Modern CPU — bcrypt
    'online_throttled':                100,   # Online service with rate limiting
}

# Charset sizes
CHARSETS = {
    'digits':       {'chars': 10,   'label': 'Digits (0-9)'},
    'lowercase':    {'chars': 26,   'label': 'Lowercase (a-z)'},
    'uppercase':    {'chars': 26,   'label': 'Uppercase (A-Z)'},
    'symbols':      {'chars': 33,   'label': 'Symbols (!@#...)'},
    'extended':     {'chars': 128,  'label': 'Extended ASCII'},
    'unicode':      {'chars': 65536,'label': 'Unicode'},
}

COMMON_PATTERNS = [
    (r'^[0-9]+$',                        'Numbers only'),
    (r'^[a-z]+$',                        'Lowercase only'),
    (r'^[A-Z]+$',                        'Uppercase only'),
    (r'^[a-zA-Z]+$',                     'Letters only'),
    (r'^[a-zA-Z0-9]+$',                  'Alphanumeric'),
    (r'(.)\1{2,}',                       'Repeated characters'),
    (r'(012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)', 'Numeric sequence'),
    (r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', 'Alphabetical sequence'),
    (r'(qwerty|asdf|zxcv|qazwsx)',       'Keyboard pattern'),
]

COMMON_PASSWORDS = {
    'password', '123456', '12345678', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'sunshine', 'princess',
    'iloveyou', 'password1', '1234567890', 'abc123', 'football',
    'superman', 'batman', 'shadow', 'trustno1', 'pass', 'test',
}

STRENGTH_LEVELS = [
    {'min': 0,   'max': 25,  'label': 'CRITICAL',  'color': '#ff2d55', 'bg': 'rgba(255,45,85,0.08)'},
    {'min': 25,  'max': 45,  'label': 'WEAK',      'color': '#ff6b35', 'bg': 'rgba(255,107,53,0.08)'},
    {'min': 45,  'max': 60,  'label': 'FAIR',      'color': '#ffb800', 'bg': 'rgba(255,184,0,0.08)'},
    {'min': 60,  'max': 75,  'label': 'GOOD',      'color': '#008cff', 'bg': 'rgba(0,140,255,0.08)'},
    {'min': 75,  'max': 101, 'label': 'EXCELLENT', 'color': '#00ff41', 'bg': 'rgba(0,255,65,0.08)'},
]


def detect_charset_size(password: str) -> tuple[int, list[str]]:
    """Detect the charset size and character types used."""
    size = 0
    types = []

    if re.search(r'[0-9]', password):
        size += 10
        types.append('digits')
    if re.search(r'[a-z]', password):
        size += 26
        types.append('lowercase')
    if re.search(r'[A-Z]', password):
        size += 26
        types.append('uppercase')
    if re.search(r'[!-/:-@\[-`{-~]', password):
        size += 33
        types.append('symbols')

    non_ascii = [c for c in password if ord(c) > 127]
    if non_ascii:
        size += 256
        types.append('extended')

    return max(size, 1), types


def seconds_to_human(seconds: float) -> str:
    """Convert seconds into a human-readable string."""
    if seconds < 0.001:
        return "less than 1 millisecond"
    if seconds < 1:
        return f"{seconds*1000:.0f} milliseconds"
    if seconds < 60:
        return f"{seconds:.1f} seconds"
    if seconds < 3600:
        m = seconds / 60
        return f"{m:.1f} minutes"
    if seconds < 86400:
        h = seconds / 3600
        return f"{h:.1f} hours"
    if seconds < 86400 * 30:
        d = seconds / 86400
        return f"{d:.1f} days"
    if seconds < 86400 * 365:
        mo = seconds / (86400 * 30)
        return f"{mo:.1f} months"
    if seconds < 86400 * 365 * 1000:
        y = seconds / (86400 * 365)
        return f"{y:.0f} years"
    if seconds < 86400 * 365 * 1_000_000:
        ky = seconds / (86400 * 365 * 1000)
        return f"{ky:.0f} millennia"
    return "astronomical time (virtually infinite)"


def calc_entropy(charset_size: int, length: int) -> float:
    """Calculate entropy in bits."""
    if charset_size <= 0 or length <= 0:
        return 0
    return length * math.log2(charset_size)


def calc_brute_time(combinations: float, speed: float) -> float:
    """Average time = combinations / (2 * speed) — worst case = combinations / speed."""
    if speed <= 0:
        return float('inf')
    return combinations / (2 * speed)


def detect_patterns(password: str) -> list[str]:
    found = []
    pw_lower = password.lower()
    for pattern, label in COMMON_PATTERNS:
        if re.search(pattern, pw_lower, re.IGNORECASE):
            found.append(label)
    return found


def score_password(entropy: float, length: int, patterns: list, is_common: bool,
                   charset_types: list) -> int:
    """Calculate a score from 0 to 100."""
    score = 0

    score += min(50, int(entropy / 2))

    if length >= 8:
        score += 5
    if length >= 12:
        score += 8
    if length >= 16:
        score += 10
    if length >= 20:
        score += 7

    score += len(charset_types) * 5

    score -= len(patterns) * 8
    if is_common:
        score -= 40

    return max(0, min(100, score))


def get_strength_level(score: int) -> dict:
    for lvl in STRENGTH_LEVELS:
        if lvl['min'] <= score < lvl['max']:
            return lvl
    return STRENGTH_LEVELS[-1]


def get_suggestions(password: str, charset_types: list, patterns: list,
                    is_common: bool, length: int) -> list[str]:
    tips = []

    if is_common:
        tips.append("This is one of the most commonly used passwords in the world—change it immediately.")
    if length < 12:
        tips.append(f"Too short ({length} characters). Aim for at least 12–16 characters.")
    if 'uppercase' not in charset_types:
        tips.append("Add uppercase letters to increase the charset size.")
    if 'digits' not in charset_types:
        tips.append("Include at least a few numeric digits.")
    if 'symbols' not in charset_types:
        tips.append("Symbols (!@#$%...) dramatically increase entropy.")
    if patterns:
        tips.append(f"Avoid predictable patterns: {', '.join(patterns[:2])}.")
    if not tips:
        tips.append("Excellent password! Consider using a password manager to store it securely.")

    return tips


def analyze_password(password: str) -> dict:
    length = len(password)
    charset_size, charset_types = detect_charset_size(password)
    entropy = calc_entropy(charset_size, length)
    combinations = charset_size ** length
    patterns = detect_patterns(password)
    is_common = password.lower() in COMMON_PASSWORDS
    score = score_password(entropy, length, patterns, is_common, charset_types)
    strength = get_strength_level(score)
    suggestions = get_suggestions(password, charset_types, patterns, is_common, length)

    attack_times = {}
    for scenario, speed in ATTACK_SPEEDS.items():
        seconds = calc_brute_time(combinations, speed)
        attack_times[scenario] = {
            'speed': speed,
            'seconds': min(seconds, 1e20),
            'human': seconds_to_human(seconds),
        }

    return {
        'length': length,
        'charset_size': charset_size,
        'charset_types': charset_types,
        'entropy_bits': round(entropy, 2),
        'combinations': combinations if combinations < 1e30 else -1,
        'combinations_str': f"10^{math.log10(combinations):.1f}" if combinations > 1e10 else f"{combinations:,.0f}",
        'patterns': patterns,
        'is_common': is_common,
        'score': score,
        'strength': strength,
        'suggestions': suggestions,
        'attack_times': attack_times,
    }