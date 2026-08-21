# 🪜 Word Ladder

A browser-based word ladder puzzle game. Change one letter at a time to climb from a start word to a target word, with every step a valid dictionary word.

## Play

Open `index.html` in a browser — no build step or server required.

- Pick a word length (4 or 5 letters) using the toggle at the top.
- Type a word that differs from your current word by exactly one letter and submit it.
- Reach the target word to win. Your best (fewest moves) score per puzzle is saved locally.
- Use **Hint** to reveal the next step, or **Reveal Solution** to see the full path.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and layout |
| `style.css` | Styling |
| `script.js` | Game logic (state, validation, BFS-based hints/solutions) |
| `puzzles.js` | Curated start/target word pairs with par move counts |
| `dictionary.js` | Word lists used to validate guesses, keyed by word length |
