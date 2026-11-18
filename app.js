// Praymate website.
// Prayer times follow the app: adhan calculation, Muslim World League with
// Shafi Asr, artwork chosen from Fajr, sunrise, Asr and Isha, and a tabular
// Hijri date that moves forward at sunset.

// Set this to the Play Store or APK link when the app is released.
const DOWNLOAD_URL = "";

const MAKKAH = { lat: 21.4225, lng: 39.8262, tz: "Asia/Riyadh", label: "Today in Makkah" };
const STORE_KEY = "praymate-site-location";
const PRAYERS = [
  { key: "fajr", name: "Fajr", icon: "horizon" },
  { key: "dhuhr", name: "Dhuhr", icon: "sun" },
  { key: "asr", name: "Asr", icon: "sun" },
  { key: "maghrib", name: "Maghrib", icon: "horizon" },
  { key: "isha", name: "Isha", icon: "moon" },
];
// Example alarm settings for the alarms feature: minutes after the prayer
// time, and whether the alarm is on.
const ALARMS = { fajr: [10, true], dhuhr: [0, true], asr: [5, true], maghrib: [0, false], isha: [15, true] };
const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Awwal", "Jumada al-Thani",
  "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul Qadah", "Dhul Hijjah",
];
// History colors from the app's PrayerResponseColors.
const RESPONSES = {
  first: { c: "#A4D9BC", icon: "check", label: "first reminder" },
  second: { c: "#8BCF75", icon: "clock", label: "second reminder" },
  third: { c: "#BED064", icon: "clock", label: "third reminder" },
  more: { c: "#FBB45E", icon: "clock", label: "4 or more reminders" },
  missed: { c: "#D56B6B", icon: "cross", label: "missed" },
};
// An example week, newest last.
const WEEK = [
  ["first", "first", "second", "first", "third"],
  ["second", "first", "first", "more", "first"],
  ["first", "missed", "first", "first", "second"],
  ["third", "first", "second", "first", "first"],
  ["first", "first", "first", "second", "first"],
  ["more", "second", "first", "first", "missed"],
  ["first", "first", "first", "first", "first"],
];
const ICONS = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  horizon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 16a5 5 0 0 1 10 0M3 19.5h18M12 4.5v3M4.6 9.6l1.6 1.2M19.4 9.6l-1.6 1.2"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M15.5 3.5a8.5 8.5 0 1 0 5 14.6 7 7 0 0 1-5-14.6Z"/></svg>',
  check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-7"/></svg>',
  clock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="5.6"/><path d="M8 5v3.2l2 1.3"/></svg>',
  cross: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m4.5 4.5 7 7M11.5 4.5l-7 7"/></svg>',
};

const $ = (sel) => document.querySelector(sel);
const root = document.documentElement;

let place = loadPlace();
let preview = "dawn"; // the page opens at dawn; null follows the clock

function loadPlace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved && typeof saved.lat === "number" && typeof saved.lng === "number") return saved;
  } catch (_) { /* storage blocked */ }
  return MAKKAH;
}

function savePlace(p) {
  try {
    if (p === MAKKAH) localStorage.removeItem(STORE_KEY);
    else localStorage.setItem(STORE_KEY, JSON.stringify(p));
  } catch (_) { /* storage blocked */ }
}

// Calendar date of an instant in the location's timezone.
function wallDate(instant, tz) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" })
    .formatToParts(instant);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function shiftDate({ y, m, d }, days) {
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function timesFor(date) {
  const params = adhan.CalculationMethod.MuslimWorldLeague();
  params.madhab = adhan.Madhab.Shafi;
  return new adhan.PrayerTimes(new adhan.Coordinates(place.lat, place.lng), new Date(date.y, date.m - 1, date.d), params);
}

function hijri({ y, m, d }) {
  const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(622, 6, 19)) / 86400000);
  const year = Math.floor((30 * days + 10646) / 10631);
  let remaining = days - (354 * (year - 1) + Math.floor((3 + 11 * year) / 30));
  let month = 1;
  while (month < 12) {
    const length = month % 2 === 1 ? 30 : 29;
    if (remaining < length) break;
    remaining -= length;
    month++;
  }
  return `${remaining + 1} ${HIJRI_MONTHS[month - 1]} ${year}`;
}

