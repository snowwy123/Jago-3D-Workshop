# Jago 3D Workshop · experimental 0.4.0

An offline workshop for dimensional artwork, sculptural forms, small creative sets and physical-output experiments. Working title; separate from the public suite. Pulse is unchanged.

## Open and try

Open **Jago-3D-Workshop.exe**, or the accompanying self-contained **Jago-3D-Workshop.html** in a recent WebGL2 desktop browser. Windows app: x64 Windows, .NET Framework and Microsoft Edge WebView2 Runtime. Keep the extracted files together.

Try **Illustrated dimensional sign**, **Printable maker tag** or **Looping neon sign** for a grouped design, a flat single-shell print study, or travelling neon and moving patterns. Paper landscape, Dimensional lettering, Quiet studio vessels and Orbital line sculpture remain editable starts.

## Make

Add cut-outs, outlined SVG artwork, image cards, lettering, blocks, spheres, cones, rings, pedestals and rotational profile forms. SVG imports need simple filled outlines and text converted to paths; external assets/effects are rejected. SVG fills receive one material. Images remain textured planes. Built-in lettering uses the licensed bundled Latin typeface; arbitrary font import is future work.

**Draw outline** now supports placed points, freehand, dragging existing points, removing points with right-click, grid snapping, simplification and Undo/Redo. The drawing's top stays at the object's top. Crossed/degenerate outlines receive feedback. Use Start a hole to draw inside the outer outline; Make object completes the current hole. Up to eight separate holes are supported. Round drawn corners uses quadratic smoothing. Hand-drawn objects retain their points: Edit original outline reopens them. Imported SVGs retain their source but do not expose this point editor.

For profiles, draw the outer side from bottom to top. The object can be solid or hollow/open at the top. The wall control is a radial offset plus base thickness; sloping walls may have a smaller perpendicular thickness. Extreme thicknesses that do not fit the profile are rejected. Check physical output in a slicer.

## Arrange and snap

Click selects; Ctrl-click adds/removes; Shift-click selects a range in the object list. Move, rotate and scale handles act on the selected set around the active object. The selected set previews together during handle drags. Group selected stores a named selection group. Clicking a member selects the group; Ctrl-click lets you choose individual members. Locked parts stay fixed. Keep / lock protects an object during edits, layout exploration and creative look presets. Visibility is independent.

Enable **Snap** in the canvas toolbar or temporarily hold Shift while using a handle. **Snap settings** exposes grid spacing, angular increments, edge/centre attraction and surface attraction. Alignment buttons use the active object's bounds as reference. Rest on surface uses actual bounds, including rotation. The working surface has its own height and colour; Add a solid platform creates an actual editable/exportable object.

Depth study explores an assembled illustration without scattering its X/Y layout. Gallery, grid, radial, stack and scatter modes deliberately reposition separate objects. Generate from seed repeats the current exploration basis; Surprise arrangement chooses a fresh seed. Compare 3 directions previews alternatives before Apply. Editing the set establishes a new basis. Locks stay authoritative.

## Select, duplicate and focus

**Q · Select** switches left-drag to rectangle selection; the normal Move/Rotate/Scale tools retain orbit navigation. Rectangle selection touches visible objects’ projected bounds, including objects behind another visible piece. It is not an occlusion-aware pixel selection. Shift adds to the selection; Ctrl chooses individual group members. Right-drag remains available for panning. Use W/E/R to leave Select mode.

The selection outline encloses the selected visible set. **Frame selection** frames it. **Isolate selection** temporarily hides the rest while you work; the on-canvas **Show all** button restores it. This changes only the editor view. PNG/JPG, GLB, print and projection output use the document’s normal visibility. Isolation resets when opening a project or example and does not change saved visibility.

Hold **Alt while starting a Move-handle drag** to drag a duplicate; the originals remain visible and stay in place. One Undo removes the duplicate. Ctrl+D remains available. Combined results bring independent copies of their source objects, and group/source identifiers are remapped so copies do not edit the originals. Source dependencies count toward the existing 64-object / 240-instance limits.

## My creations

Select an object or group, open **My creations…**, name it and **Save to my creations**. The shelf stores your pieces, embedded artwork, materials, construction and motion across projects on this device. Combined-shape sources are included automatically. A small preview is generated when saving. Search, rename, export or remove entries from the shelf. Removing a shelf entry leaves the current scene and exported files intact.

**Add to scene** inserts an independent editable copy, either centred on the working surface or beside the current selection. **Unlock inserted pieces** is optional. One Undo removes the insertion. Motion uses the current scene’s clip length. The shelf does not replace the scene’s lighting, background or camera.

