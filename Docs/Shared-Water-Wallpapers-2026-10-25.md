# Shared water, atmosphere and wallpaper pass · 25 October 2026

Experimental branches: Workshop `experiment/shared-water` (0.5.0), Pulse `experiment/shared-water-wallpapers` (0.12.0). Public suite packages are not replaced.

## What shipped in this preview

An original shared analytic environment module: eight directional wave harmonics, analytic normals, deterministic crest foam, reflected sky, sun glitter, clouds, haze, exposure and four finishes (natural, chrome, neon, contour wire). Wave height, direction, sharpness, scale, atmosphere and colours are editable. Its phase comes from project time rather than accumulated simulation steps.

Workshop: Light & camera > Water & atmosphere. The water stage is genuine scene geometry, so objects can intersect it. A sky-derived environment lights reflective objects; output renderers own their reflection resources. The water example contains editable dimensional lettering. Water is render-only: model and print exports contain the authored objects, without the enormous sea plane. No wakes, buoyancy or object-in-water reflections are claimed.

Pulse: Water & atmosphere is a lab family, with four editable examples. Colour roles can follow the composition (including anchored roles) or be authored independently. Music changes selected wave height and foam intensity. Water uses a bounded GPU surface with resource disposal, and a fallback gradient if WebGL is unavailable.

Six original Pixel worlds are another editable Pulse family: Tidal circuit, Orbital reef, Neon causeway, Quiet signal, Chromatic undertow and Night garden. Their stars, waves and small movements derive from seed and phase; wallpapers use restrained reaction by default. These are deliberately stylised scenes, not physical oceans.

Use elsewhere > Wallpaper Engine saves a self-contained offline web project ZIP. The runtime embeds the renderer and local assets, excludes source music, honours pause/FPS settings and exposes motion speed, brightness, pixel size, three linked colour roles and optional desktop audio response. Oversized ingredients and unsupported animated-image ingredients receive an explanation; use PNG sprite sheets or video for those. Borrowed Butterchurn scenes use video export. Portrait and wide screens fill by cropping rather than stretching. Arbitrary compositions still need their seam reviewed; the renderer does not magically make all motion periodic.

## Research and implementation choice

Reviewed Noniv/web-ocean, pinned upstream a07c7fd522ef0a897601c114f927a49d93d95520. It is MIT, uses WebGPU FFT waves and persistent simulation/rendering state. Our existing hosts use WebGL/Three, and seeking and exact-frame export matter. We wrote an original analytic module rather than copying the upstream FFT renderer. This has lower physical fidelity but explicit repeatable phase and works in both current hosts. No upstream shaders, textures or private clip assets were incorporated.

https://github.com/Noniv/web-ocean
https://github.com/Noniv/web-ocean/blob/main/js/main.js
https://docs.wallpaperengine.io/en/web/first/gettingstarted.html
https://docs.wallpaperengine.io/en/web/customization/properties.html
https://docs.wallpaperengine.io/en/web/audio/visualizer.html
https://docs.wallpaperengine.io/en/web/performance/fps.html

## Verification

Pulse: 174 model tests pass. Workshop: 21 model tests pass. Water GPU seek and exact phase closure pass. Workshop water edit/Undo and periodic height checks pass. Existing Workshop startup/manual drawing/save-reopen/PNG/GLB and surface exact-output checks pass. Pulse stack tests pass (masks, transitions, original-flow resource limits, locks, style/project reopening and exact PNG frames). All six pixel scenes move, seek reproducibly and match at phase 0/12. Water runs through actual exact-frame PNG export. Wallpaper export UI/download, standalone offline startup, partial property callbacks, zero-valued colour channels, pause, FPS and portrait viewport pass in Edge. No external HTTP requests in exported-page tests. Native Windows startup checks pass for both; Workshop joined-solid/shelf probe also passes.

One older Pulse browser smoke test stopped because it expects a generated layer named Headline after Surprise. That assumption no longer holds reliably; it is recorded as a stale test, not reported as passing. New targeted editing/export checks and current stack tests passed. The Wallpaper Engine editor itself has not been automated or tested here; its callbacks were simulated in Edge. User should verify import, property display, multi-monitor cropping and pause behaviour in Wallpaper Engine.

## Deliverables and provenance

Six 12-second, 1920×1080 H.264 loops (24 fps delivery from 12 fps authored pixel motion), editable Pulse sources and self-contained web projects. Dither study PNGs and recipes were actually rendered through the Dither engine. Optional reusable star ornament was authored and sprite-exported with Wobble; it is a bonus ingredient, not baked into the six base films. Optional 12-second original ambient bed rendered with Sound, with a documented delivery gain; muted/not loaded by default. No user music, monitor-capture clip, existing wallpaper art, models or private source images are distributed.

Future checks: actual Wallpaper Engine editor imports and properties; GPU timing on modest hardware; more portrait/ultrawide scene framing; persistent-foam quality only if exact seeking remains guaranteed; physically richer sky/shoreline interaction; mesh-resolution adaptation near Workshop objects; separate render-stage and printable-water authoring if requested. Preserve the fixed-role/independent-cycling colour behaviour. Keep desktop audio opt-in and no background recording.
