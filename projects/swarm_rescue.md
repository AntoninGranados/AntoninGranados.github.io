---
title: Swarm Rescue Challenge
layout: project
image: /assets/imgs/projects/swarm_rescue_preview.webp
image_position: 50% 40%
subtitle: 1st Place - IP Paris Drone Swarm Competition 2025-2026
docs:
  - href: https://emmanuel-battesti.github.io/swarm-rescue-website/leaderboard_fra/
    label: Leaderboard
---

# Swarm Rescue Challenge - 1st Place

The Swarm Rescue Challenge is an annual competition organised by the Institut Polytechnique de Paris, CIEDS, and AMIAD. Teams program a swarm of drones in simulation to explore an unknown, potentially dangerous zone and guide immobile victims to a safe area. The 2025-2026 edition brought together 37 teams from IP Paris member schools and IIT Madras.

Our team - **André Poix, Mathias Anseaume, and Antonin Granados** - from Telecom Paris finished **1st** in the final evaluation held on March 19, 2026.

## Challenge

Each team controls a fleet of 10 drones equipped with LIDAR sensors, a semantic object detector, a communication system, and (on standard maps) GPS. The environment is unknown: drones must build a map, locate victims, and bring them back to the rescue zone within a 24-minute window.

The final evaluation ran each team's code across three different maps, each tested with and without a difficulty zone:

<div class="project-feature-grid" style="grid-template-columns: repeat(3, minmax(0, 1fr));" markdown="0">
  <section>
    <h3>No-Comm Zone</h3>
    <p>A region where inter-drone communication is jammed, forcing each drone to act independently.</p>
  </section>
  <section>
    <h3>Kill Zone</h3>
    <p>An area that damages or destroys drones that enter it, reducing the effective swarm size mid-mission.</p>
  </section>
  <section>
    <h3>No-GPS Zone</h3>
    <p>A region where GPS is unavailable, requiring odometry-based localisation to maintain the map.</p>
  </section>
</div>

Teams were scored on rescued victim percentage, exploration coverage, time efficiency, and drone health on return - each tested twice per configuration for 12 runs total.

## Competition videos

The three videos below show our best runs on each of the final maps, as published on the competition website.

**Map 1 - No-communication zone**

<figure class="video-container project-wide-video" markdown="0">
  <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="https://emmanuel-battesti.github.io/swarm-rescue-website/assets/videos/results_2025_26_france/team106/team106_MapFinal_2025_26_01_no_com_zone_rd2_zip.mp4" type="video/mp4">
  </video>
</figure>

**Map 2 - Kill zone**

<figure class="video-container project-wide-video" markdown="0">
  <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="https://emmanuel-battesti.github.io/swarm-rescue-website/assets/videos/results_2025_26_france/team106/team106_MapFinal_2025_26_02_kill_zone_rd2_zip.mp4" type="video/mp4">
  </video>
</figure>

**Map 3 - No-GPS zone**

<figure class="video-container project-wide-video" markdown="0">
  <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="https://emmanuel-battesti.github.io/swarm-rescue-website/assets/videos/results_2025_26_france/team106/team106_MapFinal_2025_26_03_no_gps_zone_rd1_zip.mp4" type="video/mp4">
  </video>
</figure>
