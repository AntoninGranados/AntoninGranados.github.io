---
title: Smoke on the GPU
layout: project
image: /assets/imgs/projects/gpu_smoke_preview.webp
image_position: 68% 50%
subtitle: Volumetric Smoke Simulation and Rendering in Godot with Lattice-Boltzmann and Ray Marching
---

# 3D Smoke Simulation and Rendering in Godot

This project implements an interactive volumetric smoke pipeline inside Godot. The simulation, scene voxelization, and rendering stages all run on the GPU through Godot's Vulkan-backed `RenderingDevice` API.

The smoke is represented as a 3D voxel grid and simulated with the Lattice-Boltzmann Method (LBM). The same volume data is then rendered with ray marching inside a bounding box, which keeps the fragment shader focused on the screen region where smoke can actually appear.

<div class="project-link-row" markdown="0">
  <a href="/assets/docs/projects/gpu_smoke_report.pdf" target="_blank" rel="noopener">Technical report</a>
</div>

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/gpu_smoke/dragon.webp" alt="Smoke emitted from a dragon model in a bamboo scene">
  <figcaption>Smoke emitted from the Stanford Dragon's mouth, with collision handled inside the dragon mesh.</figcaption>
</figure>

## Pipeline

<div class="project-feature-grid" markdown="0">
  <section>
    <h3>Voxelization</h3>
    <p>Godot meshes are converted into a 3D texture marking empty voxels, colliders, sources, and source velocities.</p>
  </section>
  <section>
    <h3>Simulation</h3>
    <p>A D3Q27 LBM solver updates air and smoke distributions in compute shaders using 3D textures and SSBO fields.</p>
  </section>
  <section>
    <h3>Rendering</h3>
    <p>A fragment shader ray marches the smoke volume, integrating density, light transmittance, and volumetric scattering.</p>
  </section>
  <section>
    <h3>Godot</h3>
    <p>The pipeline runs in-engine, with compute stages on the physics thread and rendering on the main thread.</p>
  </section>
</div>

## Voxelization

The first compute stage converts the scene into a voxel grid so that smoke can interact with meshes. Vertices, indices, object metadata, and precomputed bounding boxes are stored in GPU buffers. Each object is dispatched with push constants containing its transform, linear velocity, angular velocity, object index, and type.

For each voxel inside an object's transformed bounding box, the shader casts a ray from the voxel center and counts triangle intersections with the Moller-Trumbore algorithm. An odd intersection count marks the voxel as inside the mesh. The RGB channels store object velocity and the alpha channel stores the voxel type: empty, collider, or smoke source.

<div class="project-media-grid two" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/gpu_smoke/man.webp" alt="Human-shaped blue smoke source on a black background">
    <figcaption>Human-shaped source used to test mesh voxelization and source fields.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/gpu_smoke/plane.webp" alt="Large cloud-like smoke plume in a blue sky scene">
    <figcaption>Cloud-like plume rendered in a larger outdoor scene.</figcaption>
  </figure>
</div>

## Simulation

The solver uses the Lattice-Boltzmann Method because it maps well to the GPU: every voxel can be updated from the previous state with local operations. The implementation uses the D3Q27 stencil, with 27 discrete directions per voxel. Air and smoke distributions are stored mostly in SSBOs because several simulation fields need more than four channels.

Voxel types from the voxelization stage define boundary behavior. Collider voxels use bounce-back conditions, source voxels inject density and velocity, and free-space voxels run the normal collision and streaming steps. Periodic boundary conditions are used when streaming reaches the edge of the simulation domain.

<div class="project-media-grid two" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/gpu_smoke/bars.webp" alt="Smoke interacting with two rectangular bars">
    <figcaption>Smoke moving around two rectangular colliders.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/gpu_smoke/colliding.webp" alt="Two colored smoke plumes colliding around a point light">
    <figcaption>Two plumes colliding with point light interaction.</figcaption>
  </figure>
</div>

## Rendering

Rendering is done by ray marching through the smoke volume from the fragment shader attached to the volume's bounding box. Density is sampled along the camera ray to compute transmittance with Beer-Lambert law. A second march toward the light estimates how much illumination reaches each sample, and a Henyey-Greenstein-inspired phase function shapes the scattering response.

The renderer also uses the voxelized scene for shadowing. If a light ray hits a collider voxel, the march stops, producing simple but useful smoke-object shadows. To reduce visible banding from fixed ray steps, the ray origin is randomized over time with blue-noise-style sampling and stabilized with Godot's temporal anti-aliasing.

## Results and Limits

The system demonstrates that LBM smoke simulation and volumetric ray marching can run interactively inside Godot. On an RTX 3060, the report notes steady 60 FPS for scenes up to roughly 2.1 million voxels.

The main bottleneck is voxelization, especially for moving or detailed meshes. Static scenes can voxelize once and reuse the texture, while dynamic scenes benefit from simplified proxy meshes. Memory is also a hard constraint: the Vulkan SSBO size limit caps practical simulations around a 256 cubed voxel grid unless the fields are split across multiple buffers.

## Technical Report

For the full mathematical and implementation details, including the D3Q27 LBM equations, GPU buffer layout, Godot integration, ray marching lighting model, performance notes, and limitations, the current report is embedded below.

<div class="pdf-embed" markdown="0">
    <object data="/assets/docs/projects/gpu_smoke_report.pdf" type="application/pdf">
        <p>Your browser doesn't support embedded PDFs.
        <a href="/assets/docs/projects/gpu_smoke_report.pdf">Download the PDF report</a> instead.</p>
    </object>
</div>
