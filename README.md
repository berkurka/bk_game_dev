# Keep Sharp

Keep Sharp is a small static math practice game. It asks short algebra, geometry, and calculus questions in the browser so you can stay in practice without an account, a build step, or a server.

Pick Algebra, Geometry, Calculus, or Mixed. Every question has four answer choices, and exactly one is correct. The choices are shuffled each time the question appears. Press 1–4 to highlight a choice, then Enter to check it. After you answer, Enter moves to the next question. You can also tap a choice and then tap Check.

Each question has a tip, a short lesson with the key formula, and a link to a matching page on Paul's Online Math Notes or Math is Fun. After you answer, the correct choice is highlighted. A wrong pick stays marked, and the official answer is shown.

Score, streak, and questions answered reset when you reload. Best streak and total answered are saved in `localStorage` on this device.

## Run locally

From the project root, start any static file server. With Python:

```bash
python3 -m http.server 8080
```

Open [http://127.0.0.1:8080/](http://127.0.0.1:8080/). KaTeX loads from a CDN, so the page needs a network connection to typeset math. If the CDN is blocked, the questions still show as plain text.

## GitHub Pages

The site is meant to be hosted from the `main` branch at the repository root.

1. Push this project to the `main` branch.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Set **Branch** to `main` and the folder to **`/ (root)`**.
5. Save. After the deployment finishes, the game is at `https://<user>.github.io/<repo>/`.

No build command is required. `index.html` is the entry point.

## Add a question

Put a new object in the `QUESTIONS` array in `questions.js`. The fields are documented at the top of that file. Use an existing `topic` value, or add a topic id to `TOPICS` in `app.js` if you want a new button on the home screen.

Give every question exactly four `choices` and set `correct` to the index of the right one before shuffling. Wrong choices should be plausible mistakes. For example:

```js
choices: ["\\(x = 4\\)", "\\(x = 8\\)", "\\(x = 10\\)", "\\(x = 7\\)"],
correct: 0,
displayAnswer: "\\(x = 4\\)"
```
