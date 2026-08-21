// ---- Data setup ----
const DICT_SETS = {};
for (const len of Object.keys(DICTIONARY)) {
  DICT_SETS[len] = new Set(DICTIONARY[len]);
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

function neighbors(word) {
  const set = DICT_SETS[String(word.length)];
  const out = [];
  for (let i = 0; i < word.length; i++) {
    for (const c of ALPHABET) {
      if (c === word[i]) continue;
      const cand = word.slice(0, i) + c + word.slice(i + 1);
      if (set.has(cand)) out.push(cand);
    }
  }
  return out;
}

function bfsPath(start, target) {
  if (start === target) return [start];
  const visited = new Map([[start, null]]);
  const queue = [start];
  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    for (const nb of neighbors(cur)) {
      if (!visited.has(nb)) {
        visited.set(nb, cur);
        if (nb === target) {
          const path = [nb];
          let p = cur;
          while (p !== null) {
            path.push(p);
            p = visited.get(p);
          }
          return path.reverse();
        }
        queue.push(nb);
      }
    }
  }
  return null;
}

function diffByOne(a, b) {
  if (a.length !== b.length) return false;
  let diffs = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diffs++;
    if (diffs > 1) return false;
  }
  return diffs === 1;
}

// ---- State ----
let state = {
  length: 4,
  puzzle: null,
  chain: [],
  revealed: false,
};

let lastPuzzleIndex = {};

function pickPuzzle(len) {
  const pool = PUZZLES[String(len)];
  let idx;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (pool.length > 1 && idx === lastPuzzleIndex[len]);
  lastPuzzleIndex[len] = idx;
  return pool[idx];
}

function bestKey(puzzle) {
  return `wl_best_${puzzle.start}_${puzzle.target}`;
}

function getBest(puzzle) {
  const v = localStorage.getItem(bestKey(puzzle));
  return v ? parseInt(v, 10) : null;
}

function setBest(puzzle, moves) {
  const cur = getBest(puzzle);
  if (cur === null || moves < cur) {
    localStorage.setItem(bestKey(puzzle), String(moves));
  }
}

// ---- DOM ----
const startWordEl = document.getElementById("start-word");
const targetWordEl = document.getElementById("target-word");
const ladderEl = document.getElementById("ladder");
const guessForm = document.getElementById("guess-form");
const guessInput = document.getElementById("guess-input");
const messageEl = document.getElementById("message");
const moveCountEl = document.getElementById("move-count");
const parCountEl = document.getElementById("par-count");
const bestCountEl = document.getElementById("best-count");
const newGameBtn = document.getElementById("new-game");
const hintBtn = document.getElementById("hint-btn");
const revealBtn = document.getElementById("reveal-btn");
const winOverlay = document.getElementById("win-overlay");
const winDetail = document.getElementById("win-detail");
const playAgainBtn = document.getElementById("play-again");
const lenButtons = document.querySelectorAll(".len-btn");

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message" + (type ? " " + type : "");
}

function renderLadder() {
  ladderEl.innerHTML = "";
  state.chain.forEach((word, i) => {
    const rung = document.createElement("div");
    rung.className = "rung";
    if (i === 0) rung.classList.add("origin");
    if (word === state.puzzle.target) rung.classList.add("solved");
    rung.innerHTML = `<span class="step-num">${i}</span><span class="step-word">${word}</span>`;
    ladderEl.appendChild(rung);
  });
  ladderEl.scrollTop = ladderEl.scrollHeight;
}

function renderStats() {
  moveCountEl.textContent = Math.max(0, state.chain.length - 1);
  parCountEl.textContent = state.puzzle.par;
  const best = getBest(state.puzzle);
  bestCountEl.textContent = best === null ? "-" : best;
}

function startPuzzle(puzzle) {
  state.puzzle = puzzle;
  state.chain = [puzzle.start];
  state.revealed = false;
  startWordEl.textContent = puzzle.start;
  targetWordEl.textContent = puzzle.target;
  guessInput.value = "";
  guessInput.disabled = false;
  guessInput.placeholder = "Type your next word...";
  setMessage("", "");
  renderLadder();
  renderStats();
  winOverlay.classList.add("hidden");
  guessInput.focus();
}

function newGame() {
  const puzzle = pickPuzzle(state.length);
  startPuzzle(puzzle);
}

function handleWin() {
  const moves = state.chain.length - 1;
  setBest(state.puzzle, moves);
  const best = getBest(state.puzzle);
  const par = state.puzzle.par;
  let verdict;
  if (moves <= par) verdict = "Par or better — nicely played!";
  else if (moves <= par + 2) verdict = "Solid climb!";
  else verdict = "You made it there in the end!";
  winDetail.textContent = `${moves} moves (par ${par}, best ${best}). ${verdict}`;
  winOverlay.classList.remove("hidden");
  guessInput.disabled = true;
}

guessForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (state.revealed) return;
  const raw = guessInput.value.trim().toLowerCase();
  const last = state.chain[state.chain.length - 1];
  const len = state.puzzle.start.length;

  if (!raw) return;
  if (raw.length !== len) {
    setMessage(`Word must be ${len} letters.`, "error");
    return;
  }
  if (!diffByOne(last, raw)) {
    setMessage(`Change exactly one letter from "${last}".`, "error");
    return;
  }
  if (state.chain.includes(raw)) {
    setMessage("You already used that word.", "error");
    return;
  }
  if (!DICT_SETS[String(len)].has(raw)) {
    setMessage(`"${raw}" isn't in the dictionary.`, "error");
    return;
  }

  state.chain.push(raw);
  guessInput.value = "";
  setMessage("Nice, valid word!", "ok");
  renderLadder();
  renderStats();

  if (raw === state.puzzle.target) {
    handleWin();
  }
});

hintBtn.addEventListener("click", () => {
  if (state.revealed) return;
  const last = state.chain[state.chain.length - 1];
  const path = bfsPath(last, state.puzzle.target);
  if (path && path.length > 1) {
    guessInput.value = path[1];
    setMessage(`Hint: try "${path[1]}"`, "ok");
    guessInput.focus();
  } else {
    setMessage("No hint available from here.", "error");
  }
});

revealBtn.addEventListener("click", () => {
  const last = state.chain[state.chain.length - 1];
  const path = bfsPath(last, state.puzzle.target);
  if (path) {
    state.chain = state.chain.concat(path.slice(1));
    state.revealed = true;
    renderLadder();
    renderStats();
    setMessage("Solution revealed.", "error");
    guessInput.disabled = true;
  }
});

newGameBtn.addEventListener("click", newGame);
playAgainBtn.addEventListener("click", newGame);

lenButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    lenButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.length = parseInt(btn.dataset.len, 10);
    newGame();
  });
});

newGame();
