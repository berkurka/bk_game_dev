/* Keep Sharp game logic.
 *
 * questions.js must load first and define QUESTIONS. Answer checking is
 * separate from rendering so new questions only need data, not new code.
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
  session: { score: 0, streak: 0, answered: 0 },
  setCorrect: 0,
  setAnswered: 0
};

var lifetime = { bestStreak: 0, totalAnswered: 0 };

/* ------------------------------------------------------------------ */
/* Answer normalization                                                */
/* ------------------------------------------------------------------ */

var VULGAR_FRACTIONS = {
  "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4",
  "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5",
  "⅙": "1/6", "⅚": "5/6", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8"
};

function basicNormalize(raw) {
  if (raw == null) return "";
  var s = String(raw).trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, function (ch) {
    return VULGAR_FRACTIONS[ch] || ch;
  });
  s = s.replace(/[−–—]/g, "-");
  s = s.replace(/π/g, "pi");
  s = s.replace(/[×·]/g, "*");
  s = s.replace(/\s+/g, "");
  s = s.replace(/\*/g, "");
  s = s.replace(/²/g, "^2").replace(/³/g, "^3");
  s = s.replace(/\^\{(\d+)\}/g, "^$1");
  s = s.replace(/÷/g, "/");
  s = s.replace(/^answer[:=]/, "").replace(/^ans[:=]/, "");
  s = s.replace(/\.$/, "");
  return s;
}

function stripAssignment(token) {
  return token.replace(/^[a-z]=/, "");
}

function toNumber(token) {
  if (!token) return null;
  var mult = 1;
  var body = token;
  if (body.length >= 2 && body.slice(-2) === "pi") {
    mult = Math.PI;
    body = body.slice(0, -2);
    if (body === "" || body === "+") body = "1";
    else if (body === "-") body = "-1";
  }
  if (/^[+-]?\d+$/.test(body) || /^[+-]?\d*\.\d+$/.test(body)) {
    return Number(body) * mult;
  }
  var frac = body.match(/^([+-]?\d+)\/([+-]?\d+)$/);
  if (frac) {
    var den = Number(frac[2]);
    if (den === 0) return null;
    return (Number(frac[1]) / den) * mult;
  }
  return null;
}

function nearlyEqual(a, b) {
  if (!isFinite(a) || !isFinite(b)) return false;
  var diff = Math.abs(a - b);
  var scale = Math.max(Math.abs(a), Math.abs(b), 1);
  if (diff <= 1e-9 * scale) return true;
  var aInt = Math.abs(a - Math.round(a)) <= 1e-9;
  var bInt = Math.abs(b - Math.round(b)) <= 1e-9;
  if (aInt || bInt) return false;
  return diff <= 0.0055;
}

function splitTerms(expr) {
  var terms = [];
  var current = "";
  var depth = 0;
  for (var i = 0; i < expr.length; i++) {
    var c = expr.charAt(i);
    if (c === "(") depth += 1;
    else if (c === ")") depth = Math.max(0, depth - 1);
    var boundary = (c === "+" || c === "-") && i > 0 && depth === 0 && expr.charAt(i - 1) !== "^";
    if (boundary) {
      terms.push(current);
      current = c;
    } else {
      current += c;
    }
  }
  if (current) terms.push(current);
  return terms;
}

function canonicalTerms(expr) {
  var parts = splitTerms(expr).filter(Boolean);
  if (!parts.length) return "";
  var signed = parts.map(function (term) {
    if (term.charAt(0) === "+" || term.charAt(0) === "-") return term;
    return "+" + term;
  });
  signed.sort();
  return signed.join("");
}

function stripOuterParens(expr) {
  var s = expr;
  var changed = true;
  while (changed && s.charAt(0) === "(" && s.charAt(s.length - 1) === ")") {
    changed = false;
    var depth = 0;
    var wrapsAll = true;
    for (var i = 0; i < s.length; i++) {
      if (s.charAt(i) === "(") depth += 1;
      else if (s.charAt(i) === ")") depth -= 1;
      if (depth === 0 && i < s.length - 1) {
        wrapsAll = false;
        break;
      }
    }
    if (wrapsAll && depth === 0) {
      s = s.slice(1, -1);
      changed = true;
    }
  }
  return s;
}