**Export selected as file** / a saved card’s **Export** writes a self-contained `.jagocreation`. **Import creation…** brings that file into the shelf, ready to add to any scene. Export these files for backup, another browser or another PC; the local shelf is not your portable backup. Imported thumbnails are omitted rather than rendering untrusted embedded previews; objects and artwork are still included.

The shelf runs only when used and stores data locally through IndexedDB. Limits are 40 creations / 50 MB total, with a 24 MB creation-file limit. If local storage is unavailable/full, export the selection as a file instead. Missing construction sources are reported before saving or duplicating. Geometry/asset limits still apply on insertion.

## Editable construction and combined solids

Source shape → Thicken → Round edges → Repeat stays editable. The construction switches bypass stages without discarding their settings. This is a fixed construction sequence, not a general reorderable modifier graph.

**Combine solid shapes** offers Join, Subtract and shared Intersection. Select at least two unlocked original solids. Subtract cuts the later source objects in the object list from the first. Combined results keep hidden source objects in the project. **Edit sources** reveals them; select the result and **Rebuild from sources** when finished. Rebuild replaces the result geometry and resets its manual transforms. Undo is available. Nested combined results are not supported; missing/deleted sources need restoring before a rebuild. A 150,000-source-triangle / 45-second budget and Cancel keep jobs bounded.

## Creative finishes, stage and lighting

The selected object's Drawing style offers solid, ink outlines, cel/poster shading, edges without faces, hidden-line drawing, graphic hatching, flat silhouettes, triangular wireframe, neon terminal lines, X-ray and clay. Line colour and crease angle are editable; cel shading exposes band count and darkest-band brightness. Ink width affects the ink/cel silhouette; ordinary GPU edge lines remain thin. Material finishes include paper, ceramic, metal, procedural wood/checker, plastic, glass and iridescence.

The whole-set Creative looks shelf includes Ink on paper, 90s terminal, Blueprint study, Clay maquettes and Illustrated poster. These change unlocked object appearances and stage choices; geometry stays editable and Undo is available.

Light & camera has solid, gradient and imported-image backdrops, independent surface colour/height, editable platforms and named cameras. Lighting includes studio, warm, dramatic, neon split, sculptural rim and flat starts. Advanced controls expose key elevation/colour, fill and rim colours/strengths, ambient light, environment reflections, exposure and shadow softness.

### Moving surfaces and light

Open **Surface detail & moving light** on an object. Choose stripes, checker blocks, rings or a grid; set colour, size, axis and cycles. **Apply artwork texture** accepts embedded PNG/JPG/WebP artwork and a texture-repeat control. Artwork uses the geometry's UV mapping and flows horizontally; procedural patterns use object-space coordinates. UV quality varies by shape; combined solids do not have UV artwork mapping yet. Textures are still images, not video or animated GIF layers.

Emission has its own colour/intensity and steady, breathing or travelling-band modes. Travelling bands follow the selected local axis and pattern size. Neon lines respond too. **Enable soft scene glow** adds HDR bloom; scene glow strength/spread live under Light & camera. Emission is a visual finish, not a scene light source that physically illuminates nearby objects.

### Working and output cameras

Light & camera offers illustration/portrait/studio/wide and artistic fisheye-style presets. **Use view for output** keeps the shot while you orbit the working camera. **Use view as travel ending** and **Animate output camera** make a smooth or constant-speed move over the clip. Keep the same projection type for start and end. **View through output camera** previews it while scrubbing/playing; uncheck to return to the working view. Fisheye-style uses radial screen distortion with dark outer edges, not a calibrated physical lens. Clear helpers are excluded from renders.

## Motion and export

Choose Turntable, Object motions or both beside Play. Each object can float, spin, orbit or sway with amount, phase, cycle count, spin axis and smooth/triangular/held movement. Motion, texture flow and emission use absolute time. Integer cycles repeat; fractional cycles deliberately make partial moves. Pause returns to the modelling/rest pose. Physical preparation uses that rest pose.

- PNG/JPG from the kept output camera, or the working view when no output camera is kept, with output dimensions up to 4096 per side. Transparent PNG omits the working ground and keeps crisp materials/emission; bloom and lens distortion are bypassed to preserve clean alpha.
- Exact PNG frame sequences as ZIP: 12/24/30 fps, known sample times and timing metadata. A 32-million-pixel sequence budget requires smaller images or shorter durations for longer clips. Cancellation is available.
- Realtime silent WebM motion recording remains available; it follows playback rather than guaranteeing exact frames.
- GLB scene interchange includes visible geometry, supported materials/lights and the current camera. Procedural shader/ink treatments and environment lighting may differ in another viewer. PNG/video preserve the rendered look; the native project preserves editable recipes.

