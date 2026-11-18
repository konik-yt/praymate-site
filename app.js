// Live prayer times for the hero and the Today list.
// Mirrors the app: adhan calculation, Muslim World League with Shafi Asr,
// artwork chosen from Fajr, sunrise, Asr and Isha, and a tabular Hijri date
// that moves forward at sunset.

// Set this to the Play Store or APK link when the app is released.
const DOWNLOAD_URL = "";

const MAKKAH = { lat: 21.4225, lng: 39.8262, tz: "Asia/Riyadh", label: "Prayer times for Makkah" };
const STORE_KEY = "prayer-site-location";
const PRAYERS = [
  { key: "fajr", name: "Fajr", icon: "horizon" },
  { key: "dhuhr", name: "Dhuhr", icon: "sun" },
  { key: "asr", name: "Asr", icon: "sun" },
  { key: "maghrib", name: "Maghrib", icon: "horizon" },
  { key: "isha", name: "Isha", icon: "moon" },
];
const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Awwal", "Jumada al-Thani",
  "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul Qadah", "Dhul Hijjah",
];
const ICONS = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  horizon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 16a5 5 0 0 1 10 0M3 19.5h18M12 4.5v3M4.6 9.6l1.6 1.2M19.4 9.6l-1.6 1.2"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M15.5 3.5a8.5 8.5 0 1 0 5 14.6 7 7 0 0 1-5-14.6Z"/></svg>',
  up: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4"/></svg>',
  down: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v10M4 9l4 4 4-4"/></svg>',
};

// Arc geometry in the artwork's 1000 x 1000 square, matched to the app.
const ARC = { cx: 500, cy: 600, rx: 315, ry: 128 };

const $ = (sel) => document.querySelector(sel);
const root = document.documentElement;

let place = loadPlace();
let preview = null; // null follows the clock, otherwise a scene name

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

function shortClock(instant) {
  return clock(instant).time;
}

