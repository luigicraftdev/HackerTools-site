const toggle = document.getElementById("toggleID");

const primo = document.getElementById("HashCrackerSystem");
const secondo = document.getElementById("PasswordDifficultySystem");

let isRight = false;

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

function resetAll() {
    document.getElementById('hash-input').value = '';
    document.getElementById('identify-result').innerHTML = '';
    document.getElementById('crack-panel').style.display = 'none';
    crackRunning = false;
  }