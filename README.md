# Jago 3D Workshop · experimental 0.2

An offline workshop for dimensional artwork, sculptural forms, small creative sets and physical-output experiments. Working title; separate from the public suite. Pulse is unchanged.

## Open and try

Open **Jago-3D-Workshop.exe**, or the accompanying self-contained **Jago-3D-Workshop.html** in a recent WebGL2 desktop browser. Windows app: x64 Windows, .NET Framework and Microsoft Edge WebView2 Runtime. Keep the extracted files together.

Try Paper landscape, Dimensional lettering, Quiet studio vessels or Orbital line sculpture. Everything is editable. The last example demonstrates rings, iridescence, line rendering and individual object motion.

## Make

Add cut-outs, outlined SVG artwork, image cards, lettering, blocks, spheres, cones, rings, pedestals and rotational profile forms. SVG imports need simple filled outlines and text converted to paths; external assets/effects are rejected. SVG fills receive one material. Images remain textured planes. Built-in lettering uses the licensed bundled Latin typeface; arbitrary font import is future work.

**Draw outline** now supports placed points, freehand, dragging existing points, removing points with right-click, grid snapping, simplification and Undo/Redo. The drawing's top stays at the object's top. Crossed/degenerate outlines receive feedback. Use a simple closed outline; holes and general vector editing remain future work.

For profiles, draw the outer side from bottom to top. The object can be solid or hollow/open at the top. The wall control is a radial offset plus base thickness; sloping walls may have a smaller perpendicular thickness. Extreme thicknesses that do not fit the profile are rejected. Check physical output in a slicer.

## Arrange and snap

Click selects; Ctrl-click adds/removes; Shift-click selects a range in the object list. Move handles translate the selected set. Rotate/scale handles affect the active object. Keep / lock protects an object during edits, layout exploration and creative look presets. Visibility is independent.

Enable **Snap** in the canvas toolbar or temporarily hold Shift while using a handle. **Snap settings** exposes grid spacing, angular increments, edge/centre attraction and surface attraction. Alignment buttons use the active object's bounds as reference. Rest on surface uses actual bounds, including rotation. The working surface has its own height and colour; Add a solid platform creates an actual editable/exportable object.

Depth study explores an assembled illustration without scattering its X/Y layout. Gallery, grid, radial, stack and scatter modes deliberately reposition separate objects. Generate from seed repeats the current exploration basis; Surprise arrangement chooses a fresh seed. Compare 3 directions previews alternatives before Apply. Editing the set establishes a new basis. Locks stay authoritative.

## Creative finishes, stage and lighting

The selected object's Drawing style offers solid, ink outlines, cel/poster shading, edges without faces, triangular wireframe, neon terminal lines, X-ray and clay. Ink width affects the ink/cel silhouette; ordinary GPU edge lines remain thin. Material finishes include paper, ceramic, metal, procedural wood/checker, plastic, glass and iridescence.

The whole-set Creative looks shelf includes Ink on paper, 90s terminal, Blueprint study, Clay maquettes and Illustrated poster. These change unlocked object appearances and stage choices; geometry stays editable and Undo is available.

Light & camera has solid, gradient and imported-image backdrops, independent surface colour/height, editable platforms and named cameras. Lighting includes studio, warm, dramatic, neon split, sculptural rim and flat starts. Advanced controls expose key elevation/colour, fill and rim colours/strengths, ambient light, environment reflections, exposure and shadow softness.

## Motion and export

Choose Turntable, Object motions or both beside Play. Each object can float, spin, orbit or sway with amount and phase. Motion is evaluated from absolute time and loops over the chosen duration. Pause returns to the modelling/rest pose. Physical preparation uses that rest pose.

- PNG/JPG from the current camera, with output dimensions up to 4096 per side. Transparent PNG omits the working ground.
- Exact PNG frame sequences as ZIP: 12/24/30 fps, known sample times and timing metadata. A 32-million-pixel sequence budget requires smaller images or shorter durations for longer clips. Cancellation is available.
- Realtime silent WebM motion recording remains available; it follows playback rather than guaranteeing exact frames.
- GLB scene interchange includes visible geometry, supported materials/lights and the current camera. Procedural shader/ink treatments and environment lighting may differ in another viewer. PNG/video preserve the rendered look; the native project preserves editable recipes.

