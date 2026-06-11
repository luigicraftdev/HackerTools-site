import re

HASH_PATTERNS = [
    {
        'name': 'MD5',
        'regex': r'^[a-fA-F0-9]{32}$',
        'length': 32,
        'description': 'Message Digest 5 — 128 bit',
        'security': 'broken',
    },
    {
        'name': 'SHA1',
        'regex': r'^[a-fA-F0-9]{40}$',
        'length': 40,
        'description': 'Secure Hash Algorithm 1 — 160 bit',
        'security': 'weak',
    },
    {
        'name': 'SHA256',
        'regex': r'^[a-fA-F0-9]{64}$',
        'length': 64,
        'description': 'SHA-2 family — 256 bit',
        'security': 'strong',
    },
    {
        'name': 'SHA512',
        'regex': r'^[a-fA-F0-9]{128}$',
        'length': 128,
        'description': 'SHA-2 family — 512 bit',
        'security': 'strong',
    },
    {
        'name': 'SHA224',
        'regex': r'^[a-fA-F0-9]{56}$',
        'length': 56,
        'description': 'SHA-2 family — 224 bit',
        'security': 'strong',
    },
    {
        'name': 'SHA384',
        'regex': r'^[a-fA-F0-9]{96}$',
        'length': 96,
        'description': 'SHA-2 family — 384 bit',
        'security': 'strong',
    },
    {
        'name': 'bcrypt',
        'regex': r'^\$2[aby]?\$\d{2}\$.{53}$',
        'length': None,
        'description': 'Adaptive hash — salted, slow by design',
        'security': 'very_strong',
    },
    {
        'name': 'NTLM',
        'regex': r'^[a-fA-F0-9]{32}$',
        'length': 32,
        'description': 'Windows NT LAN Manager hash',
        'security': 'broken',
    },
    {
        'name': 'MD4',
        'regex': r'^[a-fA-F0-9]{32}$',
        'length': 32,
        'description': 'Message Digest 4 — obsoleto',
        'security': 'broken',
    },
    {
        'name': 'MySQL4.1+',
        'regex': r'^\*[a-fA-F0-9]{40}$',
        'length': 41,
        'description': 'MySQL password hash',
        'security': 'weak',
    },
    {
        'name': 'Whirlpool',
        'regex': r'^[a-fA-F0-9]{128}$',
        'length': 128,
        'description': 'Whirlpool — 512 bit',
        'security': 'strong',
    },
    {
        'name': 'CRC32',
        'regex': r'^[a-fA-F0-9]{8}$',
        'length': 8,
        'description': 'Cyclic Redundancy Check — NON crittografico',
        'security': 'broken',
    },
    {
        'name': 'LM Hash',
        'regex': r'^[a-fA-F0-9]{32}$',
        'length': 32,
        'description': 'Windows LAN Manager — legacy',
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
                'description': pattern['description'],
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