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
    blurb: "Equations, systems, factoring, exponents, inequalities, and word problems."
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
  },
  {
    id: "gmat",
    name: "GMAT Quant",
    blurb: "Original GMAT-style problem solving and data sufficiency. These are not official questions."
  }
];

var PRACTICE_TOPICS = ["algebra", "geometry", "calculus"];

var state = {
  screen: "home",
  mode: "topic",
  topicId: null,
  deck: [],
  index: 0,
  graded: false,
  round: [],
  selected: -1,
  session: { score: 0, streak: 0, answered: 0 },
  setCorrect: 0,
  setAnswered: 0,
  challengeStart: 0,
  challengeMs: null,
  challengeRecorded: false,
  challengeIsBest: false,
  timerId: null
};

var lifetime = { bestStreak: 0, totalAnswered: 0, bestChallengeMs: null };

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
  var empty = { bestStreak: 0, totalAnswered: 0, bestChallengeMs: null };
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    var data = JSON.parse(raw);
    var best = Number(data.bestStreak);
    var total = Number(data.totalAnswered);
    var challenge = Number(data.bestChallengeMs);
    return {
      bestStreak: isFinite(best) && best > 0 ? Math.floor(best) : 0,
      totalAnswered: isFinite(total) && total > 0 ? Math.floor(total) : 0,
      bestChallengeMs: isFinite(challenge) && challenge >= 0 ? Math.round(challenge) : null
    };
  } catch (err) {
    return empty;
  }
}

function saveLifetime(data) {
  try {
    var payload = {
      bestStreak: data.bestStreak,
      totalAnswered: data.totalAnswered
    };
    if (data.bestChallengeMs != null && isFinite(data.bestChallengeMs) && data.bestChallengeMs >= 0) {
      payload.bestChallengeMs = Math.round(data.bestChallengeMs);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    /* Private mode can block storage. The session still runs. */
  }
}

function isPracticeTopic(topic) {
  return PRACTICE_TOPICS.indexOf(topic) !== -1;
}

function questionsForTopic(topicId) {
  if (typeof QUESTIONS === "undefined") return [];
  if (topicId === "mixed") {
    return QUESTIONS.filter(function (q) { return isPracticeTopic(q.topic); });
  }
  return QUESTIONS.filter(function (q) { return q.topic === topicId; });
}

/* Two easy and two medium questions from algebra, geometry, and calculus.
 * Hard items and the GMAT set stay out of the timed challenge. */
function sampleChallengeDeck(list) {
  var pool = (list || []).filter(function (q) { return isPracticeTopic(q.topic); });
  var easy = shuffle(pool.filter(function (q) { return q.difficulty === "easy"; }));
  var medium = shuffle(pool.filter(function (q) { return q.difficulty === "medium"; }));
  if (easy.length < 2 || medium.length < 2) return [];
  return shuffle(easy.slice(0, 2).concat(medium.slice(0, 2)));
}

function formatDuration(ms) {
  var safe = Math.round(Number(ms));
  if (!isFinite(safe) || safe < 0) safe = 0;
  var tenthsTotal = Math.round(safe / 100);
  var tenths = tenthsTotal % 10;
  var totalSeconds = Math.floor(tenthsTotal / 10);
  var seconds = totalSeconds % 60;
  var minutes = Math.floor(totalSeconds / 60);
  var secText = (seconds < 10 ? "0" : "") + seconds;
  return minutes + ":" + secText + "." + tenths;
}

function challengeElapsedMs() {
  if (state.challengeMs != null) return state.challengeMs;
  if (!state.challengeStart) return 0;
  return Date.now() - state.challengeStart;
}

function paintChallengeTimer() {
  var el = document.getElementById("challenge-timer");
  if (!el) return;
  var text = formatDuration(challengeElapsedMs());
  el.textContent = text;
  el.setAttribute("aria-label", "Elapsed time " + text);
}

function stopChallengeClock(freeze) {
  if (freeze && state.mode === "challenge" && state.challengeStart && state.challengeMs == null) {
    state.challengeMs = Date.now() - state.challengeStart;
  }
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  if (freeze) paintChallengeTimer();
}

function startChallengeClock() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  state.challengeStart = Date.now();
  state.challengeMs = null;
  state.challengeRecorded = false;
  state.challengeIsBest = false;
  state.timerId = setInterval(paintChallengeTimer, 100);
}

function recordChallengeResult() {
  if (state.mode !== "challenge" || state.challengeRecorded) return;
  if (state.challengeMs == null) return;
  state.challengeRecorded = true;
  var elapsed = Math.round(state.challengeMs);
  state.challengeMs = elapsed;
  var previous = lifetime.bestChallengeMs;
  if (previous == null || elapsed < previous) {
    lifetime.bestChallengeMs = elapsed;
    state.challengeIsBest = true;
    saveLifetime(lifetime);
  } else {
    state.challengeIsBest = false;
  }
}

