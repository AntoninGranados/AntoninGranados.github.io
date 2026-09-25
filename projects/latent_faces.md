---
title: Latent Space Face Editing
layout: project
image: /assets/imgs/projects/latent_faces_preview.webp
image_position: 50% 50%
subtitle: "StyleGAN2 latent space exploration and face editing - IMA205"
pdf: /assets/docs/projects/latent_faces_report.pdf
source_code: https://github.com/SlyZ1/Latent-Space-Faces
---

# Latent Space Face Editing

This project explores how to manipulate the latent space of **StyleGAN2** to edit facial attributes in generated and real face images. The work was carried out as part of the **IMA205** course at Télécom Paris, supervised by **Yann Gousseau**, with teammates **Baptiste** (SlyZ1), **Colin**, and **Quentin**.

The central question: can we project a face into StyleGAN2's latent space, then move it along semantic directions to edit specific attributes - glasses, age, gender - while preserving identity?

## Sampling

StyleGAN2 is pre-trained on the FFHQ dataset and generates highly realistic faces from random latent codes. The model maps a noise vector $z \in \mathcal{Z}$ through a learned mapping network to an intermediate code $w \in \mathcal{W}$, which drives each layer of the synthesis network.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/latent_faces/sampling.webp" alt="Grid of diverse StyleGAN2-generated faces">
  <figcaption>Faces sampled from StyleGAN2-FFHQ. None of these people exist.</figcaption>
</figure>

## Latent space geometry: $\mathcal{Z}$ vs $\mathcal{W}$

Interpolating between two latent codes in $\mathcal{Z}$ produces visual artifacts because $\mathcal{Z}$ is not disentangled - straight-line paths cross low-density regions of the distribution. The mapping network warps $\mathcal{Z}$ into $\mathcal{W}$, which is much more linear and semantically structured.

<div class="project-media-grid two" markdown="0">
  <figure>
    <img src="/assets/imgs/projects/latent_faces/interpolation_z.webp" alt="Interpolation in Z space showing artifacts">
    <figcaption>Interpolation in $\mathcal{Z}$: artefacts appear mid-path.</figcaption>
  </figure>
  <figure>
    <img src="/assets/imgs/projects/latent_faces/interpolation_w.webp" alt="Smooth interpolation in W space">
    <figcaption>Interpolation in $\mathcal{W}$: smooth, natural transition.</figcaption>
  </figure>
</div>

## Attribute editing with InterFaceGAN

To edit attributes, we use **InterFaceGAN**: a binary SVM classifier is trained on labeled $(w, \text{attribute})$ pairs - the labels come from a ResNet-18 fine-tuned on CelebA for glasses, gender, and age. The SVM's decision boundary defines a direction $n$ in $\mathcal{W}$; displacing $w$ by $\alpha \cdot n$ edits the attribute.

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/latent_faces/svm_separation.webp" alt="SVM decision boundaries for glasses, gender, and age in W space">
  <figcaption>SVM decision boundaries in the top 2 PCA components of $\mathcal{W}$ for glasses (Lunettes), gender (Homme), and age (Jeune).</figcaption>
</figure>

Displacing along the glasses direction also ages the face, because the two attributes are entangled in $\mathcal{W}$ (older people more often wear glasses in the training data).

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/latent_faces/interfacegan_eyeglasses.webp" alt="Glasses editing across alpha values for four faces">
  <figcaption>Glasses editing ($\alpha$ from -6 to +6). The displacement also shifts age, revealing entanglement between the two attributes.</figcaption>
</figure>

InterFaceGAN proposes a conditional editing formula to decouple attributes: the displacement is projected orthogonally to the unwanted direction. The two rows per face below show unconditioned (top) and conditioned (bottom) editing - the conditioned version adds glasses with less age shift.

<figure class="project-hero-media" markdown="0">
  <img src="/assets/imgs/projects/latent_faces/interfacegan_eyeglasses_cond.webp" alt="Conditional glasses editing with and without age conditioning">
  <figcaption>Each pair of rows: unconditioned (top) vs conditioned on age (bottom). Conditioning reduces but does not fully eliminate the age entanglement.</figcaption>
</figure>

Applying the same approach to the age direction:

<figure class="project-hero-media">
  <img src="/assets/imgs/projects/latent_faces/interfacegan_age.webp" alt="Age editing across alpha values">
  <figcaption>Age editing ($\alpha$ from -6 to +6). The direction captures aging convincingly but also tends to introduce glasses at older values.</figcaption>
</figure>

## Report

<div class="pdf-embed" markdown="0">
  <object data="/assets/docs/projects/latent_faces_report.pdf" type="application/pdf">
    <p>Your browser doesn't support embedded PDFs.
    <a href="/assets/docs/projects/latent_faces_report.pdf">Download the PDF report</a> instead.</p>
  </object>
</div>
