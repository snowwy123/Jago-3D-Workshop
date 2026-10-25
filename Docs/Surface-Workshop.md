# Material → 3D Workshop: surface playground

Development preview · Material 0.17.0 / Workshop 0.6.0

1. Open Material and choose **Surface workshop** near the top.
2. Add torn paper, blind-stamped leather or foiled leather. This adds a layer to your document.
3. Choose **Foil & impressions**, then **Import artwork**. PNG/WebP/JPG and simple self-contained SVG are supported. SVG marks are embedded as a raster image for this treatment; keep the original vector separately.
4. Choose transparency coverage for a cut-out logo, or dark/light coverage for artwork on a solid background. Adjust scale, across/up-down placement, rotation, depth and edge softness. Compare, then Apply. Closing the comparison leaves the project unchanged.
5. Use **Export / download all** for finished images and maps. **Lit appearance** bakes Material's lighting; **Colour** keeps the artwork colours.
6. For dimensional staging, return to Surface workshop and **Export for Workshop**. Selected surface is the default; whole composition is optional. The package keeps the full original Material project alongside the chosen surface's four maps.
7. Open Workshop, choose **From Material**, and select the `.jagosurface` file. You can also start with **New sheet** without Material.
8. Choose a pose, edit bends/folds/curl and held edges. **Drag to pose** pulls the sheet toward/away from you with an upward/downward drag; **Finish posing** returns to normal movement. Escape cancels the active pull. One completed pull is one Undo step. Precision pulls are under Local pose handles.
9. Choose Material surface maps to retain imported roughness/metallic, or override with paper, foil, holographic film, cloth or leather. Imported normal detail remains available. The finish presets are artistic approximations, not manufacturing models.
10. For subtle motion, open Gentle motion, set Wind and choose Object motions beside Play. Integer cycles repeat across the clip. Freeze current wind pose keeps the sampled deformation still. Clear frozen wind removes it; Wind can be re-enabled separately.
11. Light & camera holds scene lights/background/cameras. Use your creation exports a lit PNG/JPG, GLB scene or motion. Save project retains the sheet recipe and source. **Save original Material project** recovers the original source snapshot; Workshop's subsequent lighting/shape edits do not modify that snapshot.

## What transfers

Colour, normal, roughness and metallic maps; a Material source snapshot; no external image paths or network dependency. Workshop owns the sheet geometry, camera, finish overrides and scene lighting. Changing the Material source later requires exporting and importing a new package. This is not a live editable material connection.

Material colours can include artistic highlights. Adding Workshop lighting will therefore differ from Material's Lit view. These are generated artistic maps rather than measured physical material scans. A sheet has no solid thickness: use it for pictures/scenes, not as print-ready geometry. GLB retains posed geometry and supported material data; custom appearances and animation may differ in other viewers.

## Examples

The Examples folder contains North (cotton paper and foil), Field (blind-pressed leather) and Sol (foil ribbon), with `.jagomaterial`, `.jagosurface`, `.jago3d`, lit and staged PNGs. All are original sample text/artwork. Open native project files through their app's Open command. From Material imports surface packages in Workshop.

## Testing this preview

Extract the portable folders and keep their supporting files together. Material and Workshop each include a Windows executable and offline HTML edition. Workshop remains an independent experimental tool; this preview does not update your installed suite automatically. Your existing installed apps and personal documents have not been replaced.

Try your own logo on one swatch, cancel a comparison, apply another, Undo, send the selected layer and reopen both saved projects. Feedback on finding controls and getting the desired appearance matters as much as a successful export. Actual other-PC/DPI testing remains necessary.