## Prepare for 3D printing

Choose selected object(s) or all visible solid objects. Image cards are excluded. The bundled Manifold engine prepares solids locally in a cancellable worker. Join intersecting solids performs a real boolean union. Optional base plate adds a four-millimetre plate with overlap; parts which still do not connect remain separate shells.

The preparation report shows dimensions, triangles, volume, connected shells and fit within the chosen bed bounds. Output is Z-up and moved onto the bed. Export STL (interpreted as millimetres) or 3MF (explicit millimetre units and indexed geometry).

This does not generate supports, slice a model or control a printer. A valid closed manifold is not a guarantee of sufficient wall thickness, printable overhangs, strength or material suitability. Inspect the exported object and layers in your slicer and perform representative prints. General authoring booleans and arbitrary mesh repair remain future work.

## Projection

Add up to four named planar surfaces. Each displays the full scene or a chosen object. Drag numbered corners on the mapping canvas; arrow keys nudge the last corner and Shift makes a larger nudge. Convex outlines are required. Keep a projector camera to orbit the working scene independently, or choose a live working camera.

Open the clean output, move it onto the projector display and use Fullscreen. The alignment grid, per-surface enable state, blackout and camera/corners are saved in the project. Space in the output toggles blackout. This is manual planar mapping, not automatic calibration, curved-surface mapping, edge blending or multi-projector management. Output currently uses a throttled editor-canvas capture path rather than a low-latency live-performance transport. It still needs physical projector testing. Independent source-object isolation keeps the other scene objects out of that surface's output.

## Save and shortcuts

Save project downloads a portable .jago3d containing artwork, construction, materials, motion, cameras, lighting and mapping. Completed authoring edits are also locally autosaved when storage permits. Recover autosave asks before replacing your set. Browser storage is not a backup; save portable projects for important work.

| Key | Action |
|---|---|
| W / E / R | Move / rotate / scale |
| G / hold Shift | Toggle snapping / temporary snapping |
| F / Shift+F | Frame active object / whole set |
| Ctrl+D | Duplicate selection |
| Delete | Delete unlocked selected objects |
| Ctrl+Z / Ctrl+Y | Undo / redo |
| Ctrl+S | Save project |
| 1 / 3 / 7 | Front / side / top view |
| O | Orthographic / perspective |
| H | Hide/show active object |
| Space | Play/pause motion |

Typing and open dialogs take precedence. Focus canvas can be exited with Escape.

## Development

Pinned packages: Three.js 0.186.1, Manifold 3.5.4, fflate 0.8.3 and esbuild 0.28.2 (build tool). Notices are bundled. With Python available, run `python fetch.py` to fetch integrity-checked pinned dependencies. With Node available, `node build.mjs` bundles the main app, WASM and print worker into the offline HTML. Build.ps1 compiles the x64 Windows host with the included WebView2 payload. No runtime CDN or account is required.

Run `node --test Tests/model.test.mjs Tests/authoring.test.mjs`. Browser workflows use Edge and Playwright, selected by PLAYWRIGHT_PATH; run browser.cjs, outputs.cjs, expanded.cjs, solids.cjs motion.cjs and cancel.cjs. independent.mjs reloads exported GLB/STL. verify-files.py (Pillow) independently checks exact-frame ZIPs and manufacturing archives. Test output stays in Checks/, outside user packages. Native `--deep-check <private-directory>` uses an isolated profile and verifies the solid worker as well as startup.

The preview retains 64 objects / 240 repeated instances, artwork/cache limits, solid-operation triangle/time limits and exact-sequence budgets. Physical GPU/DPI/multi-monitor, printer and projector testing remain necessary. Workscape live tabs, full Material exchange, arbitrary fonts and general modelling/constraint systems are still future work.

Open source. Free forever. Personal, professional and commercial use are welcome. Imported assets and third-party components retain their own licences. See LICENSE.txt and Notices/.
