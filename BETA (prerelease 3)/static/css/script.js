const toggle = document.getElementById("toggleID");

const primo = document.getElementById("HashCrackerSystem");
const secondo = document.getElementById("PasswordDifficultySystem");

let isRight = false;
let crackRunning = false;
let currentES = null;
let selectedCrack = null;

toggle.addEventListener("click", function () {
  isRight = !isRight;

  toggle.classList.toggle("active");

if (isRight) {
    // Hash Cracker esce verso sinistra
    primo.classList.remove("hash-enter");
    primo.classList.add("hash-exit");

    setTimeout(function () {
      primo.classList.add("hidden");
      primo.classList.remove("hash-exit");
      secondo.classList.remove("hidden");
      secondo.classList.remove("pass-exit");
      secondo.classList.add("pass-enter");
    }, 100);

  } else {
    secondo.classList.remove("pass-enter");
    secondo.classList.add("pass-exit");

    setTimeout(function () {
      secondo.classList.add("hidden");
      secondo.classList.remove("pass-exit");

      // Hash Cracker entra da destra
      primo.classList.remove("hidden");
      primo.classList.remove("hash-exit");
      primo.classList.add("hash-enter");
    }, 100);
  }
});


  function now() {
    return new Date().toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  }

  function log(msg, cls='') {
    const terminal = document.getElementById('terminal');

    const time = `[${now()}]`;

    terminal.innerHTML += `
        <div class="terminal-line">
            <span class:"log-time">${time}</span> ${msg}
        </div>
    `;

    terminal.scrollTop = terminal.scrollHeight;
}

  function clearLog() {
    document.getElementById('crack-log').innerHTML = '';
    document.getElementById('terminal').innerHTML = '';
}

  async function identifyHash() {
    const hash = document.getElementById('inputhash').value.trim();
    if (!hash) return;
    selectedCrack = null;
    document.getElementById('crack-panel').style.display = 'none';


    const res = document.getElementById('identify-result');
    res.innerHTML = '<div style="color:var(--green-dim);font-size:0.8rem;padding:0.5rem 0;">// analisi in corso...</div>';

    const r = await fetch('/api/identify', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({hash})
    });
    const data = await r.json();
    console.log(data);

  if (!data.identified) {
        res.innerHTML = '<div class="no-match">⚠ Unrecognized hash format. Check the input.</div>';
        return;
  }

    let html = `<div class="hash-meta" style="margin-top:0.75rem;margin-bottom:0.75rem;">
          Length: <strong>${data.length}</strong> characters &nbsp;|&nbsp; ${data.matches.length} detected type(s)
        </div>`;

    data.matches.forEach((m, i) => {
      html += `
      <div class="hash-match" style="animation-delay:${i*0.08}s">
        <div>
          <div class="match-name">${m.name}</div>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
          <span class="badge" style="color:${m.security_color};border-color:${m.security_color}">
            ${m.security_label}
          </span>
          ${m.crackable ? `<button class="crack-btn-inline" onclick="setupCrack('${m.name}')">[CRACK]</button>` : ''}
        </div>
      </div>`;
    });

    res.innerHTML = html;
  }


