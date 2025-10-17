---
title: Neuroevolution & NEAT - TIPE Project
layout: project
---

# Neuroevolution & NEAT - TIPE Project

<div class="video-container">
<video width="70%" autoplay loop muted playsinline preload="auto" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback">
    <source src="/assets/videos/tipe_demo.mp4" type="video/mp4">
</video>
</div>


<div style="display: flex; gap: 1rem; justify-content: center; margin: 1.5rem auto;">
    <img src="/assets/imgs/projects/tipe/ex1.png" alt="Exemple 1" style="width: 50%; height: auto;">
    <img src="/assets/imgs/projects/tipe/ex2.png" alt="Exemple 2" style="width: 50%; height: auto;">
</div>

## Context
As part of my CPGE (Classes Préparatoires aux Grandes Écoles) curriculum, I conducted a research project - **TIPE** - focusing on neuroevolution algorithms, particularly [NEAT (NeuroEvolution of Augmenting Topologies)](#neat). The goal was to evolve neural networks capable of controlling cars in a 2D racing environment.

## What is NEAT?
[NEAT](#neat) is an algorithm that **evolves** both the structure and weights of neural networks. Starting with minimal networks (input and output nodes not connected), it gradually develops more complex architectures through **natural selection**, similar to biological evolution.

This makes it particularly well-suited for tasks where the optimal network structure isn't known in advance. And when the problem is hard to describe, for instance here we don't know in advance which inputs are the best to navigate the track.

## Project Implementation
The project centers around a 2D racing simulation where AI-controlled cars learn to navigate various tracks efficiently.

### Track Editor
The project includes a custom track editor that uses **Bézier curves** to create smooth and challenging racing circuits. This allows for precise control over track design and difficulty levels, providing diverse challenges for the evolving neural networks.

<img src="/assets/imgs/projects/tipe/tracks.png" alt="Track Editor Examples" width="50%">

### Sensor System
Cars are equipped with ray-cast sensors that detect track boundaries and obstacles. These sensors provide essential input data to the neural networks, allowing them to:
- Measure distances to track boundaries
- Detect upcoming turns
- Assess optimal racing lines

<img src="/assets/imgs/projects/tipe/sensor.png" alt="Car Sensor System" width="50%">

### NEAT Algorithm / Evolution Process
[NEAT](#neat) is an algorithm developed by Kenneth O. Stanley that simultaneously evolves both the structure and connection weights of neural networks. Key features include:
- **Minimal Structure**: Begins with minimal networks which create small and efficient networks
- **Topology Evolution**: Networks become more complex by adding more nodes and connections
- **Innovation Numbers**: Track gene lineage through historical markings
- **Speciation**: Protects innovation by grouping similar networks

<div style="display: flex; gap: 1rem; justify-content: center; margin: 1.5rem auto;">
    <img src="/assets/imgs/projects/tipe/network_base.png" alt="Network base" style="width: 50%; height: auto;">
    <img src="/assets/imgs/projects/tipe/network_neat.png" alt="Network NEAT" style="width: 50%; height: auto;">
</div>

On the left, the network's hyperparameters (number of nodes and connections) are fixed beforehand by the programmer (me), but on the right the network is evolved using [NEAT](#neat). Both networks have comparable results, but we can clearly see that the evolved model is smaller.

### Disclaimer
We can see in the graphs above that the evolved network is not "well organized" compared to the other one, it does not have clear layers and connections can skip multiple nodes. The organization of the larger model makes it possible to use extremely efficient algorithms (we can represent it as matrices which make computation easier).

## Resources
For those interested in learning more:
1. **Evolving Neural Networks through Augmenting Topologies**<a id="neat"></a>, K. O. Stanley, R. Miikkulainen, _The MIT Press Journal_, 2002, [[PDF MIT Press](http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf)]
2. **Using Genetic Algorithms to Evolve Artificial Neural Networks Using Genetic Algorithms to Evolve Artificial Neural Networks**, W. T. Kearney, _Honors Theses_, 2016, [[PDF Colby College](https://digitalcommons.colby.edu/cgi/viewcontent.cgi?article=1836&context=honorstheses)]
