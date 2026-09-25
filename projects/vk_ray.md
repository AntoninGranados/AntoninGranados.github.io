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

VkRay is a physically based rendering application written in C++ with Vulkan. It is built on top of my lightweight Vulkan framework, [VkSmol](https://github.com/AntoninGranados/VkSmol), and implements its path tracing pipeline in shaders instead of relying on Vulkan ray tracing extensions.

The project combines a renderer, a small rigid body simulation system, mesh processing tools, and an interactive editor. The common data model is a custom Entity Component System (ECS), which keeps transforms, materials, geometry, animation, physics, and GPU packing connected without coupling every subsystem directly.

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
    <p>A shader path tracer with HDR accumulation, direct light sampling, MIS, homogeneous volumes, and AOV export, backed by an explicit CPU-built BVH for mesh acceleration.</p>
  </section>
  <section>
    <h3>Programmable Materials</h3>
    <p>Custom BSDFs written in GLSL, hot-reloaded at runtime with their parameters automatically surfaced in the editor's inspector.</p>
  </section>
  <section>
    <h3>Camera &amp; Lens</h3>
    <p>Depth of field with custom aperture shapes, shutter-driven motion blur, and a tilt-shift lens with Scheimpflug focus control.</p>
  </section>
  <section>
    <h3>Editor</h3>
    <p>The ImGui and ImGuizmo interface supports scene editing, keyframe animation, physics baking, material inspection, and shader hot reload.</p>
  </section>
</div>

## Path Tracing

The renderer runs as a fullscreen raster pass that generates one camera ray per pixel and iteratively traces light transport in GLSL. Scene data is stored in Shader Storage Buffer Objects: analytic primitives are grouped by type, mesh handles reference flattened BVH nodes, and a separate light buffer supports importance sampling of emissive geometry.

Materials include Lambertian diffuse, emissive surfaces, GGX metal, GGX glossy/plastic, dielectric glass, homogeneous participating media, and programmable procedural materials. The microfacet materials use Cook-Torrance shading, GGX visible-normal sampling, and Schlick Fresnel. Direct light sampling is combined with BSDF sampling through Multiple Importance Sampling to reduce variance around bright or small light sources. Volumes are sampled with Beer-Lambert transmittance and a Henyey-Greenstein phase function, with next event estimation at scatter points so the medium receives direct lighting instead of only forward-scattered radiance.

An AOV (Arbitrary Output Variable) pass exports camera-space normals, albedo, linear depth, and a sky mask alongside the beauty render as a single multi-channel EXR. A headless job system drives batches of these renders from declarative JSON files — parameter overrides, multiple sample checkpoints, and per-checkpoint AOV control — which is how the mesh-simplification and denoising test datasets are generated without touching the editor.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/vk_ray/render-1.webp" alt="VkRay render showing a grid of glossy, metallic, and diffuse green spheres">
  <figcaption>Material sweep rendered in VkRay, showing diffuse, glossy, and metallic responses under the same lighting.</figcaption>
</figure>

<div class="project-media-grid two" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/vk_ray/material1.webp" alt="VkRay material test scene with several spheres">
    <figcaption>Material response comparison.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/material2.webp" alt="VkRay second material test scene">
    <figcaption>Roughness and reflection variation.</figcaption>
  </figure>
</div>

## Programmable Materials

Beyond the built-in BSDFs, materials can be authored as standalone GLSL files and attached to any object through a `Programmable` component. A material file declares its own typed, constrained parameters with `#param` directives (`int`, `float`, `vec3: color`, with optional `min()`/`max()` bounds), and composes the surface response in `main()` from the same BSDF constructors the built-in materials use — `Diffuse(albedo)`, and so on. Saving the file triggers a hot reload: the shader is recompiled, the pipeline is rebuilt in place, and the new parameters are surfaced automatically in the editor's inspector — no engine restart, no manually wiring UI widgets. This reuses the declarative field/metadata system that also drives ECS components and render parameters, so a material author only ever writes the shader.

<figure class="video-container project-wide-video">
  <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="/assets/videos/vk_ray/programmable-material.mp4" type="video/mp4">
  </video>
  <figcaption>Writing a Voronoi-cracked, dirt-streaked brick material from scratch: parameters are added live and the viewport hot-reloads on every save. Click to expand and scrub.</figcaption>
</figure>

<div class="project-media-grid three" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/vk_ray/dragon-gold.webp" alt="Stanford Dragon rendered with a procedural marble-and-gold-vein programmable material">
    <figcaption>Marble with procedural gold veining.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/dragon-glass.webp" alt="Stanford Dragon rendered with a jade-green glass programmable material">
    <figcaption>Jade-glass dielectric variant.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/dragon-marble.webp" alt="Stanford Dragon rendered with a white marble programmable material">
    <figcaption>Plain marble, same underlying shader.</figcaption>
  </figure>
</div>

## Camera & Lens

The `Camera` entity carries a stack of optional lens components instead of a single hard-coded projection. A `ThinLensCamera` adds physically based depth of field from an `aperture` and `focus_depth`; the aperture itself can be replaced with an image mask (heart, star, cat-eye, ring, or any custom shape) so out-of-focus highlights take that shape instead of a plain disc. `shutter_speed` on the `Camera` drives motion blur through stochastic temporal sampling with a centered shutter: each sample draws a random time within the exposure window and interpolates scene transforms to that instant, rather than blurring the final image as a post effect.

A `TiltShiftLens` goes further and tilts the focal plane itself using the Scheimpflug principle, driven by `plane_position` and `plane_rotation` fields with a dedicated viewport gizmo and an optional focus-plane overlay for direct manipulation — the same miniature-effect / selective-focus control view cameras use.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/vk_ray/motion-blur.webp" alt="Police car chase render with strong directional motion blur">
  <figcaption>Shutter-driven motion blur on a chase scene.</figcaption>
</figure>

<div class="project-media-grid four" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/vk_ray/bokeh-heart.webp" alt="Campfire scene with heart-shaped bokeh highlights">
    <figcaption>Heart aperture mask.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/bokeh-star.webp" alt="Campfire scene with star-shaped bokeh highlights">
    <figcaption>Star aperture mask.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/bokeh-cateye.webp" alt="Campfire scene with cat-eye-shaped bokeh highlights">
    <figcaption>Cat-eye aperture mask.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/bokeh-ring.webp" alt="Campfire scene with ring-shaped bokeh highlights">
    <figcaption>Ring aperture mask.</figcaption>
  </figure>
</div>

## Simulation and Animation

The simulation system is scheduled through the ECS and updates transform and rigid body components. Physics is computed offline with a fixed timestep of `1e-4` seconds, then stored as snapshots per animation frame. This makes playback deterministic and avoids re-simulating when scrubbing through the timeline.

Collisions are impulse-based. Planes, spheres, and boxes are supported as colliders, while rigid bodies store mass, inertia, linear momentum, and angular momentum. Boxes are sampled on their surface for contacts; spheres use a Fibonacci distribution.

Keyframe animation runs on the same field system as the programmable materials: any numeric field on a component or material can hold a typed `Track` of keyframes, with six interpolation modes (linear, step, cubic, ease-in, ease-out, ease-in-out). An `AnimationStore` maps `(entity, component, field)` and `(material, field)` pairs to tracks, and a single `evaluate()` call applies all of them per frame — so transforms, physics parameters, and shader parameters can all be keyframed from the same timeline.

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
    <img src="/assets/imgs/projects/vk_ray/dragon1.webp" alt="Stanford Dragon rendered in VkRay">
    <figcaption>High-detail mesh rendering.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/vk_ray/sponza.webp" alt="Sponza scene rendered in VkRay">
    <figcaption>Sponza stress test for mesh traversal.</figcaption>
  </figure>
</div>

## Editor

The application is an editor, not just an offline renderer. Objects can be selected with CPU raycasts against scene geometry, then transformed with gizmos. The side panels expose entities, materials, mesh assets, path tracer settings, lighting modes, and physics baking controls. A command panel handles shader hot reloads, single frame rendering, animation rendering, and debugging commands.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/vk_ray/editor.webp" alt="VkRay editor interface with a selected object, its Programmable material component, and the keyframe animation timeline">
  <figcaption>Editor in its Dracula theme: entity/material panels, a Programmable material component, renderer settings, and the keyframe animation timeline along the bottom.</figcaption>
</figure>

## Report

For implementation details, including the simulation solver, GPU packing, QEM simplification, BVH construction, path tracing loop, material BSDFs, MIS, denoising, ECS architecture, and future work, the full report is embedded below.

<div class="pdf-embed" markdown="0">
  <object data="/assets/docs/projects/vk_ray_report.pdf" type="application/pdf">
    <p>Your browser doesn't support embedded PDFs.
    <a href="/assets/docs/projects/vk_ray_report.pdf">Download the PDF report</a> instead.</p>
  </object>
</div>