function setupCrack(type) {
  const hash = document.getElementById('inputhash').value.trim();
  const panel = document.getElementById('crack-panel');
  const meta = document.getElementById('crack-meta');

  selectedCrack = {
    hash: hash,
    type: type
  };

  meta.textContent = `> Hash: ${hash} (${hash.length} chars) | Type: ${type}`;

  panel.style.display = 'block';
  panel.style.animation = 'fadeIn 0.4s ease';

  panel.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  resetCrackUI();
}



  function toggleCustom() {
    const val = document.querySelector('input[name="wordlist"]:checked').value;
    document.getElementById('custom-words-group').style.display = val === 'custom' ? 'block' : 'none';
  }

  function resetCrackUI() {
    document.getElementById('found-banner').classList.remove('active');
    document.getElementById('not-found-banner').classList.remove('active');
    document.getElementById('progress-wrap').classList.remove('active');
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('crack-log').innerHTML = '';
    document.getElementById('crack-btn').disabled = false;
    document.getElementById('stop-btn').style.display = 'none';
  }

  function startCrack() {
    if (crackRunning || !selectedCrack) return;

    const hash = selectedCrack.hash;
    const type = selectedCrack.type;

    resetCrackUI();
    clearLog();

    document.getElementById('found-banner').classList.remove('active');
    document.getElementById('not-found-banner').classList.remove('active');
    document.getElementById('progress-wrap').classList.add('active');
    document.getElementById('crack-btn').disabled = true;
    document.getElementById('stop-btn').style.display = 'inline-block';

    crackRunning = true;

document.getElementById("terminal").classList.add("active");

document.getElementById("terminal").scrollIntoView({
    behavior: "smooth",
    block: "start"
});

log(`Initiating attack on <span class="hash-type">${type}</span>...`, 'highlight');

    log(`Initiating attack on <span class="hash-type">${type}</span>...`, 'highlight');
    log(`Wordlist: rockyou.txt`);

    fetch('/api/crack', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({hash, type, wordlist:"default"})
    }).then(res => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function read() {
        reader.read().then(({done, value}) => {
          if (done || !crackRunning) {
            crackRunning = false;
            document.getElementById('crack-btn').disabled = false;
            document.getElementById('stop-btn').style.display = 'none';
            return;
          }

          buffer += decoder.decode(value, {stream: true});
          const lines = buffer.split('\n\n');
          buffer = lines.pop();

          lines.forEach(line => {
            if (!line.startsWith('data:')) return;
            try {
              const ev = JSON.parse(line.slice(5).trim());
              handleEvent(ev);
            } catch(e) {}
          });

          read();
        });
      }
      read();
    });
  }

  function handleEvent(ev) {
    const pFill = document.getElementById('progress-fill');
    const pText = document.getElementById('progress-text');
    const speedText = document.getElementById('speed-text');

    switch(ev.type) {
      case 'start':
        log(`   Total Words: <span class="parole-totali-terminal">${ev.total.toLocaleString('it-IT')}</span>`, 'highlight');
        document.getElementById('stat-total').textContent = ev.total.toLocaleString('it-IT');
        break;

      case 'progress':
        const pct = ev.total > 0 ? Math.round((ev.tried/ev.total)*100) : 0;
        pFill.style.width = pct + '%';
        pText.textContent = `${ev.tried.toLocaleString('it-IT')} / ${ev.total.toLocaleString('it-IT')} (${pct}%)`;
        speedText.textContent = `${(ev.speed||0).toLocaleString('it-IT')} hash/s`;
        document.getElementById('stat-tried').textContent = ev.tried.toLocaleString('it-IT');
        document.getElementById('stat-elapsed').textContent = (ev.elapsed||0) + 's';
        document.getElementById('stat-speed').textContent = (ev.speed||0).toLocaleString('it-IT');
        if (ev.tried % 500 === 0) log(`[${pct}%] testando: ${ev.current}`);
        break;

      case 'found':
        crackRunning = false;
        pFill.style.width = '100%';
        document.getElementById('stat-tried').textContent = ev.tried.toLocaleString('it-IT');
        document.getElementById('stat-elapsed').textContent = (ev.elapsed||0) + 's';
        log(`   ✓ <span class="password-found-terminal">PASSWORD FOUND : ${ev.word}</span>`, 'success');
        log(`Attempts: ${ev.tried} in ${ev.elapsed}s`, 'success');
        document.getElementById('found-word').textContent = ev.word;
        document.getElementById('found-banner').classList.add('active');
        document.getElementById('crack-btn').disabled = false;
        document.getElementById('stop-btn').style.display = 'none';
        break;

      case 'not_found':
        crackRunning = false;
        pFill.style.width = '100%';
        document.getElementById('stat-tried').textContent = ev.tried.toLocaleString('it-IT');
        document.getElementById('stat-elapsed').textContent = (ev.elapsed||0) + 's';
        log(`   Hash non trovato dopo ${ev.tried} tentativi in ${ev.elapsed}s`, 'error');
        document.getElementById('not-found-banner').classList.add('active');
        document.getElementById('crack-btn').disabled = false;
        document.getElementById('stop-btn').style.display = 'none';
        break;

      case 'warning':
        log(`⚠ ${ev.message}`, 'warning');
        break;

      case 'error':
        log(`✗ ${ev.message}`, 'error');
        crackRunning = false;
        document.getElementById('crack-btn').disabled = false;
        document.getElementById('stop-btn').style.display = 'none';
        break;
    }
  }

  function stopCrack() {
    crackRunning = false;
    log('   Attack interrupted from the user.', 'warning');
    document.getElementById('crack-btn').disabled = false;
    document.getElementById('stop-btn').style.display = 'none';
  }

  function resetAll() {
    document.getElementById('inputhash').value = '';
    document.getElementById('identify-result').innerHTML = '';
    document.getElementById('crack-panel').style.display = 'none';
    document.getElementById('terminal').classList.remove('active');
    crackRunning = false;
    selectedCrack = null;
}


  document.getElementById('inputhash').addEventListener('keydown', e => {
    if (e.key === 'Enter') identifyHash();
  });

  document.getElementById("inputpassword").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    analyzePassword();
  }
});

document.getElementById("inputpassword").addEventListener("input", () => {
  analyzePassword();
});

