---
title: Cloth Simulation with DL
layout: project
---
# Physics-based Simulation of Deformable Objects with Deep Learning for Computer Graphics Applications

<!-- Week quick navigation (uses .social-links from style.css) -->
<style>
    /* Week links grid: reuse .social-links visuals, but display as responsive grid */
    .week-links {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
        padding: 0;
        margin: 0.75rem auto 1.25rem auto;
        max-width: var(--max-width);
    }
    .week-links li { list-style: none; margin: 0; }
    .week-links a { display: inline-flex; justify-content: center; align-items: center; width: 100%; }

    @media (min-width: 900px) {
        .week-links { grid-template-columns: repeat(4, minmax(180px, 1fr)); }
    }
</style>
<div class="container">
    <ul class="social-links week-links">
        <li><a href="#week-15-12-2025" data-target="week-08-12-2025">Week 15/12/2025</a></li>
        <li><a href="#week-08-12-2025" data-target="week-08-12-2025">Week 08/12/2025</a></li>
        <li><a href="#week-01-12-2025" data-target="week-01-12-2025">Week 01/12/2025</a></li>
        <li><a href="#week-24-11-2025" data-target="week-24-11-2025">Week 24/11/2025</a></li>
        <li><a href="#week-17-11-2025" data-target="week-17-11-2025">Week 17/11/2025</a></li>
        <li><a href="#week-10-11-2025" data-target="week-10-11-2025">Week 10/11/2025</a></li>
        <li><a href="#week-03-11-2025" data-target="week-03-11-2025">Week 03/11/2025</a></li>
        <li><a href="#week-27-10-2025" data-target="week-27-10-2025">Week 27/10/2025</a></li>
        <li><a href="#week-20-10-2025" data-target="week-20-10-2025">Week 20/10/2025</a></li>
        <li><a href="#week-13-10-2025" data-target="week-13-10-2025">Week 13/10/2025</a></li>
        <li><a href="#week-06-10-2025" data-target="week-06-10-2025">Week 06/10/2025</a></li>
        <li><a href="#week-03-10-2025" data-target="week-03-10-2025">Week 03/10/2025</a></li>
        <li><a href="#week-29-09-2025" data-target="week-29-09-2025">Week 29/09/2025</a></li>
        <li><a href="#week-26-09-2025" data-target="week-26-09-2025">Week 26/09/2025</a></li>
        <li><a href="#week-22-09-2025" data-target="week-22-09-2025">Week 22/09/2025</a></li>
        <li><a href="#week-18-09-2025" data-target="week-18-09-2025">Week 18/09/2025</a></li>
        <li><a href="#week-15-09-2025" data-target="week-15-09-2025">Week 15/09/2025</a></li>
    </ul>
</div>


<div class="pdf-embed" markdown="0">
    <object data="/assets/docs/projects/cloth_dl/sota-report.pdf" type="application/pdf">
        <p>Your browser doesn't support embedded PDFs.
        <a href="/assets/docs/projects/cloth_dl/sota-report.pdf">Download the PDF report</a> instead.</p>
    </object>
</div>

## Week

## <a id="week-15-12-2025"></a> Week 15/12/2025
I rewrote the report on Overleaf and made some modifications to add more details (especially when notations were not clear enough).

