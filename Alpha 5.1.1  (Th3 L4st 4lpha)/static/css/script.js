const toggle = document.getElementById("toggleID");

const primo = document.getElementById("HashCrackerSystem");
const secondo = document.getElementById("PasswordDifficultySystem");

let isRight = false;
let crackRunning = false;
let currentES = null;

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
    const el = document.getElementById('crack-log');
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="log-time">[${now()}]</span><span class="log-msg ${cls}">${msg}</span>`;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }

  function clearLog() {
    document.getElementById('crack-log').innerHTML = '';
  }

  async function identifyHash() {
    const hash = document.getElementById('inputhash').value.trim();
    if (!hash) return;

    const res = document.getElementById('identify-result');
    res.innerHTML = '<div style="color:var(--green-dim);font-size:0.8rem;padding:0.5rem 0;">// analisi in corso...</div>';

    const r = await fetch('/api/identify', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({hash})
    });
    const data = await r.json();

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
    const sel = document.getElementById('selected-type');

    // Popola select con tutti i tipi compatibili
    const crackableTypes = ['MD5','SHA1','SHA256','SHA512','SHA224','SHA384','NTLM','CRC32','bcrypt'];
    sel.innerHTML = crackableTypes.map(t =>
      `<option value="${t}" ${t===type?'selected':''}>${t}</option>`
    ).join('');

    meta.textContent = `> Hash: ${hash.substring(0,20)}${hash.length>20?'…':''} (${hash.length} chars)`;

    panel.style.display = 'block';
    panel.style.animation = 'fadeIn 0.4s ease';
    panel.scrollIntoView({behavior:'smooth', block:'start'});

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
    if (crackRunning) return;

    const hash = document.getElementById('inputhash').value.trim();
    const type = document.getElementById('selected-type').value;
    const wordlistChoice = document.querySelector('input[name="wordlist"]:checked').value;
    const customWords = document.getElementById('custom-words').value;

    resetCrackUI();
    clearLog();

    document.getElementById('found-banner').classList.remove('active');
    document.getElementById('not-found-banner').classList.remove('active');
    document.getElementById('progress-wrap').classList.add('active');
    document.getElementById('crack-btn').disabled = true;
    document.getElementById('stop-btn').style.display = 'inline-block';

    crackRunning = true;
    log(`Avvio attacco su ${type}...`, 'highlight');
    log(`Wordlist: ${wordlistChoice === 'custom' ? 'personalizzata' : 'rockyou_mini.txt'}`);

    fetch('/api/crack', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({hash, type, wordlist: wordlistChoice, custom_words: customWords})
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
        log(`Totale parole: ${ev.total.toLocaleString('it-IT')}`, 'highlight');
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
        log(`✓ PASSWORD TROVATA: ${ev.word}`, 'success');
        log(`Tentativi: ${ev.tried} in ${ev.elapsed}s`, 'success');
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
        log(`Hash non trovato dopo ${ev.tried} tentativi in ${ev.elapsed}s`, 'error');
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
    log('Attacco interrotto dall\'utente.', 'warning');
    document.getElementById('crack-btn').disabled = false;
    document.getElementById('stop-btn').style.display = 'none';
  }

  function resetAll() {
    document.getElementById('inputhash').value = '';
    document.getElementById('identify-result').innerHTML = '';
    document.getElementById('crack-panel').style.display = 'none';
    crackRunning = false;
  }

  // Enter to identify
  document.getElementById('inputhash').addEventListener('keydown', e => {
    if (e.key === 'Enter') identifyHash();
  });