function clock(instant) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: place.tz, hour: "numeric", minute: "2-digit" }).formatToParts(instant);
  const time = parts.filter((p) => ["hour", "literal", "minute"].includes(p.type)).map((p) => p.value).join("").trim();
  const ampm = (parts.find((p) => p.type === "dayPeriod") || {}).value || "";
  return { time, ampm };
}

function dateLabel(instant, opts) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: place.tz, ...opts }).format(instant);
}

function render() {
  if (!window.adhan) return;
  const now = new Date();
  const todayDate = wallDate(now, place.tz);
  const today = timesFor(todayDate);
  const tomorrow = timesFor(shiftDate(todayDate, 1));

  const list = PRAYERS.map((p) => ({ ...p, at: today[p.key] }));
  let next = list.find((p) => p.at > now);
  const isTomorrow = !next;
  if (!next) next = { ...PRAYERS[0], at: tomorrow.fajr };

  // Scene, as the app picks its artwork.
  let scene = "day";
  if (now < today.fajr || now >= today.isha) scene = "night";
  else if (now < today.sunrise) scene = "dawn";
  else if (now >= today.asr) scene = "evening";
  const shown = preview || scene;
  loadArt(shown);
  if (root.dataset.scene !== shown) root.dataset.scene = shown;
  document.querySelector('meta[name="theme-color"]')
    .setAttribute("content", getComputedStyle(root).getPropertyValue("--sky-top").trim());

  // Prayer times. The Hijri day starts at sunset.
  $("[data-date]").textContent = `${dateLabel(now, { weekday: "long" })}, ${dateLabel(now, { day: "numeric" })} ${dateLabel(now, { month: "long" })}`;
  $("[data-hijri]").textContent = hijri(now >= today.sunset ? shiftDate(todayDate, 1) : todayDate);
  $("[data-rows]").innerHTML = list.map((p) => {
    const c = clock(p.at);
    const isNext = !isTomorrow && p.key === next.key;
    const cls = isNext ? "row is-next" : p.at <= now ? "row is-past" : "row";
    return `<li class="${cls}">
      <span class="row-icon" aria-hidden="true">${ICONS[p.icon]}</span>
      <span class="row-name">${p.name}${isNext ? '<span class="pill">Next</span>' : ""}</span>
      <span class="row-time">${c.time}<small>${c.ampm}</small></span>
    </li>`;
  }).join("");
  $("[data-place-label]").textContent = place.label;
  $("[data-locate]").textContent = place === MAKKAH ? "Use my location" : "Show Makkah";

  // Alarms: the next one that is on, then every prayer's switch.
  alarmCtx = { list, tomorrowFajr: tomorrow.fajr, now };
  renderAlarms();

  // The ringing screen shows the next prayer, unless it is mid-answer.
  if (ring && ring.root.dataset.state === "ringing") {
    ringKey = next.key;
    $("[data-ringing-name]").textContent = next.name;
  }

  // History: an example week ending today.
  if (!$("[data-grid]").childElementCount) {
    $("[data-grid]").innerHTML = WEEK.map((day, i) => {
      const date = shiftDate(todayDate, i - WEEK.length + 1);
      const label = dateLabel(new Date(Date.UTC(date.y, date.m - 1, date.d, 12)), { day: "numeric", month: "short", timeZone: "UTC" });
      return `<tr><th scope="row">${label}</th>${day.map((r, j) => {
        const res = RESPONSES[r];
        return `<td><span class="cell" style="--c:${res.c}" role="img" aria-label="${PRAYERS[j].name}, ${res.label}">${ICONS[res.icon]}</span></td>`;
      }).join("")}</tr>`;
    }).join("");
  }
}

// The hero artwork is large, so each scene's picture loads only when it is
// first shown. The others load once the visitor reaches the sky feature.
function loadArt(scene) {
  const imgs = [...document.querySelectorAll(`.art[data-art="${scene}"]`)];
  imgs.forEach((img) => { if (!img.srcset) img.srcset = img.dataset.srcset; });
  return imgs;
}

