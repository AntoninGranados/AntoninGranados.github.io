---
title: TIPE - Neuroevolution for Autonomous Driving
layout: project
image: /assets/imgs/projects/tipe_preview.png
image_position: 62% 42%
subtitle: Evolving Neural Network Controllers with NEAT for a 2D Racing Simulation
---

# TIPE: Neuroevolution for Autonomous Driving

This TIPE project studies how a genetic algorithm can train a neural network to drive a car in a 2D racing game. The work covers the full loop: implementing the neural network, building the driving environment, evaluating agents, evolving populations, and testing whether trained controllers generalize to new tracks.

<div class="project-link-row" markdown="0">
  <a href="/assets/docs/projects/tipe_presentation.pdf" target="_blank" rel="noopener">Presentation PDF</a>
</div>

<figure class="video-container project-wide-video">
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback">
    <source src="/assets/videos/tipe_demo.mp4" type="video/mp4">
</video>
<figcaption>Training demo: a population of agents learns racing trajectories from sensor inputs and a score-based fitness function.</figcaption>
</figure>

## Overview

<div class="project-feature-grid" markdown="0">
  <section>
    <h3>Problem</h3>
    <p>Use a genetic algorithm to train a neural network for autonomous driving in a racing game.</p>
  </section>
  <section>
    <h3>Agent</h3>
    <p>The car observes the track through ray-cast sensors and speed, then outputs driving commands.</p>
  </section>
  <section>
    <h3>Evolution</h3>
    <p>Populations are selected, crossed, and mutated from a DNA vector encoding neural-network parameters.</p>
  </section>
  <section>
    <h3>Evaluation</h3>
    <p>Experiments compare population size, mutation rate, parallelization, and generalization across tracks.</p>
  </section>
</div>

## Driving Environment

The game is a compact 2D racing environment built for fast experiments. Tracks are generated from editable Bezier curves, then converted into a drivable road with borders and checkpoints. This made it possible to quickly create training circuits and test circuits for generalization.

The car perceives the world with a small set of ray-cast sensors pointing forward and sideways. These distances, combined with the car speed, form the neural network input. The output controls acceleration, braking, and steering.

<div class="project-media-grid two" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/tipe/tracks.png" alt="Track editor using Bezier curves to generate a racing circuit">
    <figcaption>Track editor based on Bezier control points and generated road segments.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/tipe/sensor.png" alt="Car ray-cast sensors measuring distance to track boundaries">
    <figcaption>Sensor rays provide distances to nearby track boundaries.</figcaption>
  </figure>
</div>

## Neural Network

The neural network is implemented from scratch with NumPy arrays for neurons, biases, and weight matrices. Each layer computes a weighted combination of the previous layer, adds a bias, and applies a sigmoid activation.

The presentation introduces the network as a direct model of the driving policy: vision and speed enter the network, and the outputs decide whether the car accelerates, decelerates, turns right, or turns left.

<div class="project-media-grid two" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/tipe/network_base.png" alt="Dense neural network visualization">
    <figcaption>Dense reference network with a fixed structure.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/tipe/network_neat.png" alt="Smaller evolved neural network visualization">
    <figcaption>Smaller evolved network reaching comparable behavior.</figcaption>
  </figure>
</div>

## Genetic Algorithm

Each individual stores a DNA vector representing the neural-network parameters. During training, each agent drives the track and receives a fitness score. The next generation is produced by selecting high-scoring individuals, crossing parent DNA vectors, and applying random mutations.

Selection uses a probability distribution derived from fitness, so strong individuals are more likely to reproduce while weaker individuals can still contribute. Crossover mixes genes from two parents, and mutation perturbs some values to keep exploring new driving policies.

<div class="project-media-grid two" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/tipe/ex1.png" alt="Car driving on a more complex generated track">
    <figcaption>Generalization test on a more complex circuit.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/tipe/ex2.png" alt="Car driving on another generated track">
    <figcaption>Score and trajectory visualization during evaluation.</figcaption>
  </figure>
</div>

## Experiments

The presentation studies several training parameters: population size, mutation rate, and parallelization. The goal was not only to produce a controller that can finish one track, but also to understand which parameters make training faster and which ones improve generalization.

The main limitation is that the learned controller can overfit a track. A controller that performs well on one circuit may fail on another if the training setup does not expose it to enough variety. This is why track generation and generalization tests were central parts of the project.

## Presentation

The full TIPE presentation is embedded below.

<div class="pdf-embed" markdown="0">
    <object data="/assets/docs/projects/tipe_presentation.pdf" type="application/pdf">
        <p>Your browser doesn't support embedded PDFs.
        <a href="/assets/docs/projects/tipe_presentation.pdf">Download the PDF presentation</a> instead.</p>
    </object>
</div>

## Resources

1. **Evolving Neural Networks through Augmenting Topologies**<a id="neat"></a>, K. O. Stanley, R. Miikkulainen, _The MIT Press Journal_, 2002, [[PDF MIT Press](http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf)]
2. **Using Genetic Algorithms to Evolve Artificial Neural Networks**, W. T. Kearney, _Honors Theses_, 2016, [[PDF Colby College](https://digitalcommons.colby.edu/cgi/viewcontent.cgi?article=1836&context=honorstheses)]