I also tried to implement rollouts during the training process by computing the mean of the self-supervised loss I implemented last time. To add a supervised loss term, I would need to modify how my data loader works because it does not currently keep track of the future frames (i.e., I can't have the 10 frames after the one selected).

Initially, I used a rollout length of 8, but it was extremely slow. I then tried with 4 and recorded the [video](#self-sup). We can still see some stretching, but this is at around 80 epochs; training is still slow, so I haven't had time to run more (I can only use my laptop for now).

<div class="video-container" width="100%"><a id="self-sup"></a>
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="/assets/videos/cloth_dl/self_sup_roll4.mp4" type="video/mp4">
</video>
</div>

## <a id="week-08-12-2025"></a> Week 08/12/2025
I found an issue in my code (I was expecting a mistake in the stretching loss but hadn't found it before) by comparing with the source code of [HOOD](#hood) (see [GitHub](https://github.com/dolorousrtur/hood)). I was computing the Green strain tensor using the formula I found for the 2D case, but did not project the 3D points onto the triangle's plane (which made some sort of mix between the strain tensor of a 3D tetrahedron and a 2D triangle). I also found that they didn't normalise the losses to take into account the size of the mesh (ie. dividing by the node count, edge count or the total area).

After fixing this, I did an overfit test using 10 random samples from my custom dataset without any noise added. I first tried with the supervised approach as a baseline. It converged pretty quickly so I stopped the training after only 200 steps.
<img src="/assets/imgs/projects/cloth_dl/overfit_sup.png" alt="Overfit Supervised" width="100%"><a id="overfit-supervised"></a>

After this, I tried with the unsupervised loss; the results also looked satisfying. They were much slower (1000 steps on the graph below) but this was expected. I also displayed each of the loss terms separately under the total graph (from left to right: Inertia, Gravity, Bending, Stretching). Be aware that each graph is not to scale; for instance the gravity practically didn't decrease while the stretching did most of the work.
<img src="/assets/imgs/projects/cloth_dl/overfit_unsup.png" alt="Overfit Unsupervised" width="100%"><a id="overfit-unsupervised"></a>

### Bibliography
1. **FNOPT: Resolution-Agnostic, Self-Supervised Cloth Simulation using Meta-Optimization with Fourier Neural Operators**<a id="FNOpt"></a>, R. Chen, T. Tran, S. Parashar, 2025, [[PDF ArXiv](https://arxiv.org/pdf/2512.05762)]

## <a id="week-24-11-2025"></a> <a id="week-01-12-2025"></a> Week 24/11/2025 - 01/12/2025
During these weeks, I finished the first version of the State of the Art Report.

I was also able to finish the implementation of the loss function used in [HOOD](#hood). To do this I used the terms explicitly described in the [SNUG](#snug) paper (even though they are not an MGN modification, they should still match the formulation). I first tried to do it only using this loss, so training in a self-supervised setup, but it did not converge because the gravity term might have been too strong, making the cloth stretch downward indefinitely.

I also tried a semi-supervised setup, by using the MGN loss (error in the predicted and ground-truth positions), in addition to the physical loss described above. But I had the same issue as before. I will try to add more importance to the attachment to data to stabilise learning in the beginning and then decrease the coefficient over time to make the physical terms more important.

### Discussion (05/12/2025)
- Train using rollout (ie. do a rollout during the training and sum the losses at each step for backprop)
- Try to overfit to see if the model can learn
- Remove the gravity loss term and include it directly in the inertia (could also add any other force in that way)

## <a id="week-10-11-2025"></a> <a id="week-17-11-2025"></a> Week 10/11/2025 - 17/11/2025
Using my ARCSim-Python interface, I created several small datasets. The first one consists of a flag in the wind, and the second one contains a flag affected only by gravity.

I rebuilt the core architecture of my MeshGraphNet implementation from scratch to use the `HeteroData` class from `torch-geometric`. This class enables "automatic" message passing in the GNN blocks: I only need to define the graph, the node and edge features, and the aggregation method (at a high level — in my case, simply specifying "add"). It also makes it much easier to use larger batch sizes (so far, I had only used batches of size 1), as batching is handled automatically.

I have also made good progress on the state-of-the-art report and found a paper ([MeshGraphNetRP](#mgn-rp)) that improves generalization by adding more loss terms to the supervised version of MeshGraphNet, as well as additional features for the nodes (force and kinetic energy) and the edges (bending at the edge, e.g., the dihedral angle between the two faces connected by the edge).

### Discussion (21/11/2025)
- Mix between supervised and self-supervised (similar to [MeshGraphNetRP](#mgn-rp) where the ground truth is used in the loss with other physical losses), but add a decaying factor on the ground-truth term to slowly switch to purely self-supervised and not rely on the simulator
- Add the [Lamé constants](#lamé) to the mesh features and train with a wide variety of them (regardless of the one used in the ground truth because its effect on training would slowly disappear)

### Bibliography
1. **MeshGraphNetRP: Improving Generalization of GNN-based Cloth Simulation**<a id="mgn-rp"></a>, E. I. Libao, M. Lee, S. Kim, S. Lee, *Proceedings of the 16th ACM SIGGRAPH Conference on Motion, Interaction and Games*, 2023, [[PDF ACM](https://dl.acm.org/doi/pdf/10.1145/3623264.3624441)]

## <a id="week-03-11-2025"></a> Week 03/11/2025
I created a Python interface for ARCSim (see the repo on [GitHub](https://github.com/AntoninGranados/arcsim-python/tree/main)) to allow for "automated" simulation. It automatically runs all ARCSim commands and provides updates while it is executing. The configuration of the simulation can be created using code instead of relying on a JSON file (JSON is still usable). The scripts also provide an easy way to generate procedural meshes (only planes for now) using Poisson or uniform sampling.

A simple simulation could look like this:
```python
arcsim = ARCSimRunner()
arcsim.run_simulation(config, out_dir)
arcsim.generate_obj(out_dir)
sim_state = arcsim.load_obj(out_dir)
sim_state.save_npz("simulation.npz")
```

## <a id="week-20-10-2025"></a> <a id="week-27-10-2025"></a> Week 20/10/2025 - 27/10/2025
I managed to make a simulation using the SOFA Framework and its Python binding. The issue is that I had to make the wind force myself (in Python — which is a bit slow even with numpy vectorization) because I didn't find a simple plugin.

We can also see issues on the [video](#demo-sofa) on the edges (they flip and intersect the cloth), and some parts look stiffer than others, which might come from the Rayleigh parameters I chose.

<div class="video-container" width="100%"><a id="demo-sofa"></a>
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="/assets/videos/cloth_dl/sofa.mp4" type="video/mp4">
</video>
</div>

I also looked into [Argus](https://github.com/lijieumn/Argus-distribution), a newer version of ARCSim with the addition of friction. But I had the same compilation problems as with ARCSim.

While I was looking for a solution, I came across an [Arcsim correction](https://github.com/kaist-silab/arcsim). There were still some problems, but I managed to make it work (without any graphical interface), and I made a few simulations to test it, shown in the [video](#demo-arcsim).

First with remeshing (the default flag simulation), the simulation takes around 10 minutes, and the flag looks like it can stretch a lot. I then tried to do the simulation on a uniformly sampled plane (similar to the one I used to interpolate the remeshed simulation in previous weeks), but we can see some "bands" appearing due to the regularity of the mesh. To fix this I used Poisson sampling and Delaunay triangulation, which greatly reduces the artifacts.

The last two simulations (without remeshing) are about 5 times faster and use around 90% fewer vertices.

<div class="video-container" width="100%"><a id="demo-arcsim"></a>
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture width="50%">
    <source src="/assets/videos/cloth_dl/arcsim.mp4" type="video/mp4">
</video>
</div>

## <a id="week-13-10-2025"></a> Week 13/10/2025
I started the week by trying to compile [ARCSim](#arcsim), but it uses some old dependencies and relies on Python 2. So it was very hard (maybe impossible) to compile on my MacBook M3. I also tried on the school computers (GPUs) that run on Linux, but I had no luck as I did not find a way to install Python 2.

I then looked into [Taichi](https://www.taichi-lang.org), but I wanted something that could do simulations "out of the box" (like ARCSim, which simply uses JSON to describe the scenes).

I then tried the [SOFA framework](https://www.sofa-framework.org) and even though I had a bit of trouble compiling it, I managed to make it work on my computer. It uses XML to describe the scenes and can also work entirely through its Python interface (describe the scene + run the simulation). It also has a graphical interface (this is why I had some issues), which is useful but not strictly needed for my needs. It can simulate a wide variety of materials — from cloth to rigid bodies — so if we want to expand our field during the year, I will be able to use the same framework.

<img src="/assets/imgs/projects/cloth_dl/sofa_demo.png" alt="SOFA demo" width="50%"><a id="sofa_demo"></a>

### Bibliography
1. **Adaptive Anisotropic Remeshing for Cloth Simulation**<a id="arcsim"></a>, R. Narain, A. Samii, and J. F. O'Brien, _ACM Transactions on Graphics_, _Proceedings of ACM SIGGRAPH Asia 2012_, 2012, [[HTML Berkley](http://graphics.berkeley.edu/resources/ARCSim/)]
2. **Folding and Crumpling Adaptive Sheets**, R. Narain, T. Pfaff, and J. F. O'Brien, _ACM Transactions on Graphics_, _Proceedings of ACM SIGGRAPH_, 2013, [[HTML Berkley](http://graphics.berkeley.edu/resources/ARCSim/)]

## <a id="week-06-10-2025"></a> Week 06/10/2025
The main challenge for implementing **unsupervised learning** is the computation of the loss, because the model will still be the same as in [MeshGraphNets](#mgn). Here is the loss function used in [HOOD](#hood), with some of the terms (_bending_, _gravity_, _collision_ and _inertia_) found in [SNUG](#snug):

$$
    \mathcal{L}_{total} = \mathcal{L}_{stretching} + \mathcal{L}_{bending} + \mathcal{L}_{gravity} + \mathcal{L}_{friction} + \mathcal{L}_{collision} + \mathcal{L}_{inertia}
$$

- **Stretching**: where $\lambda$ and $\mu$ are [Lamé constants (wiki)](https://en.wikipedia.org/wiki/Lamé_parameters)<a id="lamé"></a> and $G_f$ is the [Green strain tensor (wiki)](https://en.wikipedia.org/wiki/Finite_strain_theory#Finite_strain_tensors) of the face $f$

    $$
        \mathcal{L}_{stretching} = \sum_{f \in \mathcal{F}} Area_f \cdot (\frac{\lambda}{2} tr(G_f)^2 + \mu tr(G_f^2))
    $$

    <div class="video-container" width="100%"><a id="stretching"></a>
    <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
        <source src="/assets/videos/cloth_dl/stretching.mp4" type="video/mp4">
    </video>
    </div>

- **Bending**: where $\theta_e$ and $\theta_e^0$ are respectively the current and the resting [dihedral angle (wiki)](https://en.wikipedia.org/wiki/Dihedral_angle) of edge $e$

    $$
        \mathcal{L}_{bending} = \sum_{e \in \mathcal{E}} k_{bending} (\theta_e - \theta_e^0)^2
    $$

    <div class="video-container" width="100%"><a id="bending"></a>
    <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
        <source src="/assets/videos/cloth_dl/bending.mp4" type="video/mp4">
    </video>
    </div>

- **Gravity**:

    $$
        \mathcal{L}_{gravity} = -\sum_{v \in \mathcal{V}} m_v \mathbf{g} \cdot \mathbf{x}_v
    $$

- **Friction**: where $\mathbf{v}_v^{tangent\space collider}$ is the tangential velocity of vertex $v$ w.r.t. the collider

    $$
        \mathcal{L}_{friction} = \sum_{v \in \mathcal{V}} k_{friction} ||\mathbf{v}_v^{tangent\space collider}||^2
    $$

- **Collision**: where $d_{collider}(\mathbf{x}_v)$ is the distance of vertex $v$ to the collider

    $$
        \mathcal{L}_{collision} = \sum_{v \in \mathcal{V}} k_{collision} max(\epsilon - d_{collider}(\mathbf{x}_v), 0)^3
    $$

    <div class="video-container" width="100%"><a id="collision"></a>
    <video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
        <source src="/assets/videos/cloth_dl/collision.mp4" type="video/mp4">
    </video>
    </div>

- **Inertia**:

    $$
        \mathcal{L}_{inertia} = \sum_{v \in \mathcal{V}} \frac{1}{2} m_v ||\mathbf{x}_v^{t+1} - 2 \mathbf{x}_v^{t} + \mathbf{x}_v^{t-1}||^2
    $$

Even with unsupervised learning, we need a dataset that would serve as input for the model. Here the T-shirt (simulated using [ARCSim](#arcsim)) comes from the [VTO dataset](https://github.com/isantesteban/vto-dataset) used by [HOOD](#hood).
<div class="video-container"><a id="vto_dataset"></a>
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="/assets/videos/cloth_dl/vto_dataset.mp4" type="video/mp4">
</video>
</div>

But the body (collider) is missing as it came from the [CMU Motion Capture Database](https://mocap.cs.cmu.edu) (videos) and was converted to [SMPL](https://smpl.is.tue.mpg.de) format using a video-to-pose algorithm ([SURREAL](https://www.di.ens.fr/willow/research/surreal/data/)). I tried to compute the bone rotations directly from the CMU files (which are given, so using video-to-pose should not be necessary). But probably due to local/global coordinate differences between the two datasets, I did not manage to compute the body pose for now (the [image below](#smpl_dataset) should be the first frame of the [animation above](#vto_dataset)).

<img src="/assets/imgs/projects/cloth_dl/smpl_dataset.png" alt="SMPL Dataset demo" width="50%"><a id="smpl_dataset"></a>

### Bibliography
1. **SNUG: Self-Supervised Neural Dynamic Garments**<a id="snug"></a>, I. Santesteban, M. A. Otaduy, and D. Casas, *Conference on Computer Vision and Pattern Recognition*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2204.02219)]

## <a id="week-29-09-2025"></a> <a id="week-03-10-2025"></a> Week 29/09/2025 — Meeting 03/10/2025
After additional training, the model shows more coherent behavior, though collision handling remains challenging. This issue might stem from our use of a relatively coarse mesh (30x30 nodes). Even though we don't implement remeshing, the model is trained on finer data from a remeshed dataset.
<div class="video-container">
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback">
    <source src="/assets/videos/cloth_dl/sphere_2.mp4" type="video/mp4">
</video>
</div>

So I created a **uniform dataset**, which was built by interpolating (barycenter interpolation) a uniform mesh with [MeshGraphNets](#mgn)'s dataset. As we can see in the [video below](#uniform_dataset), due to the lack of vertex density in some critical places, there are some wrinkles on sharp bends. The _node count ratio_ (the node count in the interpolated mesh divided by the node count in the ground truth) is also not great, except when the remeshing creates a lot of new nodes.
<div class="video-container"><a id="uniform_dataset"></a>
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="/assets/videos/cloth_dl/uniform_dataset.mp4" type="video/mp4">
</video>
</div>

This is why most papers discussed this week incorporate some form of **unsupervised learning**.

Report of the week (*the links inside don't work*) [[PDF](../assets/docs/projects/cloth_dl/report-week-29-09.pdf)].

### Bibliography
1. **Neural Cloth Simulation**, H. Bertiche, M. Madadi, and S. Escalera, *ACM Transactions on Graphics*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2212.11220)]
2. **N-Cloth: Predicting 3D Cloth Deformation with Mesh-Based Networks**, Y. Li et al., *Computer Graphics Forum (Proceedings of Eurographics)*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2112.06397)]
3. **Hood: Hierarchical graphs for generalized modelling of clothing dynamics**<a id="hood"></a>, A. Grigorev, M. J. Black, and O. Hilliges, *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*, 2023, [[PDF ArXiv](https://arxiv.org/pdf/2212.07242)]
4. **SENC: Handling Self-collision in Neural Cloth Simulation**<a id="senc"></a>, Z. Liao, S. Wang, and T. Komura, *European Conference on Computer Vision*, 2024, [[PDF ArXiv](https://arxiv.org/pdf/2407.12479)]
5. **FastClothGNN: Optimizing Message Passing in Graph Neural Networks for Accelerating Real-Time Cloth Simulation**<a id="fastgnn"></a>, Y. Zhang, K. Yu, and X. Zhang, *Graphical Models*, 2024, [[HTML ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1524070325000207)]

## <a id="week-22-09-2025"></a> <a id="week-26-09-2025"></a> Week 22/09/2025 — Meeting 26/09/2025
The next phase involved the **Sphere Dynamic** dataset, which features the same flag interacting with a moving sphere instead of wind. While the dataset implements on-the-fly **remeshing**, we chose to omit this feature as it would be computationally expensive for real-time applications.

The current results are preliminary, with only ~150 epochs completed out of the 2000 suggested in the original paper. At this stage, collision handling has not been successfully learned:
<div class="video-container">
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback">
    <source src="/assets/videos/cloth_dl/sphere_1.mp4" type="video/mp4">
</video>
</div>

### Bibliography
1. **Bi-Stride Multi-Scale Graph Neural Network for Mesh-Based Physical Simulation**, Y. Cao, M. Chai, M. Li, and C. Jiang, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2210.02573v1)]
2. **MultiScale MeshGraphNets**, M. Fortunato, T. Pfaff, P. Wirnsberger, A. Pritzel, and P. Battaglia, *International Conference on Machine Learning*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2210.00612)]
3. **X-MeshGraphNet: Scalable Multi-Scale Graph Neural Networks for Physics Simulation**<a id="x-mgn"></a>, M. A. Nabian, C. Liu, R. Ranade, and S. Choudhry, 2024, [[PDF ArXiv](https://arxiv.org/pdf/2411.17164)]

## <a id="week-15-09-2025"></a> <a id="week-18-09-2025"></a> Week 15/09/2025 — Meeting 18/09/2025
This week focused on implementing the basic [MeshGraphNets](#mgn) architecture. Specifically, we trained the model on the **Flag Minimal** dataset (_error in the GIF title_) — a dataset simulating a flag in wind using a uniform mesh.

The results are promising, despite limited training of only ~400 epochs out of the recommended 2000. In the demonstration below, only the initial frame is provided to the model. The GIF compares the rollout results (*left*: model prediction, *right*: validation dataset sample):
<div class="video-container">
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback">
    <source src="/assets/videos/cloth_dl/flag_minimal.mp4" type="video/mp4">
</video>
</div>

### Bibliography
1. **Learning Mesh-Based Simulation with Graph Networks**<a id="mgn"></a>, T. Pfaff, M. Fortunato, A. Sanchez-Gonzalez, and P. W. Battaglia, *International Conference on Learning Representations*, 2021, [[PDF ArXiv](https://arxiv.org/pdf/2010.03409)]
