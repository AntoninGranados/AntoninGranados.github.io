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
<img src="/assets/imgs/projects/vk_ray/material1.png" alt="Material Test 1" style="width: 90%; height: auto;">
<img src="/assets/imgs/projects/vk_ray/material2.png" alt="Material Test 2" style="width: 90%; height: auto;">
<img src="/assets/imgs/projects/vk_ray/cornell2.png" alt="Cornell Box 2" style="width: 90%; height: auto;">
