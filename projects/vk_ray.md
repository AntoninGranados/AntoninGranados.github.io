---
title: VkRay
layout: project
image: /assets/imgs/projects/vk_ray_preview.webp
image_position: 30% 28%
subtitle: Interactive Vulkan Path Tracing Engine
pdf: /assets/docs/projects/vk_ray_report.pdf
source_code: https://github.com/AntoninGranados/VkRay/
---

# VkRay: Interactive Vulkan Path Tracing Engine

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/vk_ray/vkray-logo.webp" alt="VkRay 1.0 logo rendered inside the engine">
</figure>

VkRay is a physically based renderer written in C++ with Vulkan, built on my lightweight framework [VkSmol](https://github.com/AntoninGranados/VkSmol). Its path tracer runs entirely in shaders, without Vulkan's ray tracing extensions.

It combines a renderer, a rigid body simulator, mesh processing tools, and an interactive editor, all built around a custom Entity Component System (ECS) that ties transforms, materials, geometry, animation, and physics together.

<div class="rotation-viewer-row" markdown="0">
  <div class="rotation-viewer"
       data-axis="xy"
       data-strip-src="/assets/imgs/strips/dragon/strip_{row}.webp"
       data-strip-rows="48"
       data-strip-frames="12"
       data-x-strips="2"
       data-aspect="976/900"
       data-invert="x"
       data-sensitivity="3"></div>
  <div class="rotation-viewer"
       data-axis="x"
       data-strip-src="/assets/imgs/strips/lucy/strip_{row}.webp"
       data-strip-rows="4"
       data-strip-frames="12"
       data-aspect="768/900"
       data-sensitivity="3"
       data-loop="x"></div>
</div>

<div class="rotation-viewer-row" markdown="0">
  <div class="rotation-viewer"
       data-axis="x"
       data-strip-src="/assets/imgs/strips/glass-dragon/strip_{row}.webp"
       data-strip-rows="4"
       data-strip-frames="12"
       data-aspect="894/900"
       data-invert="x"
       data-sensitivity="3"></div>
  <div class="rotation-viewer"
       data-axis="xy"
       data-strip-src="/assets/imgs/strips/armadillo/strip_{row}.webp"
       data-strip-rows="48"
       data-strip-frames="12"
       data-x-strips="2"
       data-aspect="828/900"
       data-invert="x"
       data-sensitivity="2"></div>
</div>

## Overview

<div class="project-feature-grid" markdown="0">
  <section>
    <h3>Rendering</h3>
    <p>A shader path tracer with HDR accumulation, direct light sampling, MIS, homogeneous volumes, and AOV export. Mesh acceleration uses a CPU-built BVH.</p>
  </section>
  <section>
    <h3>Programmable Shading</h3>
    <p>A small DSL for authoring materials and camera ray generation in GLSL, hot-reloaded at runtime with parameters surfaced automatically in the editor.</p>
  </section>
  <section>
    <h3>Camera</h3>
    <p>Native depth of field and shutter-driven motion blur, paired with a fully programmable lens for custom projections and ray generation.</p>
  </section>
  <section>
    <h3>Editor</h3>
    <p>The ImGui and ImGuizmo interface supports scene editing, keyframe animation, physics baking, material inspection, and shader hot reload.</p>
  </section>
</div>

## Path Tracing

The renderer runs as a fullscreen raster pass that fires one camera ray per pixel and traces light transport iteratively in GLSL. Scene data lives in Shader Storage Buffer Objects: primitives grouped by type, mesh handles pointing to flattened BVH nodes, and a light buffer for importance sampling emissive geometry.

Materials include Lambertian diffuse, emissive, GGX metal, GGX glossy/plastic, dielectric glass, homogeneous volumes, and programmable procedural materials. Microfacet materials use Cook-Torrance shading with GGX visible-normal sampling and Schlick Fresnel. Direct light sampling and BSDF sampling are combined through Multiple Importance Sampling to cut variance around small or bright lights. Volumes use Beer-Lambert transmittance and a Henyey-Greenstein phase function, with direct lighting applied at each scatter point.

An AOV (Arbitrary Output Variable) pass exports camera-space normals, albedo, linear depth, and a sky mask alongside the beauty render, as a single multi-channel EXR. A headless job system drives batches of these renders from JSON files (parameter overrides, sample checkpoints, per-checkpoint AOVs), which is how the mesh-simplification and denoising test datasets get generated without touching the editor.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/vk_ray/materials/render-1.webp" alt="VkRay render showing a grid of glossy, metallic, and diffuse green spheres">
  <figcaption>Material sweep rendered in VkRay, showing diffuse, glossy, and metallic responses under the same lighting.</figcaption>
</figure>

<div class="project-media-grid two" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/vk_ray/materials/material1.webp" alt="VkRay material test scene with several spheres">
    <figcaption>Material response comparison.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/materials/material2.webp" alt="VkRay second material test scene">
    <figcaption>Roughness and reflection variation.</figcaption>
  </figure>
</div>

## Programmable Materials

Beyond the built-in BSDFs, materials can be authored as standalone GLSL files and attached to any object through a `Programmable` component. A material file declares typed parameters with `#param` directives (`int`, `float`, `vec3: color`, with optional bounds), then builds its surface response in `main()` using the same BSDF constructors as the built-in materials, like `Diffuse(albedo)`. Saving the file hot-reloads it: the shader recompiles, the pipeline rebuilds in place, and the new parameters appear in the editor automatically, with no engine restart and no manual UI wiring. It reuses the same field system that drives ECS components, so a material author only ever writes the shader.

<figure class="video-container project-wide-video">
  <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="/assets/videos/vk_ray/programmable-material.mp4" type="video/mp4">
  </video>
  <figcaption>Writing a Voronoi-cracked, dirt-streaked brick material from scratch: parameters are added live and the viewport hot-reloads on every save. Click to expand and scrub.</figcaption>
</figure>

<div class="project-media-grid three" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/vk_ray/materials/dragon-gold.webp" alt="Stanford Dragon rendered with a procedural marble-and-gold-vein programmable material">
    <figcaption>Marble with procedural gold veining.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/materials/dragon-glass.webp" alt="Stanford Dragon rendered with a jade-green glass programmable material">
    <figcaption>Jade-glass dielectric variant.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/materials/dragon-marble.webp" alt="Stanford Dragon rendered with a white marble programmable material">
    <figcaption>Plain marble, same underlying shader.</figcaption>
  </figure>
</div>

## Camera

Depth of field and motion blur are native to the `Camera` component. An `f_stop` and `focal_distance` (or a `focus_target` entity) drive physically based depth of field, and the aperture shape can be swapped for a polygon or an image mask (heart, star, cat-eye, ring, or custom), so out-of-focus highlights take that shape instead of a plain disc.

`shutter_speed` drives motion blur through stochastic temporal sampling with a centered shutter: each sample draws a random time within the exposure window and interpolates scene transforms to that instant, instead of blurring the final image as a post effect.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/vk_ray/lens/motion-blur.webp" alt="Police car chase render with strong directional motion blur">
  <figcaption>Shutter-driven motion blur on a chase scene.</figcaption>
</figure>

<div class="project-media-grid four" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/vk_ray/lens/bokeh-heart.webp" alt="Campfire scene with heart-shaped bokeh highlights">
    <figcaption>Heart aperture mask.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/lens/bokeh-star.webp" alt="Campfire scene with star-shaped bokeh highlights">
    <figcaption>Star aperture mask.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/lens/bokeh-cateye.webp" alt="Campfire scene with cat-eye-shaped bokeh highlights">
    <figcaption>Cat-eye aperture mask.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/lens/bokeh-ring.webp" alt="Campfire scene with ring-shaped bokeh highlights">
    <figcaption>Ring aperture mask.</figcaption>
  </figure>
</div>

### Programmable Lens

The lens itself, in contrast, has no native implementation. The same DSL used for materials extends to ray generation: a camera file declares parameters just like a material, but its `main()` returns a ray (an origin and direction per pixel) instead of a BSDF sample, and hot-reloads the same way. Even bundled lenses like the tilt-shift (Scheimpflug) one are ordinary scripts on top of this DSL. Orthographic projections, fisheye and other wide-angle mappings, a tilted focal plane, or a lens's field-dependent aberrations all become a few lines of GLSL instead of new engine code.

Swapping the projection changes how the camera relates to the scene, not just how it looks. An orthographic camera emits parallel rays, so dollying into a mesh doesn't converge toward it: it slices through the surface and flips to show the inside, like a moving cross-section. A fisheye camera instead spreads the view direction across an extreme field of view, for a hemispherical, barrel-distorted look.

<div class="project-media-grid two" markdown="0">
  <figure class="video-container">
    <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
      <source src="/assets/videos/vk_ray/xray.mp4" type="video/mp4">
    </video>
    <figcaption>Orthographic camera dollying straight through the Dragon mesh.</figcaption>
  </figure>
  <figure class="video-container">
    <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
      <source src="/assets/videos/vk_ray/zoom.mp4" type="video/mp4">
    </video>
    <figcaption>Fisheye camera orbiting a mesh with an extreme field of view.</figcaption>
  </figure>
</div>

Custom ray generation also reaches further than the aperture masks above: a Petzval camera reproduces the field curvature and swirly, cat's-eye edge bokeh of early portrait lenses just from how it samples the lens per pixel, instead of compositing a fixed image mask over a disc.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/vk_ray/rays/petzval-bunny.webp" alt="Glass bunny rendered with a Petzval-lens camera, showing swirly edge bokeh">
  <figcaption>Petzval-lens camera: swirly, field-curved bokeh from custom ray sampling, not an aperture mask.</figcaption>
</figure>

## Simulation and Animation

The simulation system is scheduled through the ECS and updates transform and rigid body components. Physics is computed offline with a fixed timestep of `1e-4` seconds, then stored as snapshots per animation frame. This makes playback deterministic and avoids re-simulating when scrubbing through the timeline.

Collisions are impulse-based. Planes, spheres, and boxes are supported as colliders, while rigid bodies store mass, inertia, linear momentum, and angular momentum. Boxes are sampled on their surface for contacts; spheres use a Fibonacci distribution.

Keyframe animation runs on the same field system as the programmable materials. Any numeric field on a component or material can hold a typed `Track` of keyframes, with six interpolation modes (linear, step, cubic, ease-in, ease-out, ease-in-out). An `AnimationStore` maps `(entity, component, field)` and `(material, field)` pairs to tracks, and a single `evaluate()` call applies all of them per frame. That means transforms, physics parameters, and shader parameters can all be keyframed from the same timeline.

<div class="project-media-grid two" markdown="0">
  <figure class="video-container">
    <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
      <source src="/assets/videos/vk_ray/ball-ramp.mp4" type="video/mp4">
    </video>
    <figcaption>Baked sphere simulation running through ramps and blockers.</figcaption>
  </figure>
  <figure class="video-container">
    <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
      <source src="/assets/videos/vk_ray/pyramid.mp4" type="video/mp4">
    </video>
    <figcaption>A sphere collider breaking through a pyramid of rigid boxes.</figcaption>
  </figure>
</div>

## Meshes and Acceleration

Meshes are imported from OBJ files and converted into internal vertex and index buffers. Because the ray tracer is implemented manually, acceleration structures are also explicit: each mesh builds a CPU-side BVH with median splits over triangle centroids, then uploads a flattened node array to the GPU for iterative GLSL traversal.

VkRay also includes Quadric Error Metrics mesh simplification. The simplifier collapses low-cost edges, removes degenerate faces, remaps indices, and rebuilds the mesh before upload. The simplification ratio is exposed in the editor and can be adjusted interactively on meshes of moderate complexity.

<figure class="video-container project-wide-video">
  <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="/assets/videos/vk_ray/lucy-low-res.mp4" type="video/mp4">
  </video>
  <figcaption>Low-resolution Stanford Lucy render used to validate mesh simplification, BVH traversal, and material editing.</figcaption>
</figure>

<div class="project-media-grid two" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/vk_ray/meshes/dragon1.webp" alt="Stanford Dragon rendered in VkRay">
    <figcaption>High-detail mesh rendering.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/meshes/sponza.webp" alt="Sponza scene rendered in VkRay">
    <figcaption>Sponza stress test for mesh traversal.</figcaption>
  </figure>
</div>

## Editor

The application is an editor, not just an offline renderer. Objects can be selected with CPU raycasts against scene geometry, then transformed with gizmos. The side panels expose entities, materials, mesh assets, path tracer settings, lighting modes, and physics baking controls. A command panel handles shader hot reloads, single frame rendering, animation rendering, and debugging commands.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/vk_ray/editor/editor.webp" alt="VkRay editor interface with a selected Dragon mesh, its transform and material inspector, renderer settings, and a debug view">
  <figcaption>Editor in its Dracula theme: selection gizmo, transform/mesh/material inspector, renderer and AOV settings, a debug view, and the keyframe animation timeline along the bottom.</figcaption>
</figure>

## Report

For implementation details, including the simulation solver, GPU packing, QEM simplification, BVH construction, path tracing loop, material BSDFs, MIS, denoising, ECS architecture, and future work, the full report is embedded below.

<div class="pdf-embed" markdown="0">
  <object data="/assets/docs/projects/vk_ray_report.pdf" type="application/pdf">
    <p>Your browser doesn't support embedded PDFs.
    <a href="/assets/docs/projects/vk_ray_report.pdf">Download the PDF report</a> instead.</p>
  </object>
</div>
