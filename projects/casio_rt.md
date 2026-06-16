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

The first version introduced everything from scratch. Rather than importing a math library, I wrote a `vec3` class with operator overloading (`&` for dot product, `^` for cross product) to keep the ray tracing code readable.

The scene is a closed room of six planes with two reflective spheres at the center. Intersection tests follow the standard analytic solutions for spheres and planes. Color comes from diffuse shading based on the surface normal and the angle to the light source.

The two features that made the renders interesting were soft shadows and multi-bounce reflections. Soft shadows are computed by sampling the light source at multiple random positions within a radius and averaging the results; more samples means softer penumbra, at a proportional cost in render time. Reflections recurse up to a configurable depth; each bounce follows $r = d - 2(d \cdot n)\hat{n}$, re-entering the full intersection and shading pipeline.

Anti-aliasing works by shooting multiple rays per pixel with sub-pixel offsets and averaging the results.

I also added image-mapped planes by reading JPEG pixels directly and mapping them onto the walls using parametric UV coordinates, used to texture the side walls of the room.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/casio_rt/v1_room.webp" alt="v1 final render: colorful room with reflective spheres and image-textured walls">
  <figcaption>v1 final render at retina resolution. Soft shadows (800 rays), 10 reflection bounces, 2× anti-aliasing. Took 28 hours to render.</figcaption>
</figure>

## Version 2: Physically-Based Materials

The second version rebuilt the renderer around a proper material system. Where v1 was exploratory, v2 follows the second book in the series, *Ray Tracing: The Next Week*, more closely, implementing the material abstraction as described.

Three material types replace the single reflectivity parameter from v1:

- **Lambertian**: diffuse scattering. Outgoing rays are directed towards a random point on a unit sphere centered on the surface normal, giving correct cosine-weighted diffuse.
- **Metal**: specular reflection with a controllable fuzz parameter that perturbs the reflected direction by a random vector, interpolating between a mirror and a brushed surface.
- **Dielectric**: glass, using Snell's law for refraction and Schlick's approximation for the Fresnel reflection coefficient. The material randomly chooses between reflection and refraction at each bounce based on the computed probability, producing caustics and transmission at no extra structural cost.

The camera model also changed. Rather than a pinhole, v2 uses a thin-lens model: rays originate from a disk of configurable aperture radius instead of a single point, simulating depth of field. Objects at the focus distance are sharp; geometry closer or farther blurs proportionally to the aperture.

The scene is 256 randomly placed spheres of randomized material type, plus three large spheres in the center (diffuse, glass, and mirror), generated procedurally.

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

The renders above are beautiful but take days. Versions 3 and 4 attacked this with different strategies.

**v3** distributes sub-pixel samples across multiple processes using `concurrent.futures.ProcessPoolExecutor`. Each worker independently renders a full frame for one sub-pixel offset; the results are averaged at the end. On a quad-core machine this cuts render time by roughly 4×, bringing the 26-hour single-threaded scene down to around 7 hours.

**v4** replaced the custom `vec3` class entirely with NumPy arrays and added a `@jit(nopython=True)` decorator from Numba to attempt JIT compilation of the inner loop. The combination of array operations and ahead-of-time compilation was meant to bring render times down to minutes. In practice, Numba's `nopython` mode is incompatible with Pygame's surface operations, so the JIT path required isolating the pixel computation from the display pipeline, a useful exercise in separating compute from I/O.

## On the Calculator

The final step was porting the renderer to a **Casio fx-CG50**, which runs a restricted subset of Python through its built-in interpreter. The constraints are significant: no NumPy, no Pygame, no multiprocessing, and a screen of 384×216 pixels. The `casioplot` module replaces Pygame for drawing individual pixels.

The port strips the renderer back to its v1 core: spheres, planes, a single light, and basic reflection, running at a fraction of the PC resolution. A full frame takes several minutes on the calculator's processor. It works.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/casio_rt/calculator.webp" alt="Ray tracer running on a Casio fx-CG50 calculator, showing a room scene with four colored spheres">
  <figcaption>The v1 scene rendered directly on the Casio fx-CG50. The battery indicator reading 100% is the only sign it just finished computing the whole frame.</figcaption>
</figure>

The calculator render was never going to compete with the 14-hour PC outputs. The point was to have a complete path from first principles, built around a custom `vec3` class inspired by the *Ray Tracing in One Weekend* books, to real hardware with real constraints.
