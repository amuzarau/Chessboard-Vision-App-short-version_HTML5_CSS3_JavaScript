// ===== Chess square color logic =====
function isWhiteSquare(square) {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0..7
    const rank = parseInt(square[1], 10) - 1;              // 0..7
    // even sum => black, odd sum => white
    return (file + rank) % 2 !== 0;
}

function getRandomSquare() {
    const files = 'abcdefgh';
    const ranks = '12345678';
    return files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
}

// ===== State =====
let mode = 'timed';         // 'timed' | 'free'
let gameRunning = false;

let correctCount = 0;
let wrongCount = 0;
let totalQuestions = 64;
let questionsLeft = 64;
let timeLeft = 60;
let timer = null;
let currentSquare = "";

// ===== DOM =====
const squareDisplay = document.getElementById('square-display');
const correctCountEl = document.getElementById('correct-count');
const wrongCountEl = document.getElementById('wrong-count');
const timeLeftEl = document.getElementById('time-left');
const questionsLeftEl = document.getElementById('questions-left');
const totalAnsweredEl = document.getElementById('total-answered');
const accuracyEl = document.getElementById('accuracy');
const resultEl = document.getElementById('result');

const btnWhite = document.getElementById('btn-white');
const btnBlack = document.getElementById('btn-black');
const btnStartStop = document.getElementById('btn-startstop');

const btnTimed = document.getElementById('btn-timed');
const btnFree = document.getElementById('btn-free');

const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');

// ===== Mode handling =====
function setMode(newMode) {
    // Stop any running session cleanly
    if (timer) { clearInterval(timer); timer = null; }
    gameRunning = false;

    mode = newMode;
    btnTimed.classList.toggle('active', mode === 'timed');
    btnFree.classList.toggle('active', mode === 'free');

    resetCountsAndUI();

    if (mode === 'timed') {
        // initialize from button dataset
        timeLeft = parseInt(btnTimed.dataset.time, 10) || 60;
        totalQuestions = parseInt(btnTimed.dataset.questions, 10) || 64;
        questionsLeft = totalQuestions;

        timeLeftEl.textContent = timeLeft;
        questionsLeftEl.textContent = questionsLeft;

        progressBar.style.width = "0%";
        progressContainer.classList.remove('hidden');

        // In timed mode, Start/Stop works only as Start → then disabled
        btnStartStop.disabled = false;
        btnStartStop.textContent = "Старт";
    } else {
        // free mode
        timeLeft = 0;
        totalQuestions = Infinity;
        questionsLeft = Infinity;

        timeLeftEl.textContent = "—";
        questionsLeftEl.textContent = "∞";
        progressBar.style.width = "0%";
        progressContainer.classList.add('hidden');

        btnStartStop.disabled = false;
        btnStartStop.textContent = "Старт";
    }

    squareDisplay.textContent = "e4";
    resultEl.textContent = "";
}

btnTimed.addEventListener('click', () => setMode('timed'));
btnFree.addEventListener('click', () => setMode('free'));

// ===== Core helpers =====
function resetCountsAndUI() {
    correctCount = 0;
    wrongCount = 0;
    updateCounts();
    updateTotals();
    updateAccuracy();
}

function updateCounts() {
    correctCountEl.textContent = correctCount;
    wrongCountEl.textContent = wrongCount;
}

function updateTotals() {
    const totalAnswered = correctCount + wrongCount;
    totalAnsweredEl.textContent = totalAnswered;
}

function updateAccuracy() {
    const totalAnswered = correctCount + wrongCount;
    const pct = totalAnswered === 0 ? 0 : Math.round((correctCount / totalAnswered) * 100);
    accuracyEl.textContent = `${pct}%`;
}

function updateProgressBar() {
    if (mode !== 'timed') return;
    const done = totalQuestions - questionsLeft;
    const percent = Math.max(0, Math.min(100, (done / totalQuestions) * 100));
    progressBar.style.width = `${percent}%`;
}

function newRound() {
    if (mode === 'timed' && questionsLeft <= 0) {
        endGame();
        return;
    }
    currentSquare = getRandomSquare();
    squareDisplay.textContent = currentSquare;

    if (mode === 'timed') {
        questionsLeftEl.textContent = questionsLeft;
        updateProgressBar();
    }
}

function handleAnswer(answer) {
    if (!gameRunning) return;

    const correctColor = isWhiteSquare(currentSquare) ? 'white' : 'black';
    if (answer === correctColor) {
        correctCount++;
    } else {
        wrongCount++;
    }
    updateCounts();
    updateTotals();
    updateAccuracy();

    if (mode === 'timed') {
        questionsLeft--;
    }
    newRound();
}

// ===== Start/Stop single button =====
btnStartStop.addEventListener('click', () => {
    if (mode === 'timed') {
        // Acts only as Start
        if (!gameRunning) {
            startTimed();
        }
        // While running, button is disabled (set in startTimed)
    } else {
        // Free mode toggles
        if (!gameRunning) {
            startFree();
        } else {
            stopFree();
        }
    }
});

// ===== Timed mode flow =====
function startTimed() {
    resetCountsAndUI();
    resultEl.textContent = "";
    gameRunning = true;

    // lock the Start/Stop button while running
    btnStartStop.textContent = "Идёт...";
    btnStartStop.disabled = true;

    // initialize time & questions
    timeLeft = parseInt(btnTimed.dataset.time, 10) || 60;
    totalQuestions = parseInt(btnTimed.dataset.questions, 10) || 64;
    questionsLeft = totalQuestions;

    timeLeftEl.textContent = timeLeft;
    questionsLeftEl.textContent = questionsLeft;
    progressContainer.classList.remove('hidden');
    progressBar.style.width = "0%";

    newRound();

    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        timeLeftEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            timer = null;
            endGame();
        }
    }, 1000);
}

// ===== Free mode flow =====
function startFree() {
    resetCountsAndUI();
    resultEl.textContent = "";
    gameRunning = true;

    btnStartStop.textContent = "Стоп";
    btnStartStop.disabled = false; // stays active for stop

    timeLeftEl.textContent = "—";
    questionsLeftEl.textContent = "∞";
    progressContainer.classList.add('hidden');

    newRound();
}

function stopFree() {
    if (!gameRunning) return;
    gameRunning = false;
    btnStartStop.textContent = "Старт";
    resultEl.textContent = `Остановлено. Правильно: ${correctCount}, Неправильно: ${wrongCount}. Точность: ${accuracyEl.textContent}`;
}

// ===== Common end =====
function endGame() {
    gameRunning = false;
    if (timer) { clearInterval(timer); timer = null; }

    // Re-enable button after timed run ends
    if (mode === 'timed') {
        btnStartStop.disabled = false;
        btnStartStop.textContent = "Старт";
        resultEl.textContent = `Время вышло! Правильно: ${correctCount}, Неправильно: ${wrongCount}. Точность: ${accuracyEl.textContent}`;
    } else {
        // free mode uses stopFree(), but keep fallback
        btnStartStop.textContent = "Старт";
        resultEl.textContent = `Остановлено. Правильно: ${correctCount}, Неправильно: ${wrongCount}. Точность: ${accuracyEl.textContent}`;
    }
}

// ===== Wire answer buttons =====
btnWhite.addEventListener('click', () => handleAnswer('white'));
btnBlack.addEventListener('click', () => handleAnswer('black'));

// Default mode on load
setMode('timed');