// On first load the hero opens out of an arch (see .is-revealing in
// styles.css). Wait for the picture, but not for long.
function reveal(imgs) {
  if (!root.classList.contains("is-revealing")) return;
  clearTimeout(window.revealFallback);
  const ready = Promise.all(imgs.map((img) => (img.complete ? null : img.decode().catch(() => {}))));
  Promise.race([ready, new Promise((r) => setTimeout(r, 1500))]).then(() => {
    requestAnimationFrame(() => root.classList.add("is-open"));
    setTimeout(() => root.classList.remove("is-revealing", "is-open"), 2400);
  });
}

// Alarms you can change. Tap a prayer for the app's Change alarm time
// choices, or flip its switch. Changes last until the page reloads.
const PRESETS = [[-10, "10 min before"], [0, "At prayer time"], [10, "10 min after"]];
const CHEVRON = '<svg class="alarm-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
let alarmCtx = null;
let openAlarm = null;
let justOpened = null;
let alarmsHtml = "";

function offsetText(mins) {
  if (!mins) return "at prayer time";
  const a = Math.abs(mins);
  const h = Math.floor(a / 60);
  const m = a % 60;
  const length = h ? (m ? `${h} hr ${m} min` : `${h} hr`) : `${m} min`;
  return `${length} ${mins < 0 ? "before" : "after"}`;
}

function renderAlarms() {
  if (!alarmCtx) return;
  const { list, tomorrowFajr, now } = alarmCtx;
  const alarmAt = (p, at) => new Date(at.getTime() + ALARMS[p.key][0] * 60000);
  const upcoming = [...list, { ...PRAYERS[0], at: tomorrowFajr, tomorrow: true }]
    .filter((p) => ALARMS[p.key][1])
    .map((p) => ({ ...p, ring: alarmAt(p, p.at) }))
    .find((p) => p.ring > now);

  let head = '<div class="alarm-next"><p class="alarm-next-label">Next alarm</p><p class="alarm-next-none">Every alarm is off.</p></div>';
  if (upcoming) {
    const ring = clock(upcoming.ring);
    const prayerAt = clock(upcoming.at);
    head = `<div class="alarm-next">
      <p class="alarm-next-label">Next alarm</p>
      <p class="alarm-next-time">${ring.time}<small>${ring.ampm}</small></p>
      <p class="alarm-next-name">${upcoming.name}${upcoming.tomorrow ? " tomorrow" : ""}, prayer at ${prayerAt.time} ${prayerAt.ampm}</p>
    </div>`;
  }

  const rows = list.map((p) => {
    const [mins, on] = ALARMS[p.key];
    const r = clock(alarmAt(p, p.at));
    const open = openAlarm === p.key;
    const prayerAt = clock(p.at);
    const edit = !open ? "" : `<div class="alarm-edit${justOpened === p.key ? " is-opening" : ""}" id="edit-${p.key}">
        <p class="alarm-edit-note">Prayer at ${prayerAt.time} ${prayerAt.ampm}. Choose a time within 2 hours.</p>
        <div class="alarm-presets" role="group" aria-label="Quick times for ${p.name}">${PRESETS.map(([v, label]) =>
          `<button type="button" data-offset="${p.key}:${v}" aria-pressed="${on && mins === v}">${label}</button>`).join("")}</div>
        <div class="stepper">
          <button type="button" data-step="${p.key}:-5" aria-label="5 minutes earlier"${mins <= -120 ? " disabled" : ""}>&minus;</button>
          <p aria-live="polite"><strong>${r.time} ${r.ampm}</strong><span>${offsetText(mins)}</span></p>
          <button type="button" data-step="${p.key}:5" aria-label="5 minutes later"${mins >= 120 ? " disabled" : ""}>+</button>
        </div>
      </div>`;
    return `<div class="alarm-row${on ? "" : " is-off"}${open ? " is-open" : ""}">
      <button class="alarm-main" type="button" data-edit="${p.key}" aria-expanded="${open}"${open ? ` aria-controls="edit-${p.key}"` : ""}>
        <span class="row-icon" aria-hidden="true">${ICONS[p.icon]}</span>
        <span class="alarm-row-text"><strong>${p.name}</strong><span>${on ? `${r.time} ${r.ampm}, ${offsetText(mins)}` : "Off"}</span></span>
        ${CHEVRON}
      </button>
      <button class="switch${on ? " is-on" : ""}" type="button" role="switch" aria-checked="${on}" aria-label="${p.name} alarm" data-toggle="${p.key}"></button>
      ${edit}
    </div>`;
  }).join("");

  const html = head + rows;
  justOpened = null;
  if (html === alarmsHtml) return;
  alarmsHtml = html;

  // Rebuilding the list would drop keyboard focus, so put it back.
  const box = $("[data-alarms]");
  const active = document.activeElement;
  let refocus = null;
  if (active && box.contains(active)) {
    for (const k of ["edit", "toggle", "offset", "step"]) {
      if (active.dataset[k]) refocus = `[data-${k}="${active.dataset[k]}"]`;
    }
  }
  box.innerHTML = html;
  if (refocus) {
    let el = box.querySelector(refocus);
    if (!el || el.disabled) el = box.querySelector(`.alarm-row.is-open [data-step]:not(:disabled)`);
    if (el) el.focus();
  }
}

