<img src="assets/icon.svg" width="64" height="64" alt="">

# Praymate

The website for Prayer, the Android app for the five daily prayers.

The page opens with the app's home screen running live in the browser. It calculates today's prayer times with the same library and settings as the app (Adhan, Muslim World League, Shafi Asr), shows the next prayer with a countdown, moves the sun or moon along its path, and picks the dawn, day, evening or night artwork the same way the app does. Visitors see Makkah times until they choose Use my location. The location stays in their browser.

## Files

- `index.html`, `styles.css`, `app.js`: the whole site. No build step.
- `assets/art/`: the app's Kaaba artwork as WebP. The `-wide` versions extend the scene sideways for wide screens.
- `assets/screens/`: screenshots from the app's `docs/screenshots/`.
- `assets/fonts/`: Outfit and Fraunces from the app, as woff2, with their licenses.

## Colors

Each time of day uses its palette from the app's `HomePalette` (`lib/theme/home_palette.dart`): the artwork's ground color for the page, a lighter box color, Delft Blue `#353B56` for the highlighted box, and Earth Yellow `#FBB45E` for actions. The closing section uses the deep colors from the welcome screens.

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Before launch

Set `DOWNLOAD_URL` at the top of `app.js` to the Play Store or APK link. The Download for Android button stays hidden until it has a value.
