# Research and dependencies

Three.js 0.186.1 (MIT), locally bundled: rendering, controls, geometry, SVG/font loaders and GLB/STL exporters. Unmodified Helvetiker example typeface from Three.js r186; see Font-LICENSE.txt and embedded original font information. esbuild 0.28.2 (MIT) is a build-time tool, not a required installed runtime.

Our authoring interface, project schema, examples, geometry preparation and output workflows are original to this experiment. Research references include Three.js official documentation, Cables' offline/reusable-component approach, TouchDesigner parameter/component workflows, Blockbench's focused authoring and Manifold's solid-modelling approach. Cables, TouchDesigner and Blockbench code is not included. The initial 0.1 build did not include Manifold; see the 0.2 dependency entry below. No proprietary examples or private user artwork are bundled.

https://threejs.org/docs/
https://github.com/mrdoob/three.js/tree/r186/examples/fonts
https://cables.gl/standalone
https://github.com/cables-gl/cables
https://derivative.ca/UserGuide/CHOP
https://docs.derivative.ca/Custom_Parameters
https://www.blockbench.net/
https://github.com/elalish/manifold

Native host uses the existing JAGO WebView2 runtime payload, with its accompanying licence. No cloud services or runtime network assets are needed.


## Expansion 0.2

Manifold 3.5.4 (Apache-2.0), including its bundled WASM, is now used for local physical-output preparation in an on-demand worker. fflate 0.8.3 (MIT) supplies 3MF/frame ZIP packaging. See their accompanying notices. Core work remains offline. The worker is created only when preparing solids and is terminated after completion/cancellation. No Cables, TouchDesigner, Fluid or ASCII implementation is included.


## Authoring/finishes pass 0.3 · 22 October 2026

Official Three.js references checked for cel gradient maps, nearest-filtered non-colour gradient data, HDR bloom and output colour management:
- https://threejs.org/docs/pages/MeshToonMaterial.html
- https://threejs.org/docs/pages/UnrealBloomPass
- https://threejs.org/manual/pages/post-processing.html
- Bundled Three r186 source: ShaderChunk/map_fragment.glsl.js, RenderPass, OutputPass and UnrealBloomPass.

Solid operations checked against the bundled Manifold 3.5.4 declarations and official API reference: https://manifoldcad.org/docs/jsuser/classes/Manifold.html . New controls, authoring recipes, texture/pulse shaders, camera interpolation and workflow code were authored for this Workshop. Dependencies retain their existing notices. No remote presets, private reference media or new runtime services were bundled.