function setupAlarms() {
  $("[data-alarms]").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.toggle) {
      const on = !ALARMS[d.toggle][1];
      ALARMS[d.toggle][1] = on;
      // Let the switch slide before the list is rebuilt.
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-checked", String(on));
      setTimeout(renderAlarms, 300);
    } else if (d.edit) {
      openAlarm = openAlarm === d.edit ? null : d.edit;
      justOpened = openAlarm;
      renderAlarms();
    } else if (d.offset) {
      const [key, v] = d.offset.split(":");
      ALARMS[key] = [Number(v), true];
      renderAlarms();
    } else if (d.step) {
      const [key, v] = d.step.split(":");
      ALARMS[key] = [Math.min(120, Math.max(-120, ALARMS[key][0] + Number(v))), true];
      renderAlarms();
    }
  });
}

// The ringing alarm. I'm praying plays the logging animation; Delay opens
// the app's Delay alarm screen with a minutes wheel from 1 to 120.
const ITEM = 44; // height of one row of the minutes wheel, as in styles.css
let ring = null;
let ringKey = "asr";
let ringTimers = [];
let wheelValue = 0;

const later = (fn, ms) => ringTimers.push(setTimeout(fn, ms));
const ringName = () => PRAYERS.find((p) => p.key === ringKey).name;
const timeIn = (mins) => { const c = clock(new Date(Date.now() + mins * 60000)); return `${c.time} ${c.ampm}`; };

function setRing(state) {
  ring.root.dataset.state = state;
  const panel = state === "delay" || state === "delayed" ? state : "main";
  ring.root.querySelectorAll("[data-panel]").forEach((p) => p.toggleAttribute("inert", p.dataset.panel !== panel));
}

// Swap the button's words letter by letter. Letters the old and new words
// share at the start stay put; the rest blur out, then the new ones blur in.
function morph(text, from) {
  const el = ring.label;
  const old = el.dataset.text || el.textContent;
  let keep = 0;
  while (keep < old.length && keep < text.length && old[keep] === text[keep]) keep++;
  const leaving = [...el.children].slice(keep);
  const swap = () => {
    el.replaceChildren(...[...text].map((c, i) => {
      const span = document.createElement("span");
      span.className = i < keep ? "ch" : "ch in";
      span.style.setProperty("--i", i - keep);
      span.textContent = c === " " ? " " : c;
      return span;
    }));
    el.dataset.text = text;
    fitPray(from);
  };
  leaving.forEach((c) => c.classList.add("out"));
  if (leaving.length) later(swap, 180);
  else swap();
}

// Slide the button's width to fit its new words and icon.
function fitPray(from) {
  const btn = ring.pray;
  const start = from ?? btn.getBoundingClientRect().width;
  const icon = ring.root.dataset.state === "ringing" ? 0 : 32;
  const target = ring.label.getBoundingClientRect().width + icon + 52;
  btn.classList.remove("is-sizing");
  btn.style.width = `${start}px`;
  void btn.offsetWidth;
  btn.classList.add("is-sizing");
  btn.style.width = `${target}px`;
}

function pray() {
  if (ring.root.dataset.state !== "ringing") return;
  const from = ring.pray.getBoundingClientRect().width;
  ring.pray.setAttribute("aria-disabled", "true");
  setRing("logging");
  morph("Logging", from);
  later(() => {
    setRing("logged");
    morph("Logged");
    $("[data-logged-text]").textContent = `${ringName()} logged at ${timeIn(0)}.`;
    logToHistory();
  }, 1500);
}

