---
title: Cloth Simulation with DL
layout: project
---
# Physics-based Simulation of Deformable Objects with Deep Learning for Computer Graphics Applications

## Updates
### Week 06/10/2025
The main challenge for implementing **unsupervised learning** is the computation of the loss, because the model will still be the same as in [MeshGraphNets](#mgn). Here is the loss function used in [HOOD](#hood), with some of the terms (_bending_, _gravity_, _collision_ and _inertia_) found in [SNUG](#snug):

$$
    \mathcal{L}_{total} = \mathcal{L}_{streching} + \mathcal{L}_{bending} + \mathcal{L}_{gravity} + \mathcal{L}_{friction} + \mathcal{L}_{collision} + \mathcal{L}_{inertia}
$$

- **Streching**: where $\lambda$ and $\mu$ are [Lamé constants (wiki)](https://en.wikipedia.org/wiki/Lamé_parameters) and $E_f$ is the [Green strain tensor (wiki)](https://en.wikipedia.org/wiki/Finite_strain_theory#Finite_strain_tensors) of the face $f$

    $$
        \mathcal{L}_{streching} = \sum_{f \in \mathcal{F}} Area_f \cdot (\frac{\lambda}{2} tr(E_f)^2 + \mu tr(E_f^2))
    $$

- **Bending**: where $\theta_e$ and $\theta_e^0$ are respectively the is the current and the resting [dihedral angle (wiki)](https://en.wikipedia.org/wiki/Dihedral_angle) of edge $e$

    $$
        \mathcal{L}_{bending} = \sum_{e \in \mathcal{E}} \frac{1}{2} k_{bending} (\theta_e - \theta_e^0)^2
    $$

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

- **Inertia**:

    $$
        \mathcal{L}_{inertia} = \sum_{v \in \mathcal{V}} \frac{1}{2} m_v ||\mathbf{x}_v^{t+1} - 2 \mathbf{x}_v^{t} + \mathbf{x}_v^{t-1}||^2
    $$

Even with unsupervised learning we need a dataset that would serve as input for the model. Here the tshirt (simulated using [ARCSim](http://graphics.berkeley.edu/resources/ARCSim/)) comes from the [VTO dataset](https://github.com/isantesteban/vto-dataset) used by [HOOD](#hood).
<div class="video-container">
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture>
    <source src="/assets/videos/cloth_dl_vto_dataset.mp4" type="video/mp4">
</video>
</div><a id="vto_dataset"></a>

But the body (collider) is missing as it came from the [CMU Motion Capture Database](https://mocap.cs.cmu.edu) (videos) and was converted to [SMPL](https://smpl.is.tue.mpg.de) format using a video to pose algorithm ([SURREAL](https://www.di.ens.fr/willow/research/surreal/data/)). I tried to compute the bones rotation directly from the CMU files (which are given thus using video to pose should not be necessary). But probably due to local/global coordinates differences between the two datasets, I did not manage to compute the body pose for now (the [image below](#smpl_dataset) should be the first frame of the [animation above](#vto_dataset)).

<img src="/assets/videos/cloth_dl_smpl_dataset.png" alt="SMPL Dataset demo" width="50%"><a id="smpl_dataset"></a>

1. **SNUG: Self-Supervised Neural Dynamic Garments**<a id="snug"></a>, I. Santesteban, M. A. Otaduy, and D. Casas, *Conference on Computer Vision and Pattern Recognition*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2204.02219)]

### Week 29/09/2025 — Meeting 03/10/2025
After additional training, the model shows more coherent behavior, though collision handling remains challenging. This issue might stem from our use of a relatively coarse mesh (30x30 nodes). Even though we don't implement remeshing, the model is trained on finer data from a remeshed dataset.
<div class="video-container">
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback">
    <source src="/assets/videos/cloth_dl_sphere_2.mp4" type="video/mp4">
</video>
</div>

This is why most papers discussed this week incorporate some form of **unsupervised learning**.

Report of the week (*the links inside don't work*) [[PDF](../assets/docs/projects/cloth_dl/report_week_29_09.pdf)].
1. **Neural Cloth Simulation**, H. Bertiche, M. Madadi, and S. Escalera, *ACM Transactions on Graphics*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2212.11220)]
2. **N-Cloth: Predicting 3D Cloth Deformation with Mesh-Based Networks**, Y. Li et al., *Computer Graphics Forum (Proceedings of Eurographics)*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2112.06397)]
3. **Hood: Hierarchical graphs for generalized modelling of clothing dynamics**<a id="hood"></a>, A. Grigorev, M. J. Black, and O. Hilliges, *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*, 2023, [[PDF ArXiv](https://arxiv.org/pdf/2212.07242)]
4. **SENC: Handling Self-collision in Neural Cloth Simulation**<a id="senc"></a>, Z. Liao, S. Wang, and T. Komura, *European Conference on Computer Vision*, 2024, [[PDF ArXiv](https://arxiv.org/pdf/2407.12479)]
5. **FastClothGNN: Optimizing Message Passing in Graph Neural Networks for Accelerating Real-Time Cloth Simulation**<a id="fastgnn"></a>, Y. Zhang, K. Yu, and X. Zhang, *Graphical Models*
, 2024, [[HTML ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1524070325000207)]

### Week 22/09/2025 — Meeting 26/09/2025
The next phase involved the **Sphere Dynamic** dataset, which features the same flag interacting with a moving sphere instead of wind. While the dataset implements on-the-fly **remeshing**, we chose to omit this feature as it would be computationally expensive for real-time applications.

The current results are preliminary, with only ~150 epochs completed out of the 2000 suggested in the original paper. At this stage, collision handling has not been successfully learned:
<div class="video-container">
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback">
    <source src="/assets/videos/cloth_dl_sphere_1.mp4" type="video/mp4">
</video>
</div>

1. **Bi-Stride Multi-Scale Graph Neural Network for Mesh-Based Physical Simulation**, Y. Cao, M. Chai, M. Li, and C. Jiang, , 2022, [[PDF ArXiv](https://arxiv.org/pdf/2210.02573v1)]
2. **MultiScale MeshGraphNets**, M. Fortunato, T. Pfaff, P. Wirnsberger, A. Pritzel, and P. Battaglia, *International Conference on Machine Learning*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2210.00612)]
3. **X-MeshGraphNet: Scalable Multi-Scale Graph Neural Networks for Physics Simulation**<a id="x-mgn"></a>, M. A. Nabian, C. Liu, R. Ranade, and S. Choudhry, , 2024, [[PDF ArXiv](https://arxiv.org/pdf/2411.17164)]
4. **Adaptive Anisotropic Remeshing for Cloth Simulation**<a id="remeshing"></a>, R. Narain, A. Samii, and J. F. O'Brien, *ACM Transactions on Graphics*, 2012, [[PDF Berkley](http://graphics.berkeley.edu/papers/Narain-AAR-2012-11/Narain-AAR-2012-11.pdf)]

### Week 15/09/2025 — Meeting 18/09/2025
This week focused on implementing the basic [MeshGraphNets](#mgn) architecture. Specifically, we trained the model on the **Flag Minimal** dataset (_error in the GIF title_) — a dataset simulating a flag in wind using a uniform mesh.

The results are promising, despite limited training of only ~400 epochs out of the recommended 2000. In the demonstration below, only the initial frame is provided to the model. The GIF compares the rollout results (*left*: model prediction, *right*: validation dataset sample):
<div class="video-container">
<video autoplay loop muted playsinline preload="auto" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback">
    <source src="/assets/videos/cloth_dl_flag_minimal.mp4" type="video/mp4">
</video>
</div>

1. **Learning Mesh-Based Simulation with Graph Networks**<a id="mgn"></a>, T. Pfaff, M. Fortunato, A. Sanchez-Gonzalez, and P. W. Battaglia, *International Conference on Learning Representations*, 2021, [[PDF ArXiv](https://arxiv.org/pdf/2010.03409)]
