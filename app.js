/* Keep Sharp game logic.
 *
 * questions.js must load first and define QUESTIONS. Each question carries
 * its own choices. This file shuffles them, records the pick, and keeps score.
 */
"use strict";

var STORAGE_KEY = "keepsharp.v1";

var TOPICS = [
  {
    id: "algebra",
    name: "Algebra",
    blurb: "Linear equations, factoring, slope, exponents, and logs."
  },
  {
    id: "geometry",
    name: "Geometry",
    blurb: "Pythagoras, area and volume, similarity, circles, and trig."
  },
  {
    id: "calculus",
    name: "Calculus",
    blurb: "Power, product, and chain rules, integrals, and limits."
  },
  {
    id: "mixed",
    name: "Mixed",
    blurb: "A shuffle of all three, for a short mixed review."
  }
];

var state = {
  screen: "home",
  topicId: null,
  deck: [],
  index: 0,
  graded: false,
  round: [],
  selected: -1,
  session: { score: 0, streak: 0, answered: 0 },
  setCorrect: 0,
  setAnswered: 0
};

var lifetime = { bestStreak: 0, totalAnswered: 0 };

/* ------------------------------------------------------------------ */
/* Decks, choices, and storage                                         */
/* ------------------------------------------------------------------ */

function shuffle(list) {
  var copy = list.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function loadLifetime() {
  var empty = { bestStreak: 0, totalAnswered: 0 };
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    var data = JSON.parse(raw);
    var best = Number(data.bestStreak);
    var total = Number(data.totalAnswered);
    return {
      bestStreak: isFinite(best) && best > 0 ? Math.floor(best) : 0,
      totalAnswered: isFinite(total) && total > 0 ? Math.floor(total) : 0
    };
  } catch (err) {
    return empty;
  }
}

function saveLifetime(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bestStreak: data.bestStreak,
      totalAnswered: data.totalAnswered
    }));
  } catch (err) {
    /* Private mode can block storage. The session still runs. */
  }
}

function questionsForTopic(topicId) {
  if (typeof QUESTIONS === "undefined") return [];
  if (topicId === "mixed") return QUESTIONS.slice();
  return QUESTIONS.filter(function (q) { return q.topic === topicId; });
}

function topicById(topicId) {
  for (var i = 0; i < TOPICS.length; i++) {
    if (TOPICS[i].id === topicId) return TOPICS[i];
  }
  return null;
}

function currentQuestion() {
  return state.deck[state.index] || null;
}

/* Build the four buttons for this viewing. correct is an index into the
 * unshuffled choices array, so the flag has to travel with the text. */
function prepareRound(q) {
  var items = (q.choices || []).map(function (text, index) {
    return { text: text, correct: index === q.correct };
  });
  state.round = shuffle(items);
  state.selected = -1;
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

function appendText(el, text) {
  var lines = text.split("\n");
  for (var i = 0; i < lines.length; i++) {
    if (i > 0) el.appendChild(document.createElement("br"));
    if (lines[i]) el.appendChild(document.createTextNode(lines[i]));
  }
}

function appendMath(parent, latex, displayMode) {
  var node = document.createElement(displayMode ? "div" : "span");
  node.className = displayMode ? "math-display" : "math-inline";
  if (typeof katex !== "undefined") {
    try {
      katex.render(latex, node, { throwOnError: false, displayMode: displayMode });
    } catch (err) {
      node.textContent = latex;
    }
  } else {
    node.textContent = latex;
  }
  parent.appendChild(node);
}

function renderRich(el, text) {
  el.replaceChildren();
  if (!text) return;
  if (typeof katex === "undefined") {
    appendText(el, text.replace(/\\\(|\\\)|\\\[|\\\]/g, ""));
    return;
  }
  var pattern = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
  var last = 0;
  var match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) appendText(el, text.slice(last, match.index));
    var display = match[1] != null;
    appendMath(el, display ? match[1] : match[2], display);
    last = match.index + match[0].length;
  }
  if (last < text.length) appendText(el, text.slice(last));
}