// Today's square in the history grid turns green, as in the app.
function logToHistory() {
  const j = PRAYERS.findIndex((p) => p.key === ringKey);
  WEEK[WEEK.length - 1][j] = "first";
  const cell = $("[data-grid]").lastElementChild?.children[j + 1]?.querySelector(".cell");
  if (!cell) return;
  const res = RESPONSES.first;
  cell.style.setProperty("--c", res.c);
  cell.setAttribute("aria-label", `${PRAYERS[j].name}, ${res.label}`);
  cell.innerHTML = ICONS[res.icon];
  cell.classList.remove("is-new");
  void cell.offsetWidth;
  cell.classList.add("is-new");
}

function resetRing() {
  const hadFocus = ring.root.contains(document.activeElement);
  ringTimers.forEach(clearTimeout);
  ringTimers = [];
  setRing("ringing");
  ring.pray.classList.remove("is-sizing");
  ring.pray.style.width = "";
  ring.pray.removeAttribute("aria-disabled");
  ring.label.textContent = "I'm praying";
  delete ring.label.dataset.text;
  $("[data-ringing-name]").textContent = ringName();
  if (hadFocus) ring.pray.focus();
}

function showWheel(v) {
  if (v === wheelValue) return;
  wheelValue = v;
  ring.wheel.setAttribute("aria-valuenow", v);
  ring.wheel.setAttribute("aria-valuetext", `${v} minute${v === 1 ? "" : "s"}`);
  ring.wheel.querySelectorAll("li").forEach((li, i) => li.classList.toggle("is-picked", i + 1 === v));
  $("[data-wheel-hint]").textContent = `${ringName()} rings again at ${timeIn(v)}`;
}

function setWheel(v, smooth) {
  v = Math.min(120, Math.max(1, v));
  ring.wheel.scrollTo({ top: (v - 1) * ITEM, behavior: smooth ? "smooth" : "auto" });
  showWheel(v);
}

function setupRinging() {
  const root = $("[data-ringing]");
  ring = { root, pray: $("[data-pray]"), label: $("[data-pray-label]"), wheel: $("[data-wheel]") };

  $("[data-wheel-list]").innerHTML = Array.from({ length: 120 }, (_, i) =>
    `<li data-minutes="${i + 1}">${i + 1} min</li>`).join("");
  let queued = false;
  ring.wheel.addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      showWheel(Math.min(120, Math.max(1, Math.round(ring.wheel.scrollTop / ITEM) + 1)));
    });
  }, { passive: true });
  ring.wheel.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li) setWheel(Number(li.dataset.minutes), true);
  });
  ring.wheel.addEventListener("keydown", (e) => {
    const step = { ArrowUp: -1, ArrowDown: 1, PageUp: -10, PageDown: 10 }[e.key];
    if (step) setWheel(wheelValue + step, true);
    else if (e.key === "Home") setWheel(1, true);
    else if (e.key === "End") setWheel(120, true);
    else return;
    e.preventDefault();
  });

  ring.pray.addEventListener("click", pray);
  $("[data-delay-open]").addEventListener("click", () => {
    setRing("delay");
    wheelValue = 0;
    setWheel(10, false);
    ring.wheel.focus({ preventScroll: true });
  });
  $("[data-delay-cancel]").addEventListener("click", () => {
    setRing("ringing");
    $("[data-delay-open]").focus();
  });
  $("[data-delay-confirm]").addEventListener("click", () => {
    const v = wheelValue;
    $("[data-delayed-title]").textContent = `Delayed ${v} minute${v === 1 ? "" : "s"}`;
    $("[data-delayed-text]").textContent = `${ringName()} rings again at ${timeIn(v)}.`;
    setRing("delayed");
    root.querySelector('[data-panel="delayed"] [data-ring-reset]').focus({ preventScroll: true });
  });
  root.querySelectorAll("[data-ring-reset]").forEach((b) => b.addEventListener("click", resetRing));
}

function setPreview(scene) {
  preview = scene === "live" ? null : scene;
  document.querySelectorAll(".scenes [data-scene-pick]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.scenePick === scene));
  });
  $(".scenes-reset").hidden = !preview;
  render();
}

