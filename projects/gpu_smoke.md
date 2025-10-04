---
title: Smoke on the GPU
layout: project
---

# 3D Smoke Simulation and Rendering on a Custom GPU Pipeline with Godot

This project focuses on implementing real-time (or at least interactive) smoke simulation and rendering entirely on the GPU using Godot 4's compute shaders (which uses a Vulkan backend). The goal was to create a physically-based simulation that could run efficiently in a game engine context.

## Overview

The simulation is based on the Navier-Stokes equations for incompressible fluids, implemented using a semi-Lagrangian advection scheme. All computations for the simulation and the rendering are performed on the GPU through compute shaders.

## Features
- Full GPU-based fluid simulation
- Real-time performance
- Physically-based behavior
- 3D volumetric rendering

## Technical Report

For a detailed technical explanation of the implementation, including mathematical background, you can explore the full technical report:

<div class="pdf-embed" markdown="0">
    <object data="/assets/docs/projects/gpu_smoke_report.pdf" type="application/pdf">
        <p>Your browser doesn't support embedded PDFs.
        <a href="/assets/docs/projects/gpu_smoke_report.pdf">Download the PDF report</a> instead.</p>
    </object>
</div>