# Create hero models

Place an optimized `create-hero.glb` here (Draco + WebP via glTF-Transform).

Pipeline: Blender → `.glb` → `@gltf-transform/cli` (dedup, weld, quantize, draco, webp) → this folder.

Until the asset exists, `create-scene.js` renders a procedural icosahedron hero and falls back when WebGL or reduced-motion applies.