function locate() {
  const status = $("[data-place-status]");
  if (place !== MAKKAH) {
    place = MAKKAH;
    savePlace(place);
    status.textContent = "";
    render();
    return;
  }
  if (!("geolocation" in navigator)) {
    status.textContent = "This browser can't share a location. Times stay set to Makkah.";
    return;
  }
  status.textContent = "Finding your location…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      place = {
        lat: Math.round(pos.coords.latitude * 1000) / 1000,
        lng: Math.round(pos.coords.longitude * 1000) / 1000,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        label: "Today where you are",
      };
      savePlace(place);
      status.textContent = "";
      render();
    },
    () => {
      status.textContent = "Location access was turned down. Times stay set to Makkah. Allow location for this site in your browser to try again.";
    },
    { timeout: 15000, maximumAge: 3600000 },
  );
}

// Scrolling the hero away plays the app's switch from Home to a tab
// (lib/navigation/tab_motion.dart), with scroll distance in place of time.
// Of the 490 ms switch, Home's text fades and drops 10 px over the first
// 140 ms, and the arriving title fades in from 110 to 370 ms while rising
// 10 px until the end. The picture's box shrinks in step with the scroll, so
// the content below stays attached to it.
const easeIn = (t) => t * t * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const appCurve = (t) => { // Cubic(.2, .8, .2, 1)
  let lo = 0, hi = 1, x = t;
  for (let i = 0; i < 20; i++) {
    x = (lo + hi) / 2;
    const bx = 3 * (1 - x) * (1 - x) * x * .2 + 3 * (1 - x) * x * x * .2 + x * x * x;
    if (bx < t) lo = x; else hi = x;
  }
  return 3 * (1 - x) * (1 - x) * x * .8 + 3 * (1 - x) * x * x + x * x * x;
};
const span = (p, from, to) => Math.min(1, Math.max(0, (p - from) / (to - from)));

function setupCollapse() {
  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  const intro = $(".intro");
  const hero = $(".hero");
  const heroText = $(".hero-text");
  let queued = false;

  function apply() {
    queued = false;
    const travel = intro.offsetHeight - hero.offsetHeight;
    const p = motion.matches && travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0;
    const leave = easeIn(span(p, 0, 140 / 490));
    const enter = easeOut(span(p, 110 / 490, 370 / 490));
    const rise = appCurve(span(p, 110 / 490, 1));
    const style = root.style;
    style.setProperty("--p", p.toFixed(4));
    style.setProperty("--home-o", (1 - leave).toFixed(3));
    style.setProperty("--home-y", (10 * leave).toFixed(2));
    style.setProperty("--band-o", enter.toFixed(3));
    style.setProperty("--band-y", (10 * (1 - rise)).toFixed(2));
    // Hidden text should not take clicks or keyboard focus.
    heroText.toggleAttribute("data-gone", leave >= 1);
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(apply); } };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  motion.addEventListener("change", queue);
  apply();
}

// Stars for the dawn and night skies, the same pattern on every visit and
// bunched toward the top, each twinkling on its own timing.
function makeStars() {
  const box = $("[data-stars]");
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  box.innerHTML = Array.from({ length: 90 }, () => {
    const size = (0.8 + rnd() * 1.6).toFixed(1);
    return `<i style="left:${(rnd() * 100).toFixed(2)}%;top:${(rnd() * rnd() * 100).toFixed(2)}%;width:${size}px;height:${size}px;--t:${(2.5 + rnd() * 4).toFixed(2)}s;--d:${(-rnd() * 6).toFixed(2)}s"></i>`;
  }).join("");
}

function start() {
  makeStars();
  setupCollapse();
  setupAlarms();
  setupRinging();
  document.querySelectorAll("[data-scene-pick]").forEach((b) => {
    b.addEventListener("click", () => setPreview(b.dataset.scenePick));
  });
  $("[data-locate]").addEventListener("click", locate);

  if (DOWNLOAD_URL) {
    const link = $("[data-download]");
    link.href = DOWNLOAD_URL;
    link.hidden = false;
  }

  render();
  reveal(loadArt(root.dataset.scene));
  new IntersectionObserver((entries, observer) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    ["dawn", "day", "evening", "night"].forEach(loadArt);
    observer.disconnect();
  }, { rootMargin: "400px" }).observe($(".scenes"));
  setInterval(render, 20000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
}

if (window.adhan) start();
else window.addEventListener("load", start);