const SCENARIOS = [
    { key: 'online_throttled',    name: 'Attacco online (rate-limited)',  sub: '100 tentativi/s — servizio con protezione' },
    { key: 'md5_cpu',             name: 'CPU moderna (MD5)',               sub: '1 miliardo hash/s' },
    { key: 'sha256_cpu',          name: 'CPU moderna (SHA-256)',           sub: '500M hash/s' },
    { key: 'bcrypt_cpu',          name: 'CPU moderna (bcrypt)',            sub: '10.000 hash/s — lento per design' },
    { key: 'sha256_gpu_rtx4090',  name: 'RTX 4090 (SHA-256)',             sub: '22 miliardi hash/s' },
    { key: 'md5_gpu_rtx4090',     name: 'RTX 4090 (MD5)',                 sub: '164 miliardi hash/s' },
    { key: 'bcrypt_gpu_rtx4090',  name: 'RTX 4090 (bcrypt)',              sub: '184.000 hash/s' },
  ];

  let debounceTimer = null;


  document.getElementById('inputpassword').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(analyze, 200);
  });

  async function analyzePassword() {
    const pwd = document.getElementById('inputpassword').value;
    const resultsEl = document.getElementById('results');

    if (!pwd) {
      resultsEl.classList.remove('active');
      return;
    }

    const res = await fetch('/api/analyze_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();
    if (data.error) return;

    resultsEl.classList.add('active');
    render(data);
  }

  function timeClass(seconds) {
    if (seconds < 1)         return 'time-instant';
    if (seconds < 3600)      return 'time-fast';
    if (seconds < 86400*30)  return 'time-medium';
    if (seconds < 86400*365*100) return 'time-slow';
    return 'time-huge';
  }

  function render(data) {
    const { score, strength, entropy_bits, combinations_str,
            charset_size, charset_types, patterns, suggestions,
            attack_times, is_common, length } = data;

    // Common banner
    document.getElementById('common-banner').style.display = is_common ? 'flex' : 'none';

    // Score
    document.getElementById('score-num').textContent = score;
    document.getElementById('score-num').style.color = strength.color;
    document.getElementById('strength-label').textContent = strength.label;
    document.getElementById('strength-label').style.color = strength.color;

    const fill = document.getElementById('meter-fill');
    fill.style.width = score + '%';
    fill.style.background = strength.color;

    // Details
    document.getElementById('detail-len').textContent = length;
    document.getElementById('detail-charset').textContent = charset_size;
    document.getElementById('detail-entropy').textContent = entropy_bits;

    // Entropy
    document.getElementById('entropy-big').textContent = entropy_bits;
    document.getElementById('entropy-explain').textContent =
      entropy_bits < 28  ? 'Estremamente bassa. Crackabile istantaneamente.' :
      entropy_bits < 36  ? 'Bassa. Vulnerabile ad attacchi su hardware moderno.' :
      entropy_bits < 60  ? 'Discreta. Resiste ad attacchi online, non a GPU potenti.' :
      entropy_bits < 80  ? 'Buona. Richiederebbe molto tempo anche su GPU.' :
                           'Eccellente. Praticamente impossibile da forzare con tecnologia attuale.';

    document.getElementById('combinations-str').textContent = combinations_str;
    document.getElementById('charset-size-big').textContent = charset_size;

    // Charset tags
    const tagMap = { digits:'tag-digits', lowercase:'tag-lowercase', uppercase:'tag-uppercase',
                     symbols:'tag-symbols', extended:'tag-extended' };
    Object.entries(tagMap).forEach(([key, id]) => {
      document.getElementById(id).classList.toggle('active', charset_types.includes(key));
    });

    // Scenarios
    const scenList = document.getElementById('scenario-list');
    scenList.innerHTML = '';
    SCENARIOS.forEach((sc, i) => {
      const t = attack_times[sc.key];
      if (!t) return;
      const cls = timeClass(t.seconds);
      const div = document.createElement('div');
      div.className = 'scenario-item';
      div.style.animationDelay = (i * 0.05) + 's';
      div.innerHTML = `
        <div>
          <div class="scenario-name">${sc.name}</div>
          <div class="scenario-speed">${sc.sub}</div>
        </div>
        <div class="scenario-time ${cls}">${t.human}</div>
      `;
      scenList.appendChild(div);
    });

    // Patterns
    const patList = document.getElementById('pattern-list');
    patList.innerHTML = '';
    if (patterns.length === 0) {
      patList.innerHTML = '<div class="no-patterns">✓ Nessun pattern prevedibile rilevato</div>';
    } else {
      patterns.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'pattern-item';
        div.style.animationDelay = (i * 0.06) + 's';
        div.innerHTML = `<span>⚠</span> ${p}`;
        patList.appendChild(div);
      });
    }

    // Suggestions
    const sugList = document.getElementById('suggestion-list');
    sugList.innerHTML = '';
    suggestions.forEach((s, i) => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.style.animationDelay = (i * 0.07) + 's';
      div.textContent = '→ ' + s;
      sugList.appendChild(div);
    });
  }