function duration(ms) {
  const mins = Math.max(0, Math.ceil(ms / 60000));
  if (mins < 1) return "less than a minute";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function arcPoint(t) {
  const a = Math.PI * (1 - Math.min(1, Math.max(0, t)));
  return { x: ARC.cx + ARC.rx * Math.cos(a), y: ARC.cy - ARC.ry * Math.sin(a) };
}

function drawArc(t, body, startLabel, endLabel) {
  const start = arcPoint(0);
  const end = arcPoint(1);
  const at = arcPoint(t);
  const r = `${ARC.rx} ${ARC.ry} 0 0 1`;
  $(".arc-done").setAttribute("d", t > 0.002 ? `M${start.x} ${start.y} A${r} ${at.x} ${at.y}` : "");
  $(".arc-left").setAttribute("d", t < 0.998 ? `M${at.x} ${at.y} A${r} ${end.x} ${end.y}` : "");
  const marker = $(".body-marker");
  marker.dataset.body = body;
  marker.style.left = `${at.x / 10}%`;
  marker.style.top = `${at.y / 10}%`;
  $(".arc-label-start").innerHTML = startLabel;
  $(".arc-label-end").innerHTML = endLabel;
}

function render() {
  if (!window.adhan) return;
  const now = new Date();
  const todayDate = wallDate(now, place.tz);
  const today = timesFor(todayDate);
  const tomorrow = timesFor(shiftDate(todayDate, 1));
  const yesterday = timesFor(shiftDate(todayDate, -1));

  // Next prayer, and the one before it for the progress bar.
  const list = PRAYERS.map((p) => ({ ...p, at: today[p.key] }));
  let nextIndex = list.findIndex((p) => p.at > now);
  let next;
  let prevAt;
  let isTomorrow = false;
  if (nextIndex === -1) {
    next = { ...PRAYERS[0], at: tomorrow.fajr };
    prevAt = today.isha;
    isTomorrow = true;
  } else {
    next = list[nextIndex];
    prevAt = nextIndex === 0 ? yesterday.isha : list[nextIndex - 1].at;
  }
  const progress = (now - prevAt) / (next.at - prevAt);

  // Scene, as the app picks its artwork.
  let scene = "day";
  if (now < today.fajr || now >= today.isha) scene = "night";
  else if (now < today.sunrise) scene = "dawn";
  else if (now >= today.asr) scene = "evening";
  const shown = preview || scene;
  if (root.dataset.scene !== shown) root.dataset.scene = shown;
  const themeColor = getComputedStyle(root).getPropertyValue("--sky-top").trim();
  document.querySelector('meta[name="theme-color"]').setAttribute("content", themeColor);

  // Sun by day, moon by night, on the same path.
  if (preview) {
    const demo = { dawn: [0.94, "moon"], day: [0.42, "sun"], evening: [0.8, "sun"], night: [0.38, "moon"] }[preview];
    const isSun = demo[1] === "sun";
    root.dataset.sky = isSun ? "day" : "night";
    drawArc(demo[0], demo[1],
      `${isSun ? ICONS.up : ICONS.down}<span>${isSun ? "Sunrise" : "Sunset"}</span>`,
      `<span>${isSun ? "Sunset" : "Sunrise"}</span>${isSun ? ICONS.down : ICONS.up}`);
  } else if (now >= today.sunrise && now < today.sunset) {
    root.dataset.sky = "day";
    drawArc((now - today.sunrise) / (today.sunset - today.sunrise), "sun",
      `${ICONS.up}<span>${shortClock(today.sunrise)}</span>`,
      `<span>${shortClock(today.sunset)}</span>${ICONS.down}`);
  } else {
    root.dataset.sky = "night";
    const from = now >= today.sunset ? today.sunset : yesterday.sunset;
    const to = now >= today.sunset ? tomorrow.sunrise : today.sunrise;
    drawArc((now - from) / (to - from), "moon",
      `${ICONS.down}<span>${shortClock(from)}</span>`,
      `<span>${shortClock(to)}</span>${ICONS.up}`);
  }

  // Dates. The Hijri day starts at sunset.
  const fmt = (opts) => new Intl.DateTimeFormat("en-GB", { timeZone: place.tz, ...opts }).format(now);
  $(".date-greg").textContent = `${fmt({ weekday: "long" })}, ${fmt({ day: "numeric" })} ${fmt({ month: "long" })}`;
  $(".date-hijri").textContent = hijri(now >= today.sunset ? shiftDate(todayDate, 1) : todayDate);

  // Next prayer.
  const nextClock = clock(next.at);
  $("[data-next-name]").textContent = next.name;
  $("[data-next-time]").textContent = nextClock.time;
  $("[data-next-ampm]").textContent = nextClock.ampm;
  $("[data-countdown]").textContent = `${isTomorrow ? "Tomorrow, in" : "in"} ${duration(next.at - now)}`;
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  $(".bar-fill").style.width = `${pct}%`;
  $(".bar").setAttribute("aria-valuenow", String(pct));

  // Today's list.
  const passed = list.filter((p) => p.at <= now).length;
  $("[data-schedule-count]").textContent = passed === 5 ? "All 5 times passed" : `${passed} of 5 passed`;
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
}

function setPreview(scene) {
  preview = scene === "live" ? null : scene;
  document.querySelectorAll("[data-scene-pick]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.scenePick === scene));
  });
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
        label: "Prayer times for your location",
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
  const skyText = $(".sky-text");
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
    // Hidden text should not take clicks or screen reader focus.
    skyText.toggleAttribute("data-gone", leave >= 1);
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(apply); } };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  motion.addEventListener("change", queue);
  apply();
}

function start() {
  setupCollapse();
  document.querySelectorAll("[data-scene-pick]").forEach((b) => {
    b.addEventListener("click", () => setPreview(b.dataset.scenePick));
  });
  $("[data-locate]").addEventListener("click", locate);

  if (DOWNLOAD_URL) {
    const link = $("[data-download]");
    link.href = DOWNLOAD_URL;
    link.hidden = false;
    $("[data-download-status]").hidden = true;
  }

  render();
  setInterval(render, 20000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
}

if (window.adhan) start();
else window.addEventListener("load", start);
