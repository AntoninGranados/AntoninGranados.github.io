---
title: VkRay
layout: project
image: /assets/imgs/projects/vk_ray_preview.webp
image_position: 30% 28%
subtitle: Interactive Vulkan Path Tracing Engine
---

# VkRay: Interactive Vulkan Path Tracing Engine

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/vk_ray/vkray-logo.webp" alt="VkRay 1.0 logo rendered inside the engine">
</figure>

VkRay is a physically based rendering application written in C++ with Vulkan. It is built on top of my lightweight Vulkan framework, [VkSmol](https://github.com/AntoninGranados/VkSmol), and implements its path tracing pipeline in shaders instead of relying on Vulkan ray tracing extensions.

The project combines a renderer, a small rigid body simulation system, mesh processing tools, and an interactive editor. The common data model is a custom Entity Component System (ECS), which keeps transforms, materials, geometry, animation, physics, and GPU packing connected without coupling every subsystem directly.

<div class="project-link-row" markdown="0">
  <a href="https://github.com/AntoninGranados/VkRay/" target="_blank" rel="noopener">Source code</a>
  <a href="/assets/docs/projects/vk_ray_report.pdf" target="_blank" rel="noopener">Technical report</a>
</div>

## Overview

<div class="project-feature-grid" markdown="0">
  <section>
    <h3>Simulation</h3>
    <p>Rigid bodies are baked with a fixed internal timestep, then cached per animation frame for deterministic playback and scrubbing.</p>
  </section>
  <section>
    <h3>Geometry</h3>
    <p>OBJ meshes, primitives, materials, lights, and BVH nodes are packed explicitly into GPU buffers consumed by GLSL shaders.</p>
  </section>
  <section>
    <h3>Rendering</h3>
    <p>The renderer is a shader path tracer with HDR accumulation, physically based materials, direct light sampling, MIS, denoising, and post effects.</p>
  </section>
  <section>
    <h3>Editor</h3>
    <p>The ImGui and ImGuizmo interface supports scene editing, object selection, material control, camera tools, shader reload, baking, and export commands.</p>
  </section>
</div>

## Path Tracing

The renderer runs as a fullscreen raster pass that generates one camera ray per pixel and iteratively traces light transport in GLSL. Scene data is stored in Shader Storage Buffer Objects: analytic primitives are grouped by type, mesh handles reference flattened BVH nodes, and a separate light buffer supports importance sampling of emissive geometry.

Materials include Lambertian diffuse, emissive surfaces, GGX metal, GGX glossy/plastic, dielectric glass, and programmable procedural materials. The microfacet materials use Cook-Torrance shading, GGX visible-normal sampling, and Schlick Fresnel. Direct light sampling is combined with BSDF sampling through Multiple Importance Sampling to reduce variance around bright or small light sources.

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

## Simulation and Animation

The simulation system is scheduled through the ECS and updates transform and rigid body components. Physics is computed offline with a fixed timestep of `1e-4` seconds, then stored as snapshots per animation frame. This makes playback deterministic and avoids re-simulating when scrubbing through the timeline.

Collisions are impulse-based. Planes, spheres, and boxes are supported as colliders, while rigid bodies store mass, inertia, linear momentum, and angular momentum. Boxes are sampled on their surface for contacts; spheres use a Fibonacci distribution.

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

## Lucy Interactive Viewer

<div class="lucy-viewer" id="lucy-viewer" markdown="0">
  <video id="lucy-rot-video" data-lightbox="rotation" src="/assets/videos/vk_ray/lucy.mp4" muted playsinline preload="auto" disablepictureinpicture></video>
  <div class="lucy-hint" id="lucy-hint" aria-hidden="true">
    <svg width="40" height="16" viewBox="0 0 40 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8H36M4 8L9 3M4 8L9 13M36 8L31 3M36 8L31 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Drag to rotate</span>
  </div>
</div>

<style>
.lucy-viewer {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: ew-resize;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  max-width: min(420px, 100%);
  margin: 0 auto;
}
.lucy-viewer video {
  width: 100%;
  display: block;
  pointer-events: none;
  margin: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
.lucy-hint {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  pointer-events: none;
  white-space: nowrap;
  transition: opacity 0.4s ease;
}
.lucy-viewer.interacted .lucy-hint {
  opacity: 0;
}
</style>

<script>
(function () {
  var viewer = document.getElementById('lucy-viewer');
  var video  = document.getElementById('lucy-rot-video');
  if (!viewer || !video) return;

  var dragging = false;
  var lastX    = 0;
  var startX   = 0;
  var moved    = false;

  video.addEventListener('loadedmetadata', function () {
    video.currentTime = video.duration / 2;
  });

  function seekByDelta(dx) {
    var sensitivity = video.duration / viewer.offsetWidth;
    video.currentTime = Math.max(0, Math.min(video.duration,
      video.currentTime + dx * sensitivity));
  }

  function onStart(x) {
    dragging = true;
    moved = false;
    startX = lastX = x;
    document.body.classList.add('rot-dragging');
  }
  function onMove(x) {
    if (!dragging) return;
    if (Math.abs(x - startX) > 4) moved = true;
    seekByDelta(x - lastX);
    lastX = x;
  }
  function onEnd() {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('rot-dragging');
    if (!moved) {
      video.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    } else {
      viewer.classList.add('interacted');
    }
  }

  viewer.addEventListener('mousedown', function (e) { e.preventDefault(); onStart(e.clientX); });
  window.addEventListener('mousemove', function (e) { onMove(e.clientX); });
  window.addEventListener('mouseup', onEnd);

  viewer.addEventListener('touchstart', function (e) { e.preventDefault(); onStart(e.touches[0].clientX); }, { passive: false });
  window.addEventListener('touchmove',  function (e) { if (dragging) { e.preventDefault(); onMove(e.touches[0].clientX); } }, { passive: false });
  window.addEventListener('touchend', onEnd);
})();
</script>

## Editor

The application is an editor, not just an offline renderer. Objects can be selected with CPU raycasts against scene geometry, then transformed with gizmos. The side panels expose entities, materials, mesh assets, path tracer settings, lighting modes, and physics baking controls. A command panel handles shader hot reloads, single frame rendering, animation rendering, and debugging commands.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/vk_ray/ui.webp" alt="VkRay editor interface with selected Lucy mesh, material controls, and path tracing settings">
  <figcaption>Interactive VkRay editor with ECS panels, material controls, selection outlines, gizmos, and physics baking timeline.</figcaption>
</figure>

## Report

For implementation details, including the simulation solver, GPU packing, QEM simplification, BVH construction, path tracing loop, material BSDFs, MIS, denoising, ECS architecture, and future work, the full report is embedded below.

<div class="pdf-embed" markdown="0">
  <object data="/assets/docs/projects/vk_ray_report.pdf" type="application/pdf">
    <p>Your browser doesn't support embedded PDFs.
    <a href="/assets/docs/projects/vk_ray_report.pdf">Download the PDF report</a> instead.</p>
  </object>
</div>