function choiceHelpText() {
  if (state.round.length > 4) {
    return "Press A–E or 1–5 to pick a choice, then Enter to check.";
  }
  return "Press 1–4 to pick a choice, then Enter to check.";
}

function choiceKeyLabel(index) {
  if (state.round.length > 4) return "ABCDE".charAt(index);
  return String(index + 1);
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
  state.round = q.shuffle === false ? items : shuffle(items);
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
      '<span class="stat"><span class="stat-value" id="stat-challenge"></span><span class="stat-label">best time</span></span>' +
    "</div>";
  document.getElementById("stat-score").textContent = String(state.session.score);
  var streakEl = document.getElementById("stat-streak");
  streakEl.textContent = String(state.session.streak);
  if (state.session.streak >= 3) streakEl.classList.add("hot");
  document.getElementById("stat-answered").textContent = String(state.session.answered);
  document.getElementById("stat-best").textContent = String(lifetime.bestStreak);
  document.getElementById("stat-total").textContent = String(lifetime.totalAnswered);
  document.getElementById("stat-challenge").textContent = lifetime.bestChallengeMs == null
    ? "–"
    : formatDuration(lifetime.bestChallengeMs);
}

function renderChallengePanel() {
  var section = document.createElement("section");
  section.className = "challenge-card";
  section.id = "challenge-panel";
  var kicker = document.createElement("p");
  kicker.className = "eyebrow";
  kicker.textContent = "Timed mode";
  var heading = document.createElement("h2");
  heading.id = "challenge-heading";
  heading.textContent = "Challenge";
  var lede = document.createElement("p");
  lede.className = "lede";
  lede.textContent = "Two easy questions and two medium ones, drawn at random from algebra, geometry, and calculus. The clock starts right away and stops when you check the last answer.";
  var best = document.createElement("p");
  best.className = "challenge-best";
  best.textContent = lifetime.bestChallengeMs == null
    ? "No best time yet."
    : "Best time: " + formatDuration(lifetime.bestChallengeMs);
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "primary";
  btn.id = "challenge-btn";
  btn.textContent = "Start challenge";
  btn.addEventListener("click", startChallenge);
  section.appendChild(kicker);
  section.appendChild(heading);
  section.appendChild(lede);
  section.appendChild(best);
  section.appendChild(btn);
  return section;
}

function renderHome() {
  stopChallengeClock(false);
  state.screen = "home";
  state.mode = "topic";
  var view = document.getElementById("view");
  view.innerHTML = "";

  var hero = document.createElement("section");
  hero.className = "hero";
  var heading = document.createElement("h2");
  heading.textContent = "Choose a topic";
  var lede = document.createElement("p");
  lede.className = "lede";
  lede.textContent = "Short multiple-choice questions for algebra, geometry, calculus, and GMAT-style quant. Keys 1–4 pick a choice (A–E or 1–5 when there are five), and Enter checks it.";
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
  view.appendChild(renderChallengePanel());
  updateStats();
}

function startTopic(topicId) {
  var deck = questionsForTopic(topicId);
  if (!deck.length) return;
  stopChallengeClock(false);
  state.mode = "topic";
  state.challengeMs = null;
  state.challengeStart = 0;
  state.challengeRecorded = false;
  state.screen = "play";
  state.topicId = topicId;
  state.deck = shuffle(deck);
  state.index = 0;
  state.setCorrect = 0;
  state.setAnswered = 0;
  renderPlay();
}