function updateStats() {
  var root = document.getElementById("stats");
  if (!root) return;
  root.innerHTML =
    '<div class="stat-group">' +
      '<span class="group-label">Session</span>' +
      '<span class="stat"><span class="stat-value" id="stat-score"></span><span class="stat-label">score</span></span>' +
      '<span class="stat"><span class="stat-value" id="stat-streak"></span><span class="stat-label">streak</span></span>' +
      '<span class="stat"><span class="stat-value" id="stat-answered"></span><span class="stat-label">answered</span></span>' +
    "</div>" +
    '<div class="stat-group">' +
      '<span class="group-label">Saved</span>' +
      '<span class="stat"><span class="stat-value" id="stat-best"></span><span class="stat-label">best streak</span></span>' +
      '<span class="stat"><span class="stat-value" id="stat-total"></span><span class="stat-label">total</span></span>' +
    "</div>";
  document.getElementById("stat-score").textContent = String(state.session.score);
  var streakEl = document.getElementById("stat-streak");
  streakEl.textContent = String(state.session.streak);
  if (state.session.streak >= 3) streakEl.classList.add("hot");
  document.getElementById("stat-answered").textContent = String(state.session.answered);
  document.getElementById("stat-best").textContent = String(lifetime.bestStreak);
  document.getElementById("stat-total").textContent = String(lifetime.totalAnswered);
}

function renderHome() {
  state.screen = "home";
  var view = document.getElementById("view");
  view.innerHTML = "";

  var hero = document.createElement("section");
  hero.className = "hero";
  var heading = document.createElement("h2");
  heading.textContent = "Choose a topic";
  var lede = document.createElement("p");
  lede.className = "lede";
  lede.textContent = "Short multiple-choice questions to keep algebra, geometry, and calculus within reach. Keys 1–4 pick a choice, and Enter checks it.";
  hero.appendChild(heading);
  hero.appendChild(lede);

  var grid = document.createElement("div");
  grid.className = "topic-grid";
  TOPICS.forEach(function (topic) {
    var count = questionsForTopic(topic.id).length;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "topic";
    var name = document.createElement("span");
    name.className = "topic-name";
    name.textContent = topic.name;
    var meta = document.createElement("span");
    meta.className = "topic-count";
    meta.textContent = count + (count === 1 ? " question" : " questions");
    var blurb = document.createElement("span");
    blurb.className = "topic-blurb";
    blurb.textContent = topic.blurb;
    btn.appendChild(name);
    btn.appendChild(meta);
    btn.appendChild(blurb);
    btn.addEventListener("click", function () { startTopic(topic.id); });
    grid.appendChild(btn);
  });

  view.appendChild(hero);
  view.appendChild(grid);
  updateStats();
}

function startTopic(topicId) {
  var deck = questionsForTopic(topicId);
  if (!deck.length) return;
  state.screen = "play";
  state.topicId = topicId;
  state.deck = shuffle(deck);
  state.index = 0;
  state.setCorrect = 0;
  state.setAnswered = 0;
  renderPlay();
}

