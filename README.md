# Amoment — A moment, held.

A browser-based film photography studio by Qiang Xu, built for the Web Technologies course.

## Experience

- Interactive 3D film cover with a pointer-following optical loupe.
- Darkroom pull-switch and curtain transition into the studio.
- Six selectable camera models with rotation and zoom.
- Five creative film looks and manual exposure, contrast, saturation, warmth and grain controls.
- Original/graded comparison, seven print styles, local photo import and JPG export.

The looks are aesthetic approximations rather than calibrated film-stock reproductions. Imported photos are processed locally in the browser.

## Run

Requires Node.js for the local preview only. Run `npm start`, then visit `http://127.0.0.1:4173/`. There is no installation or build step. Deploy the contents of `dist/` to a static host.

## Implementation

Semantic HTML, CSS, JavaScript modules, Canvas 2D, Three.js, and locally served GLB assets. The Three.js MIT license is included in `dist/vendor/three-LICENSE.txt`. Photo attribution and source links are available through the Photo credits dialog and `dist/photos.js`.

## Publishing

The GitHub repository is intended to remain private. Only `dist/` should be served publicly; repository metadata and local development files should not be deployed. As with every browser website, the delivered HTML, CSS, JavaScript and assets remain accessible to visitors.