function startChallenge() {
  var deck = sampleChallengeDeck(typeof QUESTIONS === "undefined" ? [] : QUESTIONS);
  if (deck.length !== 4) return;
  state.mode = "challenge";
  state.topicId = "challenge";
  state.deck = deck;
  state.index = 0;
  state.setCorrect = 0;
  state.setAnswered = 0;
  state.screen = "play";
  startChallengeClock();
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
    '<article class="card' + (state.mode === "challenge" ? " is-challenge" : "") + '">' +
      '<div class="meta-row">' +
        '<h2 id="question-heading"></h2>' +
        '<div class="meta-side">' +
          (state.mode === "challenge" ? '<span class="timer" id="challenge-timer">0:00.0</span>' : "") +
          '<span class="pill" id="difficulty-pill"></span>' +
        "</div>" +
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
        '<div class="explanation" id="result-explanation" hidden>' +
          '<p class="explanation-label">Why this is right</p>' +
          '<div class="explanation-body" id="result-explanation-body"></div>' +
        "</div>" +
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

  var card = view.querySelector(".card");
  if (card) card.setAttribute("data-question-id", q.id);
  document.getElementById("question-heading").textContent = topicLabel;
  var pill = document.getElementById("difficulty-pill");
  pill.textContent = q.difficulty;
  pill.setAttribute("data-level", q.difficulty);
  document.getElementById("progress").textContent = state.mode === "challenge"
    ? "Challenge, question " + (state.index + 1) + " of " + state.deck.length
    : "Question " + (state.index + 1) + " of " + state.deck.length;
  var choiceNote = document.getElementById("choice-note");
  if (choiceNote) choiceNote.textContent = choiceHelpText();
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
  if (state.mode === "challenge") paintChallengeTimer();
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
    key.textContent = choiceKeyLabel(index);
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
    note.textContent = choiceHelpText();
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
  if (state.mode === "challenge" && state.index === state.deck.length - 1) {
    stopChallengeClock(true);
    recordChallengeResult();
  }
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
  showExplanation(q, correct);
  var next = document.getElementById("next-btn");
  next.textContent = state.index === state.deck.length - 1 ? "See results" : "Next question";
  next.focus();
}

function showExplanation(q, correct) {
  var box = document.getElementById("result-explanation");
  var body = document.getElementById("result-explanation-body");
  if (!box || !body) return;
  var text = q && typeof q.explanation === "string" ? q.explanation.trim() : "";
  box.classList.toggle("is-light", !!correct);
  if (!text) {
    box.hidden = true;
    body.replaceChildren();
    return;
  }
  box.hidden = false;
  renderRich(body, text);
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
  stopChallengeClock(false);
  state.screen = "done";
  var challenge = state.mode === "challenge";
  var topic = topicById(state.topicId);
  var name = challenge ? "Challenge" : (topic ? topic.name : "This");
  var view = document.getElementById("view");
  view.innerHTML =
    '<section class="card done">' +
      '<p class="eyebrow" id="done-kicker"></p>' +
      '<h2 id="done-heading">Set complete</h2>' +
      '<p class="lede" id="done-copy"></p>' +
      '<p class="time-result" id="done-time" hidden></p>' +
      '<div class="tool-row">' +
        '<button type="button" class="primary" id="again-btn">Practice again</button>' +
        '<button type="button" class="ghost" id="done-home">All topics</button>' +
      "</div>" +
    "</section>";
  document.getElementById("done-kicker").textContent = name;
  var setLabel = name.toLowerCase();
  if (state.topicId === "gmat") setLabel = "GMAT quant";
  if (challenge) {
    document.getElementById("done-heading").textContent = "Challenge complete";
    document.getElementById("done-copy").textContent =
      "You got " + state.setCorrect + " of " + state.setAnswered + " correct.";
    var timeEl = document.getElementById("done-time");
    timeEl.hidden = false;
    var timeText = "Total time " + formatDuration(state.challengeMs) + ".";
    if (state.challengeIsBest) timeText += " New best time.";
    else if (lifetime.bestChallengeMs != null) {
      timeText += " Best time " + formatDuration(lifetime.bestChallengeMs) + ".";
    }
    timeEl.textContent = timeText;
    document.getElementById("again-btn").textContent = "New challenge";
  } else {
    document.getElementById("done-copy").textContent =
      "You got " + state.setCorrect + " of " + state.setAnswered + " correct in this " + setLabel + " set.";
  }
  document.getElementById("again-btn").addEventListener("click", function () {
    if (state.mode === "challenge") startChallenge();
    else startTopic(state.topicId);
  });
  document.getElementById("done-home").addEventListener("click", renderHome);
  updateStats();
}

function choiceIndexFromKey(key) {
  var index = -1;
  if (key === "1" || key === "2" || key === "3" || key === "4" || key === "5") {
    index = Number(key) - 1;
  } else if (state.round.length > 4 && key.length === 1) {
    index = "abcde".indexOf(key.toLowerCase());
  }
  if (index < 0 || index >= state.round.length) return -1;
  return index;
}

function onKeyDown(event) {
  if (state.screen !== "play") return;
  var active = document.activeElement;
  var tag = active && active.tagName;
  var choiceIndex = choiceIndexFromKey(event.key);

  if (choiceIndex !== -1) {
    if (state.graded) return;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (/^[a-e]$/i.test(event.key) && (event.metaKey || event.ctrlKey || event.altKey)) return;
    event.preventDefault();
    selectChoice(choiceIndex);
    return;
  }

  if (event.key !== "Enter") return;

  if (state.graded) {
    if (tag === "A") return;
    if (tag === "BUTTON" && (active.id === "hint-btn" || active.id === "learn-btn")) return;
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