function renderPlay() {
  var q = currentQuestion();
  var view = document.getElementById("view");
  if (!q) {
    renderDone();
    return;
  }
  state.graded = false;
  state.screen = "play";
  prepareRound(q);
  var topic = topicById(q.topic);
  var topicLabel = topic ? topic.name : q.topic;

  view.innerHTML =
    '<article class="card">' +
      '<div class="meta-row">' +
        '<h2 id="question-heading"></h2>' +
        '<span class="pill" id="difficulty-pill"></span>' +
      "</div>" +
      '<p class="progress" id="progress"></p>' +
      '<div class="prompt" id="prompt"></div>' +
      '<div class="choices" id="choices" role="group" aria-label="Answer choices"></div>' +
      '<p class="format-note" id="choice-note">Press 1–4 to pick a choice, then Enter to check.</p>' +
      '<button type="button" class="primary" id="check-btn" disabled>Check</button>' +
      '<div id="result" class="result" hidden role="status">' +
        '<p class="result-title" id="result-title"></p>' +
        '<p class="result-line">Your answer</p>' +
        '<div class="official" id="result-yours"></div>' +
        '<p class="result-line">Official answer</p>' +
        '<div class="official" id="result-answer"></div>' +
        '<button type="button" class="primary" id="next-btn"></button>' +
      "</div>" +
      '<div class="tool-row">' +
        '<button type="button" class="ghost" id="hint-btn">Tip</button>' +
        '<button type="button" class="ghost" id="learn-btn" aria-expanded="false" aria-controls="learn-panel">Learn</button>' +
      "</div>" +
      '<p class="hint" id="hint" hidden></p>' +
      '<section class="learn" id="learn-panel" hidden>' +
        '<h3>Key formula</h3>' +
        '<div class="formula" id="learn-formula"></div>' +
        '<h3>What you need to know</h3>' +
        '<p id="learn-lesson"></p>' +
        '<p class="learn-link-row"><a id="learn-link" target="_blank" rel="noopener noreferrer"></a></p>' +
      "</section>" +
    "</article>";

  document.getElementById("question-heading").textContent = topicLabel;
  document.getElementById("difficulty-pill").textContent = q.difficulty;
  document.getElementById("progress").textContent = "Question " + (state.index + 1) + " of " + state.deck.length;
  renderRich(document.getElementById("prompt"), q.prompt);
  renderChoices();
  document.getElementById("hint").textContent = q.hint;
  document.getElementById("learn-lesson").textContent = q.lesson;
  renderRich(document.getElementById("learn-formula"), q.formula);
  var link = document.getElementById("learn-link");
  link.href = q.learnUrl;
  link.textContent = q.learnLabel;

  document.getElementById("check-btn").addEventListener("click", confirmChoice);
  document.getElementById("hint-btn").addEventListener("click", showHint);
  document.getElementById("learn-btn").addEventListener("click", toggleLearn);
  document.getElementById("next-btn").addEventListener("click", goNext);
  updateStats();
}

function renderChoices() {
  var group = document.getElementById("choices");
  group.replaceChildren();
  state.round.forEach(function (item, index) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice";
    btn.setAttribute("data-index", String(index));
    btn.setAttribute("aria-pressed", "false");
    var key = document.createElement("span");
    key.className = "choice-key";
    key.textContent = String(index + 1);
    var body = document.createElement("span");
    body.className = "choice-body";
    renderRich(body, item.text);
    var tag = document.createElement("span");
    tag.className = "choice-tag";
    btn.appendChild(key);
    btn.appendChild(body);
    btn.appendChild(tag);
    btn.addEventListener("click", function () { selectChoice(index); });
    group.appendChild(btn);
  });
}

function selectChoice(index) {
  if (state.screen !== "play" || state.graded) return;
  if (index < 0 || index >= state.round.length) return;
  state.selected = index;
  var buttons = document.querySelectorAll(".choice");
  for (var i = 0; i < buttons.length; i++) {
    var on = i === index;
    buttons[i].classList.toggle("is-selected", on);
    buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
  }
  var check = document.getElementById("check-btn");
  if (check) check.disabled = false;
  var note = document.getElementById("choice-note");
  if (note && note.classList.contains("form-error")) {
    note.classList.remove("form-error");
    note.textContent = "Press 1–4 to pick a choice, then Enter to check.";
  }
}

function showHint() {
  var hint = document.getElementById("hint");
  var btn = document.getElementById("hint-btn");
  if (!hint || !btn) return;
  hint.hidden = false;
  btn.disabled = true;
  btn.textContent = "Tip shown";
}

function toggleLearn() {
  var panel = document.getElementById("learn-panel");
  var btn = document.getElementById("learn-btn");
  if (!panel || !btn) return;
  var open = panel.hidden;
  panel.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.textContent = open ? "Hide learn" : "Learn";
}

function confirmChoice() {
  if (state.screen !== "play" || state.graded) return;
  var note = document.getElementById("choice-note");
  if (state.selected < 0) {
    if (note) {
      note.classList.add("form-error");
      note.textContent = "Pick a choice first.";
    }
    return;
  }
  var q = currentQuestion();
  var picked = state.round[state.selected];
  if (!q || !picked) return;
  var correct = !!picked.correct;
  state.graded = true;
  state.session.answered += 1;
  state.setAnswered += 1;
  lifetime.totalAnswered += 1;
  if (correct) {
    state.session.score += 1;
    state.session.streak += 1;
    state.setCorrect += 1;
    if (state.session.streak > lifetime.bestStreak) {
      lifetime.bestStreak = state.session.streak;
    }
  } else {
    state.session.streak = 0;
  }
  saveLifetime(lifetime);
  updateStats();
  lockChoices();

  var check = document.getElementById("check-btn");
  if (check) check.hidden = true;
  if (note) {
    note.classList.remove("form-error");
    note.textContent = "Press Enter for the next question.";
  }
  var result = document.getElementById("result");
  result.hidden = false;
  result.classList.toggle("correct", correct);
  result.classList.toggle("incorrect", !correct);
  document.getElementById("result-title").textContent = correct ? "Correct" : "Not quite";
  renderRich(document.getElementById("result-yours"), picked.text);
  renderRich(document.getElementById("result-answer"), q.displayAnswer);
  var next = document.getElementById("next-btn");
  next.textContent = state.index === state.deck.length - 1 ? "See results" : "Next question";
  next.focus();
}

