# Mechanics of Machines I and II

Interactive notes for the two Mechanics of Machines courses at Uganda Martyrs University. Everything is static HTML and JavaScript, with no build step and nothing to install. It is hosted free with GitHub Pages.

| Course | Folder | Contents |
|---|---|---|
| Mechanics of Machines I (BME 2102) | [`bme2102/`](bme2102/) | Seven chapters as slide decks: introduction, simple mechanisms, velocity and acceleration, belt drives, toothed gearing, cams, balancing. 3D models use three.js from `vendor/`. A tutorial class, `tutorial.html`, gathers every worked calculation by topic. |
| Mechanics of Machines II (BME 3102) | [`bme3102/`](bme3102/) | Seven chapters as slide decks: planar mechanisms, turning moment and the flywheel, vibrations, friction and clutches, gearing and gear trains, kinematic synthesis, governors and gyroscopes. A tutorial class, `tutorial.html`, gathers every worked calculation by topic. |

## Labs

Each lab sits inside the course it belongs to and is linked from the section of the notes that uses it, as well as from the course page.

| Lab | Folder | Used in |
|---|---|---|
| Slider-Crank Lab | [`bme2102/labs/slider-crank/`](bme2102/labs/slider-crank/) | BME 2102 sections 2.2.3, 3.2.2; BME 3102 section 1.4. A NumPy and Matplotlib version is in `slider_crank.py` in the same folder. |
| Quick Return Lab | [`bme2102/labs/quick-return/`](bme2102/labs/quick-return/) | BME 2102 sections 2.2.3, 3.4; BME 3102 section 1.5 |
| Spur Gear Mesh Lab | [`bme2102/labs/gears/`](bme2102/labs/gears/) | BME 2102 chapter 5; BME 3102 section 5.2 |
| Turning-Moment and Flywheel Lab | [`bme3102/labs/flywheel/`](bme3102/labs/flywheel/) | BME 3102 section 2.6 |
| Four-Cylinder Engine Lab | [`bme3102/labs/engine/`](bme3102/labs/engine/) | BME 3102 section 2.4, with the cut-out engines; printable sheet `sheet.html` |
| Friction Clutch Lab | [`bme3102/labs/clutch/`](bme3102/labs/clutch/) | BME 3102 section 4.4 |
| Spring–Mass–Damper Lab | [`bme3102/labs/vibration/`](bme3102/labs/vibration/) | BME 3102 section 3.5 |
| Tacoma Narrows Flutter Lab | [`bme3102/labs/tacoma-narrows/`](bme3102/labs/tacoma-narrows/) | BME 3102 section 3.5 |

## Publish with GitHub Pages

1. Copy the *contents* of this folder into the repository folder in GitHub Desktop (keep the hidden `.git` folder), commit and push. Include the empty `.nojekyll` file.
2. On github.com open **Settings, Pages**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
3. After a minute or two the site is live at `https://<your-username>.github.io/mechanics-labs/`.

## Licence

Text CC BY 4.0, code MIT (see `LICENSE`). three.js (MIT) in `vendor/` and `bme3102/vendor/`, KaTeX (MIT), Roboto (Apache 2.0).
