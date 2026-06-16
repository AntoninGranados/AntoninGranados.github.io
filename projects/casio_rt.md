---
title: Python Ray Tracer
layout: project
image: /assets/imgs/projects/casio_rt_preview.webp
image_position: 50% 45%
subtitle: A Path Tracer Built from Scratch in Python, Ported to a Casio Calculator
---

# Python Ray Tracer

A physically-based renderer written entirely from scratch in Python, built iteratively over the summer of 2022 and eventually squeezed onto a Casio calculator.

The project went through four successive versions, each tackling a different limitation: visual quality first, then materials, then render time. The core ideas follow Peter Shirley's [*Ray Tracing in One Weekend*](https://raytracing.github.io/) series, re-implemented from the ground up rather than ported from the C++ originals.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/casio_rt/v2_hd.webp" alt="Final v2 render: 256 spheres with diffuse, metallic and glass materials, 14-hour multi-process render">
  <figcaption>Final render from v2: 256 randomly placed spheres with physically-based materials. Multi-process, full HD, 14 hours of compute.</figcaption>
</figure>

## Version 1: Building the Foundations

The first version built everything from scratch: a custom `vec3` class, intersection tests for spheres and planes, and diffuse shading from a single light source.

The two features that made the renders interesting were soft shadows and multi-bounce reflections. Soft shadows sample the light at multiple random positions and average the results. Reflections recurse up to a configurable depth, re-entering the full shading pipeline at each bounce. Anti-aliasing works by averaging multiple rays per pixel with sub-pixel offsets.

I also added image-mapped textures on the walls using UV coordinates, giving the scene more visual depth.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/casio_rt/v1_room.webp" alt="v1 final render: colorful room with reflective spheres and image-textured walls">
  <figcaption>v1 final render at retina resolution. Soft shadows, 10 reflection bounces, 2x anti-aliasing. Took 28 hours to render.</figcaption>
</figure>

## Version 2: Physically-Based Materials

The second version rebuilt the renderer around a proper material system with three types:

- **Lambertian**: diffuse scattering with correct cosine-weighted distribution.
- **Metal**: specular reflection with a fuzz parameter that interpolates between a mirror and a brushed surface.
- **Dielectric**: glass, with refraction and Fresnel reflection computed per bounce.

The camera model also changed to a thin-lens design, simulating depth of field: objects at the focus distance are sharp, and geometry closer or farther blurs proportionally to the aperture.

<div class="project-media-grid two" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/casio_rt/v2_materials.webp" alt="v2 early test: glass, diffuse and metal spheres on a ground plane">
    <figcaption>Early v2 test showing the three material types: dielectric glass (left), Lambertian diffuse (center), metal (right).</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/casio_rt/v2_scene.webp" alt="v2 random scene with hundreds of spheres, 26-hour render">
    <figcaption>Full random scene, single-threaded, 26 hours of render time.</figcaption>
  </figure>
</div>

## Versions 3 & 4: Chasing Performance

The renders above are beautiful but take days. Versions 3 and 4 attacked this from two angles.

**v3** distributes work across multiple processes: each worker renders one sub-pixel offset independently, and the results are averaged at the end. On a quad-core machine this cuts render time by roughly 4x, bringing the 26-hour scene down to around 7 hours.

**v4** replaced the custom `vec3` class with NumPy arrays and added JIT compilation via Numba to bring render times down to minutes. The main challenge was that the JIT path required isolating pixel computation from the display pipeline, since Numba is incompatible with Pygame's surface operations.

## On the Calculator

The final step was porting the renderer to a **Casio fx-CG50**, which runs a restricted subset of Python through its built-in interpreter. The constraints are significant: no NumPy, no multiprocessing, and a 384x216 pixel screen.

The port strips the renderer back to its v1 core: spheres, planes, a single light, and basic reflection. A full frame takes several minutes on the calculator's processor.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/casio_rt/calculator.webp" alt="Ray tracer running on a Casio fx-CG50 calculator, showing a room scene with four colored spheres">
  <figcaption>The v1 scene rendered directly on the Casio fx-CG50. The battery indicator reading 100% is the only sign it just finished computing the whole frame.</figcaption>
</figure>

The point was never to compete with the 14-hour PC outputs. It was to take a project from first principles all the way to real hardware with real constraints.