function lockChoices() {
  var buttons = document.querySelectorAll(".choice");
  for (var i = 0; i < buttons.length; i++) {
    var item = state.round[i];
    var tag = buttons[i].querySelector(".choice-tag");
    buttons[i].disabled = true;
    buttons[i].classList.remove("is-selected");
    if (item && item.correct) {
      buttons[i].classList.add("is-correct");
      if (tag) tag.textContent = "Correct";
    } else if (i === state.selected) {
      buttons[i].classList.add("is-wrong");
      if (tag) tag.textContent = "Your pick";
    }
  }
}

function goNext() {
  if (state.screen !== "play" || !state.graded) return;
  state.graded = false;
  if (state.index + 1 >= state.deck.length) {
    renderDone();
    return;
  }
  state.index += 1;
  renderPlay();
}

function renderDone() {
  state.screen = "done";
  var topic = topicById(state.topicId);
  var name = topic ? topic.name : "This";
  var view = document.getElementById("view");
  view.innerHTML =
    '<section class="card done">' +
      '<p class="eyebrow" id="done-kicker"></p>' +
      '<h2>Set complete</h2>' +
      '<p class="lede" id="done-copy"></p>' +
      '<div class="tool-row">' +
        '<button type="button" class="primary" id="again-btn">Practice again</button>' +
        '<button type="button" class="ghost" id="done-home">All topics</button>' +
      "</div>" +
    "</section>";
  document.getElementById("done-kicker").textContent = name;
  document.getElementById("done-copy").textContent =
    "You got " + state.setCorrect + " of " + state.setAnswered + " correct in this " + name.toLowerCase() + " set.";
  document.getElementById("again-btn").addEventListener("click", function () {
    startTopic(state.topicId);
  });
  document.getElementById("done-home").addEventListener("click", renderHome);
  updateStats();
}

function choiceIndexFromKey(key) {
  if (key === "1" || key === "2" || key === "3" || key === "4") return Number(key) - 1;
  return -1;
}

function onKeyDown(event) {
  if (state.screen !== "play") return;
  var active = document.activeElement;
  var tag = active && active.tagName;
  var choiceIndex = choiceIndexFromKey(event.key);

  if (choiceIndex !== -1) {
    if (state.graded) return;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    event.preventDefault();
    selectChoice(choiceIndex);
    return;
  }

  if (event.key !== "Enter") return;

  if (state.graded) {
    if (tag === "A") return;
    if (tag === "BUTTON" && (active.id === "hint-btn" || active.id === "learn-btn" || active.id === "next-btn")) return;
    event.preventDefault();
    goNext();
    return;
  }

  if (tag === "BUTTON" && (active.id === "hint-btn" || active.id === "learn-btn")) return;
  if (active && active.id === "check-btn") return;

  if (active && active.classList && active.classList.contains("choice")) {
    var idx = Number(active.getAttribute("data-index"));
    event.preventDefault();
    if (state.selected !== idx) selectChoice(idx);
    else confirmChoice();
    return;
  }

  event.preventDefault();
  confirmChoice();
}

function init() {
  lifetime = loadLifetime();
  var brand = document.getElementById("brand");
  if (brand) brand.addEventListener("click", renderHome);
  document.addEventListener("keydown", onKeyDown);
  var view = document.getElementById("view");
  if (typeof QUESTIONS === "undefined" || !QUESTIONS.length) {
    view.textContent = "No questions found. Add some in questions.js.";
    return;
  }
  renderHome();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
}