function canonicalExpr(expr) {
  var s = stripOuterParens(expr);
  s = s.replace(/\(([^()]*)\)/g, function (_, inner) {
    return "(" + canonicalTerms(inner) + ")";
  });
  var factors = s.match(/\([^()]*\)/g);
  if (factors && factors.join("") === s && factors.length > 1) {
    return factors.slice().sort().join("");
  }
  return canonicalTerms(s);
}

function answerKey(raw) {
  var basic = basicNormalize(raw);
  if (!basic) return null;
  if (basic.indexOf(",") !== -1) {
    var parts = basic.split(",").map(stripAssignment).filter(Boolean);
    var nums = parts.map(toNumber);
    var allNumeric = nums.every(function (n) { return n !== null; });
    if (!allNumeric) return null;
    return { type: "list", value: nums };
  }
  var single = stripAssignment(basic);
  var num = toNumber(single);
  if (num !== null) return { type: "num", value: num };
  return { type: "expr", value: canonicalExpr(single) };
}

function keysEqual(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === "num") return nearlyEqual(a.value, b.value);
  if (a.type === "expr") return a.value === b.value;
  if (a.value.length !== b.value.length) return false;
  for (var i = 0; i < a.value.length; i++) {
    if (!nearlyEqual(a.value[i], b.value[i])) return false;
  }
  return true;
}

function answersMatch(userRaw, acceptedList) {
  var userKey = answerKey(userRaw);
  if (!userKey || !acceptedList || !acceptedList.length) return false;
  for (var i = 0; i < acceptedList.length; i++) {
    if (keysEqual(userKey, answerKey(acceptedList[i]))) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Storage and decks                                                   */
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
  lede.textContent = "Short questions to keep algebra, geometry, and calculus within reach. A few minutes is enough.";
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
      '<form id="answer-form">' +
        '<label for="answer-input">Your answer</label>' +
        '<div class="answer-row">' +
          '<input id="answer-input" name="answer" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go">' +
          '<button type="submit" class="primary" id="submit-btn">Check</button>' +
        "</div>" +
        '<p class="format-note">Enter checks your answer. Fractions like 1/2, powers like 2x^3, and pi are all fine.</p>' +
        '<p class="form-error" id="form-error" hidden></p>' +
      "</form>" +
      '<div id="result" class="result" hidden role="status">' +
        '<p class="result-title" id="result-title"></p>' +
        '<p class="result-line"><span>Your answer</span> <strong id="result-yours"></strong></p>' +
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
  document.getElementById("hint").textContent = q.hint;
  document.getElementById("learn-lesson").textContent = q.lesson;
  renderRich(document.getElementById("learn-formula"), q.formula);
  var link = document.getElementById("learn-link");
  link.href = q.learnUrl;
  link.textContent = q.learnLabel;

  var input = document.getElementById("answer-input");
  input.placeholder = "e.g. 1/2 or 2x^3";
  document.getElementById("answer-form").addEventListener("submit", onSubmit);
  document.getElementById("hint-btn").addEventListener("click", showHint);
  document.getElementById("learn-btn").addEventListener("click", toggleLearn);
  document.getElementById("next-btn").addEventListener("click", goNext);
  input.focus();
  updateStats();
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

function onSubmit(event) {
  if (event) event.preventDefault();
  if (state.screen !== "play") return;
  if (state.graded) {
    goNext();
    return;
  }
  var q = currentQuestion();
  var input = document.getElementById("answer-input");
  var error = document.getElementById("form-error");
  if (!q || !input) return;
  if (!input.value.trim()) {
    error.hidden = false;
    error.textContent = "Enter an answer first.";
    input.focus();
    return;
  }
  error.hidden = true;
  var correct = answersMatch(input.value, q.answers);
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

  input.disabled = true;
  document.getElementById("submit-btn").disabled = true;
  var result = document.getElementById("result");
  result.hidden = false;
  result.classList.toggle("correct", correct);
  result.classList.toggle("incorrect", !correct);
  document.getElementById("result-title").textContent = correct ? "Correct" : "Not quite";
  document.getElementById("result-yours").textContent = input.value.trim();
  renderRich(document.getElementById("result-answer"), q.displayAnswer);
  var next = document.getElementById("next-btn");
  next.textContent = state.index === state.deck.length - 1 ? "See results" : "Next question";
  next.focus();
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  result.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
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

function onKeyDown(event) {
  if (event.key !== "Enter" || state.screen !== "play") return;
  var active = document.activeElement;
  var tag = active && active.tagName;
  if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "TEXTAREA") return;
  if (active && active.closest && active.closest("form")) return;
  if (state.graded) goNext();
  else onSubmit();
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
