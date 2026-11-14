# BME 3102 Mechanics of Machines II: interactive lecture decks

Uganda Martyrs University, Department of Mechanical and Manufacturing Engineering. Lecturer: Elly Olomo. Academic year 2026/27.

## Opening the decks

Open `index.html` in a browser. This folder is part of the Mechanics Labs site, beside the BME 2102 notes, and links back to it. Everything runs from the folder with no installation and no build step, so it also works from a USB stick or on GitHub Pages.

- Chapter 1: Planar mechanisms and geometry of motion (`mechanisms.html`)
- Chapter 2: Dynamics of machines, turning moment and the flywheel (`flywheel.html`)
- Chapter 3: Mechanical vibrations (`vibrations.html`)
- Chapter 4: Friction, clutches and bearings (`friction.html`)
- Chapter 5: Toothed gearing and gear trains (`gearing.html`)
- Chapter 6: Kinematic synthesis of mechanisms (`synthesis.html`)
- Chapter 7: Automatic control: governors and gyroscopic effects (`governors.html`)

Each chapter opens as 16:9 slides. Add `?view=page` to the address (or press "Page view") to read the same content as one scrolling page, which suits phones.

Keys: Space, the arrow keys, Page Up and Page Down, Home and End. Arrow keys adjust a slider instead when a slider has focus. In full screen the bottom bar hides itself and comes back when the mouse nears the bottom edge. "PDF" prints one slide per page; choose "Save as PDF" and set margins to none if the browser asks. Worked-example solutions are opened automatically in the PDF.

## What is inside

- Live models: mobility counter, four-bar explorer (Grashof and inversions), velocity and acceleration polygons with I-centres, slider-crank kinematics with Klein's construction, slider-crank inversions, quick-return with Coriolis, static four-bar forces, engine force flow, turning-moment diagram and flywheel designer, free and damped vibration, forced response with isolation, unbalance and base motion, inclined plane and friction cone, screw jack, collars and pivots, clutch capacity, journal friction circle, involute gear mesh with contact and interference, epicyclic train solver with torques, three-position motion generation, crank-rocker designer, Freudenstein function generator with structural error, Porter governor with friction, Hartnell spring designer with controlling-force plot, gyroscopic effect from vectors.
- 3D labs (three.js r147), each with lab controls and live readings:
  - Chapter 1: four-bar linkage kit (adjustable links, Grashof class, transmission angle, coupler curve), shaping machine with crank and slotted-lever quick return, Oldham coupling.
  - Chapter 2: single-cylinder engine with live force analysis (gas, inertia, rod thrust, side thrust, crank effort, turning moment over the four-stroke cycle); punching press with flywheel and a live speed-fluctuation simulation.
  - Chapter 3: universal vibration apparatus with unbalanced exciter, adjustable dashpot and drum recorder (free and forced vibration, resonance).
  - Chapter 4: screw jack, centrifugal clutch (engagement, slip and torque capacity), single-plate clutch, deep-groove ball bearing.
  - Chapter 5: gear trainer (spur, helical, double helical, with tooth forces and contact ratios), straight bevel gears, worm hoist (single and two start, self-locking), rack-and-pinion steering, two-stage helical gearbox with motor, planetary gear set.
  - Chapter 6: the four-bar kit again, for testing a synthesised linkage.
  - Chapter 7: Porter governor and Hartnell governor (speed control, adjustable spring: stable, isochronous, unstable), motorised gyroscope (precession timed against ω_p = C/Iω).
  Take apart, turn, and click a part for a close-up and a photo.
- Worked examples with live inputs, tutorial answers and a self-check quiz per chapter.

## Notes

- 3D models are procedural (drawn in code), not scans of real parts. The live readings come from the same equations as the chapters, so they match the worked examples.
- Photos of real parts load from Wikimedia Commons, so they need an internet connection. Each shows its author and licence.
- Corrections to the source slides: damped period T_d = 2π/ω_d; spring-mass frequency uses 1/2π; the maximum screw efficiency is at α = 45° − φ/2; uniform wear gives p r = constant because wear depends on pressure times rubbing speed; centrifugal clutch spring force m r ω'² and torque n μ m r (ω² − ω'²) R.
- Notes on textbook examples: in Rattan Example 5.8 (y = x² by three precision points) the four-bar's largest error between the points is about 36% of the output range, so the chapter says so and suggests better spacing; Rattan Example 5.11 is sensitive to rounding (unrounded angles give link lengths 12.3, 27.0 and 14.3 rather than 13.1, 26.8 and 15.2); Rattan Example 17.1 states 250 rpm but works with 240 rpm, so the chapter gives 3.33 rad/s for 250 rpm.

## Files

`css/style.css` styles; `js/slides.js` slide engine; `js/common.js` model helpers; `js/ch1.js` to `js/ch7.js` live models; `js/gears.js` involute tooth outlines; `js/models3d.js` 3D viewer; `js/models-kit.js` shared 3D parts (gears of every type, fasteners, springs, bearings, motors, force arrows); `js/models-ch1.js`, `js/models-ch2.js`, `js/models-engine.js`, `js/models-ch3.js`, `js/models-ch4.js`, `js/models-ch4b.js`, `js/models-ch5.js`, `js/models-gears.js`, `js/models-ch7.js` 3D labs; `js/photos.js` Commons photos; `vendor/` KaTeX CSS and fonts, three.js; `assets/fonts/` Roboto. Equations are pre-rendered with KaTeX.

## References

Meriam, J. L., & Kraige, L. G. (2007). *Engineering mechanics: Dynamics* (6th ed.). Wiley. https://openlibrary.org/isbn/9780471739319

Rattan, S. S. (2009). *Theory of machines* (3rd ed.). Tata McGraw-Hill. https://openlibrary.org/isbn/9780070144774

## Licences

KaTeX: MIT. three.js: MIT. Roboto: Apache 2.0. Photos: as stated on each photo.
