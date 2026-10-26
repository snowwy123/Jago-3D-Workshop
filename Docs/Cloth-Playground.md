# Cloth playground

3D Workshop 0.8.0 · development preview

## Try it immediately

Choose **Phase · holographic cloth**, **Slow · gallery fabric** or **Form · sphere drape** in the existing examples menu. Each has original embedded artwork and a saved starting pose. Select the sheet, then **Handle fabric…** near the top of its inspector.

The playground opens a larger canvas. Drag the fabric to pull it, drag empty space to orbit, right-drag to pan and scroll to zoom. Choose a fine point, soft patch or broad pull. Held points cannot be grabbed; change the sheet's pins first if needed. Pause settling to examine it, Resume to continue or Restart to return to the session's starting shape. Losing app focus pauses settling.

**Keep pose** writes one undoable frozen pose. **Discard / Escape** restores the previous cloth. Live experiments are temporary; the project is unchanged until Keep pose, apart from working-camera navigation. Save the project to retain the pose and artwork. **Keep in My creations** opens the existing named creations shelf, where you can save or export the selected sheet for reuse.

Live stepping uses 120 Hz constraints, draws at up to 30 fps, bounds catch-up work and pauses after 30 simulated seconds. It is for posing, not a recorded interaction timeline. Playback and exports use saved positions, not a running solver. Paused sessions do not continuously redraw.

## Shape, motion and collisions

Four **cloth directions** give you a gallery banner, floating silk, sculpted foil or a sphere drape. Applying a direction replaces the selected sheet's shape/pins and previous bake, with Undo available. It keeps artwork, object placement and imported Material maps/finish. Without Material maps it also sets a suitable fabric/foil response.

**Cloth physics** retains precise forces, damping and bend resistance. The horizontal starting orientation places the sheet above the local sphere guide; the hanging orientation uses the ordinary upright pose. Visible floor/sphere guides show only these local collision surfaces. They follow the object's transform and do not enter PNG/JPG, GLB or frame exports. Other scene objects are not colliders.

**Simulate & bake motion** starts from the current valid saved frame, including a pose you kept from the playground. Without a valid saved frame it uses the authored starting shape. Bake up to 12 seconds at 24 fps; longer compositions retime that motion. Scrub to choose a frame; **Freeze this cloth frame** makes a still pose. Cancel retains the previous bake. Shape/pin/physics edits require a new bake; finish changes do not.

There is no self-collision, arbitrary scene-object collision, seams, solid fabric thickness or automatic seamless looping. Avoid extreme folds if overlapping fabric is undesirable. Alpha cutouts affect appearance, not the rectangular simulation mesh. Cloth sheets remain excluded from print output.

## Finish and stage

**Fabric & foil response** offers Satin, Chrome, Holo foil and Matte cloth. Refine sheen, metal response, clear gloss, iridescence, film thickness and procedural weave relief. Imported Material normal maps provide their own relief; the weave control is disabled for those surfaces. The main roughness and colour controls remain available. The procedural weave is original and generated locally.

Use **Lighting** to reach the existing product stages and camera controls. Paper gives soft daylight, Leather gives grazing light and Foil gives a reflective studio. They change lighting/camera without moving your objects. Use Frame object and keep an output camera when ready. **Output → Image** exports the scene, with optional transparent PNG; save the editable .jago3d separately.

## Material workflow

Create the artwork/surface in Material → Surface workshop → Export for Workshop. In Workshop choose Add a new sheet or Apply to selected object, then From Material. Colour, normal, roughness and metallic maps are embedded along with the original Material source. Later use Update from Material to replace the maps without replacing geometry, pins, pose/bake, placement, camera or lighting. Save original Material project recovers the source for editing. This is offline file exchange, not a live link. Combined solids do not have artwork UV mapping yet.

## Reference

[Holocloth by Dmitry Kurash](https://github.com/dmitrykurash/holocloth) informed the direct-handle and finish-first workflow. Its MIT source, interaction handling and material/camera organisation were reviewed. Workshop uses its own existing constraint solver and original extensions, Three.js physical materials and an original weave; no Holocloth code, assets or dependencies were incorporated. Macro depth of field, layered decals and cavity shading from that reference remain potential future work, not features of this pass.