## Prepare for 3D printing

Choose selected object(s) or all visible solid objects. Image cards are excluded. The bundled Manifold engine prepares solids locally in a cancellable worker. Join intersecting solids performs a real boolean union. Optional base plate adds a four-millimetre plate with overlap; parts which still do not connect remain separate shells.

The preparation report shows dimensions, triangles, volume, connected shells and fit within the chosen bed bounds. Output is Z-up and moved onto the bed. Export STL (interpreted as millimetres) or 3MF (explicit millimetre units and indexed geometry).

This does not generate supports, slice a model or control a printer. A valid closed manifold is not a guarantee of sufficient wall thickness, printable overhangs, strength or material suitability. Inspect the exported object and layers in your slicer and perform representative prints. Arbitrary mesh repair and thickness inspection remain future work; authored join/subtract/intersection use the same local solid engine.

## Projection

Add up to four named planar surfaces. Each displays the full scene or a chosen object. Drag numbered corners on the mapping canvas; arrow keys nudge the last corner and Shift makes a larger nudge. Convex outlines are required. Keep a projector camera to orbit the working scene independently, or choose a live working camera.

Open the clean output, move it onto the projector display and use Fullscreen. The alignment grid, per-surface enable state, blackout and camera/corners are saved in the project. Space in the output toggles blackout. This is manual planar mapping, not automatic calibration, curved-surface mapping, edge blending or multi-projector management. Output currently uses a throttled editor-canvas capture path rather than a low-latency live-performance transport. It still needs physical projector testing. Independent source-object isolation keeps the other scene objects out of that surface's output.

## Save and shortcuts

Save project downloads a portable .jago3d containing artwork, construction, materials, motion, cameras, lighting and mapping. Completed authoring edits are also locally autosaved when storage permits. Recover autosave asks before replacing your set. Browser storage is not a backup; save portable projects for important work.

| Key | Action |
|---|---|
| Q | Toggle rectangle selection |
| W / E / R | Move / rotate / scale |
| G / hold Shift | Toggle snapping / temporary snapping |
| F / Shift+F | Frame active object / whole set |
| Ctrl+D / Alt + Move-handle drag | Duplicate selection |
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

Run `node --test Tests/*.test.mjs`. Browser workflows use Edge and Playwright, selected by PLAYWRIGHT_PATH; run browser.cjs, outputs.cjs, expanded.cjs, solids.cjs motion.cjs and cancel.cjs. independent.mjs reloads exported GLB/STL. verify-files.py (Pillow) independently checks exact-frame ZIPs and manufacturing archives. Additional v0.3 workflows: workbench.cjs (groups/materials/cameras/outline), construction.cjs (independent CSG volumes and source rebuilding), surface-output.cjs (artwork, shaders, camera/glow exact sequences). Open disclosures before accessing their controls. Test output stays in Checks/, outside user packages. Native `--deep-check <private-directory>` uses an isolated profile and verifies the solid worker as well as startup.

The preview retains 64 objects / 240 repeated instances, artwork/cache limits, solid-operation triangle/time limits and exact-sequence budgets. Physical GPU/DPI/multi-monitor, printer and projector testing remain necessary. Workscape live tabs, full Material exchange, arbitrary fonts and general modelling/constraint systems are still future work.

Open source. Free forever. Personal, professional and commercial use are welcome. Imported assets and third-party components retain their own licences. See LICENSE.txt and Notices/.

## Exchange with the suite

Use PNG/JPG in Dither or Library; transparent PNG for illustration/pattern assembly in Wobble or Repeat; rendered WebM for Pulse; or exact PNG frames for further animation. Save the .jago3d alongside the result so you can return to the original construction. These are file-based exports. Live editable handoff, direct Pulse family authoring, animated material GLB and Workscape tabs are not connected in this preview.

Inspector editing keeps live controls, caret/focus and scroll position through routine value changes. Disclosure/layout changes restore scroll after the inspector is fully constructed.

Version 0.4 browser checks: handling.cjs, drag-copy.cjs and examples-creations.cjs cover the personal shelf, independent source retention, selection, duplication and isolation-safe output. Native deep checking now also saves a creation in an isolated local shelf.
