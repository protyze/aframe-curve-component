## aframe-curve-component

[![Version](http://img.shields.io/npm/v/aframe-curve-component.svg?style=flat-square)](https://npmjs.org/package/aframe-curve-component)
[![License](http://img.shields.io/npm/l/aframe-curve-component.svg?style=flat-square)](https://npmjs.org/package/aframe-curve-component)

A Curve component to draw curves in A-Frame. The component consists of multiple components:

* curve: Draws a certain type of a curve and consists of multiple "curve-points"
* curve-point: Defines the curve based on it's position. Multiple entities are added as children of the curve-entity.
* draw-curve: Add's a Mesh to the curve to visualize it
* clone-along-curve: Clones an Entity along the curve (e.g. to build a race track based on track parts)

For [A-Frame](https://aframe.io).

Credits: Initial concept and development has been done by [AdaRoseEdwards](https://github.com/SamsungInternet/a-frame-components/blob/master/dist/curve.js).

### API (curve)

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| type         | Type of the Curve to draw. One ff: 'CatmullRom', 'Spline', 'CubicBezier', 'QuadraticBezier', 'Line'            | CatmullRom              |
| closed         | Whether or not the curve should be drawn closed (connect the end and start point automatically)           | false              |

### API (curve-point)

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
|          |             |               |

### API (draw-curve)

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| curve         | A Selector to identify the corresponding curve            | ''              |

### API (clone-along-curve)

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| curve         | A Selector to identify the corresponding curve            | ''              |
| spacing         | Spacing between the cloned entities in Meters            | 1              |
| rotation         | Rotation of the cloned Entities            | '0 0 0'              |
| scale         | Scale of the cloned entities            | '1 1 1'              |

### Installation

#### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://rawgit.com/aframevr/aframe/master/dist/aframe-master.min.js"></script>
  <script src="https://unpkg.com/aframe-curve-component/dist/aframe-curve-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-curve id="track1">
        <a-curve-point position="-1 1 -3"></a-curve-point>
        <a-curve-point position="1 1 -3"></a-curve-point>
    </a-curve>
    
    <!-- Draw the Curve -->
    <a-draw-curve curveref="#track1" material="shader: line; color: blue;"></a-draw-curve>
    
    <!-- Clone a Box along the Curve -->
    <a-entity clone-along-curve="curve: #track1; spacing: 0.2; scale: 1 1 1; rotation: 0 0 0;" geometry="primitive:box; height:0.1; width:0.2; depth:0.1"></a-entity>
  </a-scene>
</body>
```

<!-- If component is accepted to the Registry, uncomment this. -->
<!--
Or with [angle](https://npmjs.com/package/angle/), you can install the proper
version of the component straight into your HTML file, respective to your
version of A-Frame:

```sh
angle install aframe-curve-component
```
-->

#### npm

Install via npm:

```bash
npm install aframe-curve-component
```

Then require and use.

```js
require('aframe');
require('aframe-curve-component');
```
