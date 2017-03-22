(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//require('aframe'); --> Currently Master is required because: https://github.com/aframevr/aframe/commit/da02c7c5b2319e6923b6d5d3e49a2f3940763bf2#diff-dc3043915bc0e1dc643b7fa488e01c0e, will be added back with new release.
require('../index.js');

},{"../index.js":2}],2:[function(require,module,exports){
/* global AFRAME */

if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Curve component for A-Frame to deal with spline curves
 */

var __tempVector1 = new THREE.Vector3();
var __tempVector2 = new THREE.Vector3();
var up = new THREE.Vector3(0, 1, 0);
var zAxis = new THREE.Vector3(0, 0, 1);
var degToRad = THREE.Math.degToRad;

AFRAME.registerComponent('curve-point', {

    //dependencies: ['position'],

    schema: {},

    init: function () {
        this.el.addEventListener("componentchanged", this.changeHandler.bind(this));
        this.el.emit("curve-point-change");
    },

    changeHandler: function (event) {
        if (event.detail.name == "position") {
            this.el.emit("curve-point-change");
        }
    }

});

AFRAME.registerComponent('curve', {

    //dependencies: ['curve-point'],

    schema: {
        type: {
            type: 'string',
            default: 'CatmullRom',
            oneOf: ['CatmullRom', 'Spline', 'CubicBezier', 'QuadraticBezier', 'Line']
        },
        closed: {
            type: 'boolean',
            default: false
        }
    },

    init: function () {
        this.pathPoints = null;
    },

    update: function (oldData) {
        this.remove();

        this.points = Array.from(this.el.querySelectorAll("a-curve-point, [curve-point]"));

        if (this.points.length <= 1) {
            console.warn("At least 2 curve-points needed to draw a curve");
            this.curve = null;
            return;
        }

        var pointsArray = this.points.map(function (a) {
            if (a.x !== undefined && a.y !== undefined && a.z !== undefined) {
                return a;
            }

            // flush position information to object 3D
            a.updateComponent('position');
            return a.object3D.getWorldPosition()
        });

        if (this.pathPoints) {
            var newPath = this.pointPositionsString(pointsArray);
            var oldPath = this.pointPositionsString(this.pathPoints);

            // TODO: don't retun when TYPE has changed
            if (newPath == oldPath) {
                // Path didn't change, nothing to do.
                return;
            }
        }

        this.pathPoints = pointsArray;

        this.threeConstructor = THREE[this.data.type + 'Curve3'];

        // apply the points as ags to the Beziers
        if (this.data.type.match(/QuadraticBezier|CubicBezier|Line/)) {
            this.curve = (Function.prototype.bind.apply(this.threeConstructor, this.pathPoints));
        } else {
            if (!this.threeConstructor) {
                this.pause();
                throw ('No Three constructor of type (case sensitive): ' + this.data.type + 'Curve3');
            }
            this.curve = new this.threeConstructor(this.pathPoints);
        }

        this.curve.closed = this.data.closed;

        this.el.emit('curve-updated');

        this.el.addEventListener("curve-point-change", this.update.bind(this));

        this.ready = true;
    },

    remove: function () {
        this.curve = null;
        this.points = null;
        this.ready = false;

        this.el.removeEventListener("curve-point-change", this.update.bind(this));
    },

    closestPointInLocalSpace: function closestPoint(point, resolution, testPoint, currentRes) {
        if (!this.ready) throw Error('Curve not instantiated yet.');
        resolution = resolution || 0.1 / this.curve.getLength();
        currentRes = currentRes || 0.5;
        testPoint = testPoint || 0.5;
        currentRes /= 2;
        var aTest = testPoint + currentRes;
        var bTest = testPoint - currentRes;
        var a = this.curve.getPointAt(aTest);
        var b = this.curve.getPointAt(bTest);
        var aDistance = a.distanceTo(point);
        var bDistance = b.distanceTo(point);
        var aSmaller = aDistance < bDistance;
        if (currentRes < resolution) {

            var tangent = this.curve.getTangentAt(aSmaller ? aTest : bTest);
            if (currentRes < resolution) return {
                result: aSmaller ? aTest : bTest,
                location: aSmaller ? a : b,
                distance: aSmaller ? aDistance : bDistance,
                normal: normalFromTangent(tangent),
                tangent: tangent
            };
        }
        if (aDistance < bDistance) {
            return this.closestPointInLocalSpace(point, resolution, aTest, currentRes);
        } else {
            return this.closestPointInLocalSpace(point, resolution, bTest, currentRes);
        }
    },

    pointPositionsString: function(pointVectors) {
        if (pointVectors) {
            var pointPositionString = "";

            for (var i = 0; i < pointVectors.length; i++) {
                pointPositionString += AFRAME.utils.coordinates.stringify(pointVectors[i]);
            }

            return pointPositionString;
        } else {
            return "";
        }
    }

});


var tempQuaternion = new THREE.Quaternion();
function normalFromTangent(tangent) {
    var lineEnd = new THREE.Vector3(0, 1, 0);
    tempQuaternion.setFromUnitVectors(zAxis, tangent);
    lineEnd.applyQuaternion(tempQuaternion);
    return lineEnd;
}

AFRAME.registerShader('line', {
    schema: {
        color: {default: '#ff0000'},
    },

    init: function (data) {
        this.material = new THREE.LineBasicMaterial(data);
    },

    update: function (data) {
        this.material = new THREE.LineBasicMaterial(data);
    },
});

AFRAME.registerComponent('draw-curve', {

    //dependencies: ['curve', 'material'],

    schema: {
        curve: {type: 'selector'}
    },

    init: function () {
        this.data.curve.addEventListener('curve-updated', this.update.bind(this));
    },

    update: function () {
        if (this.data.curve) {
            this.curve = this.data.curve.components.curve;
        }

        if (this.curve && this.curve.curve) {
            var mesh = this.el.getOrCreateObject3D('mesh', THREE.Line);

            lineMaterial = mesh.material ? mesh.material : new THREE.LineBasicMaterial({
                color: "#ff0000"
            });

            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices = this.curve.curve.getPoints(this.curve.curve.points.length * 10);

            this.el.setObject3D('mesh', new THREE.Line(lineGeometry, lineMaterial));
        }
    },

    remove: function () {
        this.data.curve.removeEventListener('curve-updated', this.update.bind(this));
        this.el.getObject3D('mesh').geometry = new THREE.Geometry();
    }

});

AFRAME.registerComponent('clone-along-curve', {

    //dependencies: ['curve'],

    schema: {
        curve: {type: 'selector'},
        spacing: {default: 1},
        rotation: {
            type: 'vec3',
            default: '0 0 0'
        },
        scale: {
            type: 'vec3',
            default: '1 1 1'
        }
    },

    init: function () {
        this.el.addEventListener('model-loaded', this.update.bind(this));
        this.data.curve.addEventListener('curve-updated', this.update.bind(this));
    },

    update: function () {
        this.remove();

        if (this.data.curve) {
            this.curve = this.data.curve.components.curve;
        }

        if (!this.el.getObject3D('clones') && this.curve && this.curve.curve) {
            var mesh = this.el.getObject3D('mesh');

            var length = this.curve.curve.getLength();
            var start = 0;
            var counter = start;

            var cloneMesh = this.el.getOrCreateObject3D('clones', THREE.Group);

            var parent = new THREE.Object3D();
            mesh.scale.set(this.data.scale.x, this.data.scale.y, this.data.scale.z);
            mesh.rotation.set(degToRad(this.data.rotation.x), degToRad(this.data.rotation.y), degToRad(this.data.rotation.z));
            mesh.rotation.order = 'YXZ';

            parent.add(mesh);

            while (counter <= length) {
                var child = parent.clone(true);

                child.position.copy(this.curve.curve.getPointAt(counter / length));

                tangent = this.curve.curve.getTangentAt(counter / length).normalize();

                child.quaternion.setFromUnitVectors(zAxis, tangent);

                cloneMesh.add(child);

                counter += this.data.spacing;
            }
        }
    },

    remove: function () {
        this.curve = null;
        if (this.el.getObject3D('clones')) {
            this.el.removeObject3D('clones');
        }
    }

});

AFRAME.registerPrimitive('a-draw-curve', {
    defaultComponents: {
        'draw-curve': {},
    },
    mappings: {
        curveref: 'draw-curve.curve',
    }
});

AFRAME.registerPrimitive('a-curve-point', {
    defaultComponents: {
        'curve-point': {},
    },
    mappings: {}
});

AFRAME.registerPrimitive('a-curve', {
    defaultComponents: {
        'curve': {}
    },

    mappings: {
        type: 'curve.type',
    }
});

},{}]},{},[1]);
