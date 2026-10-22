# Jago 3D Workshop · experimental 0.1

Make dimensional artwork, objects and little creative sets. This working title and preview are independent of the public suite; Pulse is unchanged.

## Start

Open **Jago-3D-Workshop.exe**, or **Jago-3D-Workshop.html** in a recent desktop browser with WebGL2. Windows app: x64 Windows, .NET Framework and Microsoft Edge WebView2 Runtime. Keep the extracted files together. All bundled examples and core work run offline.

Try **Paper landscape**, **Dimensional lettering** or **Quiet studio vessels** in the example selector. Click an object to select it. Move / Rotate / Scale handles manipulate it; drag empty space to orbit, right-drag to pan and scroll to zoom. Front / Isometric and Frame set recover a useful view. F frames the selected object.

## Make and arrange

Add a cut-out, lettering, profile form, block, sphere or pedestal. Draw an outline by clicking points, or edit a profile from base to top. Profile forms close to the rotation axis and are solid; hollow walls are not implemented. SVG import accepts simple filled outlines; text must be converted to paths. One material is applied to the imported filled artwork. PNG/JPG/WebP become flat textured cards. Arbitrary font import, SVG effects and automatic image-to-solid tracing are not supported yet.

The Object inspector controls thickness, safe bounded edge rounding, surface colour and placement. **Repeat this object** provides line, ring and grid arrangements. Keep / lock protects an object during arrangement exploration. Surprise arrangement affects unlocked placement and colour. It is an early simple exploration tool, not a complete procedural modeller. Wood is currently a matte colour treatment, not a wood texture generator.

Light & camera offers studio/warm/dramatic lighting, direction, strength, backdrop, ground/shadows and named camera views. Orthographic and perspective cameras are available. Turntable previews rotate the whole set.

## Save

Save project downloads a portable **.jago3d** containing construction recipes, embedded artwork, scene settings and cameras. Completed edits are also autosaved locally when browser storage permits. **Recover autosave** asks before replacing your set. Camera movement is captured when saving. Undo/Redo covers completed authoring edits; a drag is one edit. Keep portable saves for important work.

## Output

- Image: PNG with optional transparency, or JPG, up to 4096 pixels per side. Transparent output omits the ground. Image export uses the current camera with the chosen output aspect.
- Turntable: realtime WebM recording, up to 30 seconds and within 1920 × 1920. It is not exact-frame export and has no audio.
- Scene: GLB with visible objects, materials, supported lights and the current camera. Environment lighting and custom construction semantics do not round-trip through GLB. Save the native project too.
- Print: selected object/repeats as binary STL using millimetres. Open/non-manifold edges and degenerate triangle checks block obvious mesh problems. Thickness, intersections, repeated-part union and physical strength are not validated. Inspect in a slicer. No slicing or printer control is included.
- Projection: clean secondary window, alignment grid, manual four-corner planar mapping, blackout and saved corners. Move it to your projector display and use Fullscreen. It is an early single-surface experiment, without curved-surface calibration, edge blending or multi-projector management. No physical projector test has been performed.

## Development

Source in Source/. Pinned dependency versions in dependency-versions.json/package.json. With Python available, `python fetch.py` fetches the pinned packages into node_modules. With Node available, `node build.mjs` builds the self-contained HTML. Native compile script is Build.ps1 and uses the checked dependency directory. Do not change pinned versions without reviewing notices and testing.

`node --test Tests/model.test.mjs` checks the document model. Browser tests require Playwright (set PLAYWRIGHT_PATH to its installed package directory) and Edge. Run Tests/browser.cjs then Tests/outputs.cjs; outputs stay in Checks/ and must not be bundled as user media. Native startup checks use `--check <private-directory>` and an isolated profile.

This prototype has a 64-object / 240-instance budget, limited artwork sizes and a bounded texture cache. GPU/browser differences still need testing on real machines. Workscape tab integration, full PBR Material exchange, robust booleans, hollow fabrication, arbitrary fonts and exact-frame animation remain future work.

Open source. Free forever. Personal, professional and commercial use are welcome. Imported assets and third-party components retain their own licences. See LICENSE.txt and Notices/.
