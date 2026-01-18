---
title: VkRay
layout: project
---

# VkRay: a Vulkan Raytracer

Custom path tracer built directly on Vulkan (no ray-tracing extensions), with an in-app scene editor using ImGui + ImGuizmo.

## The User Interface
<img src="/assets/imgs/projects/vk_ray/ui.png" alt="User Interface" width="90%">

## What it does
- Progressive path tracer running entirely on fragment shaders; two floating-point render targets ping-pong to accumulate samples frame after frame.
- Interactive scene editing: add/select spheres, planes, and boxes; move/rotate/scale them with gizmos.
- Material system: lambertian, metal (with fuzz), dielectric glass, emissive lights.
- Lighting: emissive geometry and configurable skylight presets (Day / Sunset / Night / Empty).
- Built-in console/notification window with commands (`clear`, `help`, `reload` shaders, toggle `render`-only, `exit`).

## How it works
- Scene data is packed into storage buffers (per-primitive buffers + an indirection/object buffer for selection) and consumed by the fragment shader for ray/primitive intersections.
- A small Vulkan engine (`VkSmol`) handles descriptor set updates, dynamic rendering, and shader hot-reload .
- The renderer keeps two RGBA32F images: one is read as the previous accumulation while the other is written, then they swap each frame.
- Camera uses a fly setup (right-click to unlock look; WASD + Space/Shift to move; scroll to change FOV). Any movement or UI change bumps the frame counter back to zero to keep accumulation clean.

## Demos
### Material experiments
Different surface responses, same lighting. These tests focus on roughness, metalness, and glass to verify energy conservation and bounce behavior.
<div style="display: flex; gap: 12px; flex-wrap: nowrap;">
  <img src="/assets/imgs/projects/vk_ray/material1.png" alt="Material Test 1" style="width: 49%; height: auto;">
  <img src="/assets/imgs/projects/vk_ray/material2.png" alt="Material Test 2" style="width: 49%; height: auto;">
</div>

### Suzanne material variations
The classic Suzanne model pushed through multiple shader setups to compare shading models and accumulation behavior side by side.
<div style="display: flex; flex-wrap: nowrap; gap: 12px;">
  <img src="/assets/imgs/projects/vk_ray/suzanne1.png" alt="Suzanne 1" style="width: 32%; height: auto;">
  <img src="/assets/imgs/projects/vk_ray/suzanne2.png" alt="Suzanne 2" style="width: 32%; height: auto;">
  <img src="/assets/imgs/projects/vk_ray/suzanne3.png" alt="Suzanne 3" style="width: 32%; height: auto;">
</div>

### Cornell box lighting study
A compact scene used to sanity-check indirect lighting, color bleed, and emissive contribution.
<div style="display: flex; flex-wrap: nowrap; gap: 12px;">
  <img src="/assets/imgs/projects/vk_ray/cornell1.png" alt="Cornell 1" style="width: 49%; height: auto;">
  <img src="/assets/imgs/projects/vk_ray/cornell2.png" alt="Cornell 2" style="width: 49%; height: auto;">
</div>

### Stanford dragon scan
The iconic Stanford 3D scan dragon sculpture, rendered to check fine detail, silhouette stability, and sampling noise.
<div style="display: flex; flex-wrap: nowrap; gap: 12px;">
  <img src="/assets/imgs/projects/vk_ray/dragon1.png" alt="Dragon 1" style="width: 49%; height: auto;">
  <img src="/assets/imgs/projects/vk_ray/dragon2.png" alt="Dragon 2" style="width: 49%; height: auto;">
</div>

### Sponza stress test (BVH)
Heavy geometry, lots of bounces. This scene validates BVH traversal performance and robustness under real-world mesh complexity.
<img src="/assets/imgs/projects/vk_ray/sponza.png" alt="Sponza" style="width: 90%; height: auto;">
