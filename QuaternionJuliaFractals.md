# Quaternion Julia Fractals

## Introduction

Quaternion Julia fractals are created by the same principle as the more traditional Julia set except that they use 4-dimensional complex numbers instead of 2-dimensional complex numbers. A 2D complex number is written as z = r + a i where i² = -1. A quaternion has two more complex components and might be written as:

q = r + a i + b j + c k

where r, a, b, and c are real numbers. There are slightly more complicated relationships between i, j, and k:

```
i² = j² = k² = -1
i j = k     j k = i     k i = j
j i = -k    k j = -i    i k = -j
```

## Mathematical Principles

To generate a quaternion fractal, a function is iterated z<sub>n+1</sub> = f(z<sub>n</sub>) and if it tends to infinity then it is outside the Julia set; if it is bounded then it is inside the set. 

Non-linear functions are by far the more interesting. In our implementation, we use the simplest non-linear function:

z<sub>n+1</sub> = z<sub>n</sub>² + c

where c and z are both quaternions. z<sub>0</sub> is the point in quaternion space being considered and c is a constant that identifies the particular quaternion. Another function that is often used is a cubic, namely:

z<sub>n+1</sub> = z<sub>n</sub>³ + c

Just as with 2D traditional Julia fractals which are either connected or not depending on the constant c, the same applies to quaternion Julia sets.

## Practical Implementation Matters

The fundamental issue is whether the series "escapes" or not. This cannot always be determined without generating the series to an infinite length, something undesirable in practice. There are two criteria that if they are met allow one to make a decision in a finite time:

1. Assume that if the modulus (length) of a term in the series is larger than some value then the series will escape. This is typically taken to be 4.

2. Limit the number of iterations and if the series hasn't escaped by then, then the point is considered to be inside the set. This maximum number of iterations is often as low as 50; the higher it is, the longer the fractal takes to create but the more accurate it is.

Another approximation is the precision at which the 4D quaternion space is sampled. One approach is to relate the pixel resolution of the image to quaternion space and sample one or two times per pixel. Too coarse a sampling risks missing parts of the fractal, a very fine sampling results in a very long compute time.

## Dimension Reduction

Since it is rather hard to draw 4-dimensional objects, we need a way of rendering 4D quaternion fractals on a 2D screen. The approach used in this explorer is to intersect the 4D solid with a plane, in essence making one of the quaternion components dependent on the other three.

To get a feel for the true nature of the quaternion fractal, one needs to create a whole series of slices along an axis perpendicular to the slice plane. This is the same as what one does when drawing contour lines to visualize a landscape, each contour represents a slice of the landscape by a plane perpendicular to the vertical axis.

Smoothly changing the slice plane results in very attractive animation sequences, which is implemented in our explorer with the Slice Animation feature.

## Interesting Quaternion Julia Set Constants

Here are some interesting values of c to explore in the application:

- c = (-1, 0.2, 0, 0)
- c = (-0.291, -0.399, 0.339, 0.437)
- c = (-0.2, 0.4, -0.4, -0.4)
- c = (-0.213, -0.0410, -0.563, -0.560)
- c = (-0.2, 0.6, 0.2, 0.2)
- c = (-0.162, 0.163, 0.560, -0.599)
- c = (-0.2, 0.8, 0, 0)
- c = (-0.445, 0.339, -0.0889, -0.562)
- c = (0.185, 0.478, 0.125, -0.392)
- c = (-0.450, -0.447, 0.181, 0.306)
- c = (-0.218, -0.113, -0.181, -0.496)
- c = (-0.137, -0.630, -0.475, -0.046)
- c = (-0.125, -0.256, 0.847, 0.0895)

## Quaternion Mathematics Reference

### Addition

Addition (or subtraction) of two quaternions Q1 = r1 + a1 i + b1 j + c1 k and Q2 = r2 + a2 i + b2 j + c2 k is performed as follows:

Q1 + Q2 = (r1+r2) + (a1+a2) i + (b1+b2) j + (c1 + c2) k

### Conjugate

The conjugate of Q = r + a i + b j + c k is:

Q* = r - a i - b j - c k

### Multiplication

Multiplication of two quaternions:

Q1 Q2 = [r1 r2 - a1 a2 - b1 b2 - c1 c2] +
        [r1 a2 + a1 r2 + b1 c2 - c1 b2] i +
        [r1 b2 + b1 r2 + c1 a2 - a1 c2] j +
        [r1 c2 + c1 r2 + a1 b2 - b1 a2] k

Note that quaternion multiplication is not commutative, that is, Q1 Q2 is NOT the same as Q2 Q1.

### Length (modulus)

The length (magnitude) of a quaternion is the familiar coordinate length in 4-dimensional space:

|Q| = sqrt(Q Q*) = sqrt(r² + a² + b² + c²)

And:

|Q1 Q2| = |Q1| |Q2|

### Inverse

The inverse of a quaternion Q<sup>-1</sup> such that Q Q<sup>-1</sup> = 1 is given by:

Q<sup>-1</sup> = (r - a i - b j - c k) / |Q|²

The inverse of a normalized quaternion is simply the conjugate.

### Division

Division of Q1 by Q2 is as follows:

Q1/Q2 = Q1(2r2 - Q2) / |Q2|²

### Exponential

If m = sqrt(a² + b² + c²) and v is the unit vector (a,b,c)/m then the exponential of the quaternion Q is:

exp(Q) = exp(r) [cos(m), v sin(m)]

### Rotation using Quaternions

To rotate a 3D vector "p" by angle theta about a (unit) axis "r" one forms the quaternion:

Q1 = (0, px, py, pz)

and the rotation quaternion:

Q2 = (cos(theta/2), rx sin(theta/2), ry sin(theta/2), rz sin(theta/2))

The rotated vector is the last three components of the quaternion:

Q3 = Q2 Q1 Q2*

---

*Information in this document is based on material written by Paul Bourke, July 2001. For more detailed information, visit the original source: [Quaternion Julia Fractals by Paul Bourke](https://paulbourke.net/fractals/quatjulia/)*
