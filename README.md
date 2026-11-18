<img src="assets/icon.svg" width="64" height="64" alt="">

# Praymate

The website for Praymate, the Android app for the five daily prayers.

The page opens on the Kaaba artwork for the current time of day. On first load the picture opens out of an arch around the Kaaba to the full width of the page, with the Praymate name beside it. As you scroll, the picture shrinks into a band and the Kaaba rises, the same motion as the app's switch from Home to another tab. Five features follow, one at a time: prayer times, alarms, answering an alarm, history, and the sky that follows the day.

The prayer times are real. They are calculated in the browser with the same library and settings as the app (Adhan, Muslim World League, Shafi Asr), and the artwork is picked the same way the app picks it. Visitors see Makkah times until they choose Use my location. The location stays in their browser.

## Files

- `index.html`, `styles.css`, `app.js`: the whole site. No build step.
- `assets/art/`: the app's Kaaba artwork, upscaled 4x with Real-ESRGAN and saved as WebP. The `-wide-1400` and `-wide-2400` files extend each scene sideways for wide screens, at 1400 and 2400 pixels tall. The `-960` squares are for the scene picker and the closing arch.
- `assets/fonts/`: Outfit from the app, as woff2, with its license. The Fraunces headings load from Google Fonts.

## Colors

Each time of day uses its palette from the app's `HomePalette` (`lib/theme/home_palette.dart`): the artwork's ground color for the page, a lighter box color, Delft Blue `#353B56` for the highlighted box, and Earth Yellow `#FBB45E` for actions. The closing section uses the deep colors from the welcome screens.

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Before launch

Set `DOWNLOAD_URL` at the top of `app.js` to the Play Store or APK link. The Download for Android button stays hidden until it has a value.
