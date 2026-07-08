import re

HASH_PATTERNS = [
    {
        'name': 'MD5',
        'regex': r'^[a-fA-F0-9]{32}$',
        'length': 32,
        'security': 'broken',
    },
    {
        'name': 'SHA1',
        'regex': r'^[a-fA-F0-9]{40}$',
        'length': 40,
        'security': 'weak',
    },
    {
        'name': 'SHA256',
        'regex': r'^[a-fA-F0-9]{64}$',
        'length': 64,
        'security': 'strong',
    },
    {
        'name': 'SHA512',
        'regex': r'^[a-fA-F0-9]{128}$',
        'length': 128,
        'security': 'strong',
    },
    {
        'name': 'SHA224',
        'regex': r'^[a-fA-F0-9]{56}$',
        'length': 56,
        'security': 'strong',
    },
    {
        'name': 'SHA384',
        'regex': r'^[a-fA-F0-9]{96}$',
        'length': 96,
        'security': 'strong',
    },
    {
        'name': 'bcrypt',
        'regex': r'^\$2[aby]?\$\d{2}\$.{53}$',
        'length': None,
        'security': 'very_strong',
    },
    {
        'name': 'NTLM',
        'regex': r'^[a-fA-F0-9]{32}$',
        'length': 32,
        'security': 'broken',
    },
    {
        'name': 'MD4',
        'regex': r'^[a-fA-F0-9]{32}$',
        'length': 32,
        'security': 'broken',
    },
    {
        'name': 'MySQL4.1+',
        'regex': r'^\*[a-fA-F0-9]{40}$',
        'length': 41,
        'security': 'weak',
    },
    {
        'name': 'Whirlpool',
        'regex': r'^[a-fA-F0-9]{128}$',
        'length': 128,
        'security': 'strong',
    },
    {
        'name': 'CRC32',
        'regex': r'^[a-fA-F0-9]{8}$',
        'length': 8,
        'security': 'broken',
    },
    {
        'name': 'LM Hash',
        'regex': r'^[a-fA-F0-9]{32}$',
        'length': 32,
        'security': 'broken',
    },
]

SECURITY_LABELS = {
    'broken': {'label': 'COMPROMISED', 'color': '#ff2d55'},
    'weak': {'label': 'WEAK', 'color': '#ff9500'},
    'strong': {'label': 'STRONG', 'color': '#30d158'},
    'very_strong': {'label': 'VERY STRONG', 'color': '#0a84ff'},
}

def identify_hash(hash_str: str) -> dict:
    matches = []
    hash_str = hash_str.strip()

    for pattern in HASH_PATTERNS:
        if re.match(pattern['regex'], hash_str):
            sec = pattern['security']
            matches.append({
                'name': pattern['name'],
                'security': sec,
                'security_label': SECURITY_LABELS[sec]['label'],
                'security_color': SECURITY_LABELS[sec]['color'],
                'crackable': sec in ('broken', 'weak'),
            })

    seen = set()
    unique = []
    for m in matches:
        if m['name'] not in seen:
            seen.add(m['name'])
            unique.append(m)

    return {
        'hash': hash_str,
        'length': len(hash_str),
        'matches': unique,
        'identified': len(unique) > 0,
    }