# Research and dependencies

Three.js 0.186.1 (MIT), locally bundled: rendering, controls, geometry, SVG/font loaders and GLB/STL exporters. Unmodified Helvetiker example typeface from Three.js r186; see Font-LICENSE.txt and embedded original font information. esbuild 0.28.2 (MIT) is a build-time tool, not a required installed runtime.

Our authoring interface, project schema, examples, geometry preparation and output workflows are original to this experiment. Research references include Three.js official documentation, Cables' offline/reusable-component approach, TouchDesigner parameter/component workflows, Blockbench's focused authoring and Manifold's solid-modelling approach. Cables, TouchDesigner, Blockbench and Manifold code is not included in this build. No proprietary examples or private user artwork are bundled.

https://threejs.org/docs/
https://github.com/mrdoob/three.js/tree/r186/examples/fonts
https://cables.gl/standalone
https://github.com/cables-gl/cables
https://derivative.ca/UserGuide/CHOP
https://docs.derivative.ca/Custom_Parameters
https://www.blockbench.net/
https://github.com/elalish/manifold

Native host uses the existing JAGO WebView2 runtime payload, with its accompanying licence. No cloud services or runtime network assets are needed.
