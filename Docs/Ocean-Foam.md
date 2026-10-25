# Ocean foam refinement

Development preview · shared environment 0.2.0

Pulse and Workshop now use crest/curvature-led foam with analytic residue, irregular rounded pores and softer distance detail. Coverage, patch size and residue are separate controls beside the ocean settings. Flat water produces no foam; chrome also responds to foam coverage.

Pulse: start with Water / Sunset swell, or open the water controls in the visual lab. Workshop: enable Water & atmosphere in Light & camera. Existing scene colours remain authored independently.

The residue is computed from lagged periodic wave samples, not a history buffer, so seeking and loop return remain repeatable. It is a stylised open-ocean treatment, not simulated fluid foam, shoreline surf, wakes or object interaction. Ray intersections at grazing angles were regularised to reduce fragmentation; this remains an approximate analytic renderer.
