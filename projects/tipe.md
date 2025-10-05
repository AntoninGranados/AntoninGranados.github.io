---
title: Neuroevolution & NEAT - TIPE Project
layout: project
---

# Neuroevolution & NEAT - TIPE Project

<div class="video-container">
    <video controls>
        <source src="/assets/videos/tipe_demo.mp4" type="video/mp4">
        Your browser does not support the video tag.
    </video>
</div>

## Context

As part of my CPGE (Classes Préparatoires aux Grandes Écoles) curriculum, I conducted a research project (TIPE) focusing on neuroevolution algorithms, particularly NEAT (NeuroEvolution of Augmenting Topologies). The goal was to evolve neural networks capable of controlling cars in a 2D racing environment.

## What is NEAT?

NEAT (NeuroEvolution of Augmenting Topologies) is an innovative algorithm that evolves both the structure and weights of neural networks simultaneously. Starting with minimal networks, it gradually develops more complex architectures through natural selection, similar to biological evolution. This makes it particularly well-suited for tasks where the optimal network structure isn't known in advance.

## Project Implementation

The project centers around a 2D racing simulation where AI-controlled cars learn to navigate various tracks efficiently.

### Track Editor

<img src="/assets/img/projects/tipe_tracks.png" alt="Track Editor Examples" width="50%">

The environment includes a custom track editor that uses Bézier curves to create smooth, challenging racing circuits. This allows for precise control over track design and difficulty levels, providing diverse challenges for the evolving neural networks.

### Sensor System

<img src="/assets/img/projects/tipe_sensor.png" alt="Car Sensor System" width="50%">

Cars are equipped with ray-cast sensors that detect track boundaries and obstacles. These sensors provide essential input data to the neural networks, allowing them to:
- Measure distances to track boundaries
- Detect upcoming turns
- Assess optimal racing lines

### NEAT Algorithm / Evolution Process

NEAT (NeuroEvolution of Augmenting Topologies) is a groundbreaking algorithm developed by Kenneth O. Stanley that simultaneously evolves both the structure and connection weights of neural networks. Key features include:

- **Topology Evolution**: Networks start simple and gradually become more complex
- **Innovation Numbers**: Track gene lineage through historical markings
- **Speciation**: Protects innovation by grouping similar networks
- **Minimal Structure**: Begins with minimal networks and adds complexity only when beneficial

## Resources

For those interested in learning more about NEAT:
- [Original NEAT Paper](http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf) by Kenneth O. Stanley
- [Evolving Neural Network paper](https://digitalcommons.colby.edu/cgi/viewcontent.cgi?article=1836&context=honorstheses) by William T. Kearney
