---
title: Cloth Simulation with DL
layout: project
---
# Physics-based Simulation of Deformable Objects with Deep Learning for Computer Graphics Applications

## Updates
### Week 06/10/2025

### Week 29/09/2025 — Meeting 03/10/2025
After additional training, the model shows more coherent behavior, though collision handling remains challenging. This issue might stem from our use of a relatively coarse mesh (30x30 nodes). Even though we don't implement remeshing, the model is trained on finer data from a remeshed dataset.
<img src="/assets/videos/cloth_dl_sphere_2.gif" alt="Sphere Dynamic demo 2" width="70%">

This is why most papers discussed this week incorporate some form of **unsupervised learning**.

Report of the week (*the links inside don't work*) [[PDF](../assets/docs/projects/cloth_dl/report_week_29_09.pdf)].
- **Neural Cloth Simulation**, H. Bertiche, M. Madadi, and S. Escalera, *ACM Transactions on Graphics*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2212.11220)]
- **N-Cloth: Predicting 3D Cloth Deformation with Mesh-Based Networks**, Y. Li et al., *Computer Graphics Forum (Proceedings of Eurographics)*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2112.06397)]
- **Hood: Hierarchical graphs for generalized modelling of clothing dynamics**, A. Grigorev, M. J. Black, and O. Hilliges, *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*, 2023, [[PDF ArXiv](https://arxiv.org/pdf/2212.07242)]
- **SENC: Handling Self-collision in Neural Cloth Simulation**, Z. Liao, S. Wang, and T. Komura, *European Conference on Computer Vision*, 2024, [[PDF ArXiv](https://arxiv.org/pdf/2407.12479)]
- **FastClothGNN: Optimizing Message Passing in Graph Neural Networks for Accelerating Real-Time Cloth Simulation**, Y. Zhang, K. Yu, and X. Zhang, *Graphical Models*
, 2024, [[HTML ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1524070325000207)]

### Week 22/09/2025 — Meeting 26/09/2025
The next phase involved the **Sphere Dynamic** dataset, which features the same flag interacting with a moving sphere instead of wind. While the dataset implements on-the-fly **remeshing**, we chose to omit this feature as it would be computationally expensive for real-time applications.

The current results are preliminary, with only ~150 epochs completed out of the 2000 suggested in the original paper. At this stage, collision handling has not been successfully learned:
<img src="/assets/videos/cloth_dl_sphere_1.gif" alt="Sphere Dynamic demo 1" width="70%">

- **Bi-Stride Multi-Scale Graph Neural Network for Mesh-Based Physical Simulation**, Y. Cao, M. Chai, M. Li, and C. Jiang, , 2022, [[PDF ArXiv](https://arxiv.org/pdf/2210.02573v1)]
- **MultiScale MeshGraphNets**, M. Fortunato, T. Pfaff, P. Wirnsberger, A. Pritzel, and P. Battaglia, *International Conference on Machine Learning*, 2022, [[PDF ArXiv](https://arxiv.org/pdf/2210.00612)]
- **X-MeshGraphNet: Scalable Multi-Scale Graph Neural Networks for Physics Simulation**, M. A. Nabian, C. Liu, R. Ranade, and S. Choudhry, , 2024, [[PDF ArXiv](https://arxiv.org/pdf/2411.17164)]

### Week 15/09/2025 — Meeting 18/09/2025
This week focused on implementing the basic **MeshGraphNets** architecture. Specifically, we trained the model on the **Flag Minimal** dataset — a dataset simulating a flag in wind using a uniform mesh.

The results are promising, despite limited training of only ~400 epochs out of the recommended 2000. In the demonstration below, only the initial frame is provided to the model. The GIF compares the rollout results (*left*: model prediction, *right*: validation dataset sample):
<img src="/assets/videos/cloth_dl_flag_minimal.gif" alt="Flag Minimal example" width="70%">

- **Learning Mesh-Based Simulation with Graph Networks**, T. Pfaff, M. Fortunato, A. Sanchez-Gonzalez, and P. W. Battaglia, *International Conference on Learning Representations*, 2021, [[PDF ArXiv](https://arxiv.org/pdf/2010.03409)]
