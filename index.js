/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	/* global AFRAME */

	if (typeof AFRAME === 'undefined') {
	    throw new Error('Component attempted to register before AFRAME was available.');
	}

	/**
	 * Curve component for A-Frame to deal with spline curves
	 */
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
	            oneOf: ['CatmullRom', 'CubicBezier', 'QuadraticBezier', 'Line']
	        },
	        relPoints :{
	        	type: 'boolean',
	        	default: false
	        },
	        closed: {
	            type: 'boolean',
	            default: false
	        }
	    },

	    init: function () {
	        this.pathPoints = null;
	        this.curve = null;

	        this.el.addEventListener("curve-point-change", this.update.bind(this));
	    },

	    update: function (oldData) {

	        this.points = Array.from(this.el.querySelectorAll("a-curve-point, [curve-point]"));

	        if (this.points.length <= 1) {
	            console.warn("At least 2 curve-points needed to draw a curve");
	            this.curve = null;
	        } else {
	            // Get Array of Positions from Curve-Points
	            var pointsArray = [];
	            for (var k=0; k<this.points.length; k++){
	                let tmp = this.points[k].attributes['position'].value.trim().split(' ');
	                if (tmp.length==2) tmp[2] = "0"; // Add a Z=0 coordinate if not specified

	                // Make point relative to previous one?
	                if (this.data.relPoints && k>0) {
	                	tmp[0] = pointsArray[k-1].x + tmp[0]*1; 
	                	tmp[1] = pointsArray[k-1].y + tmp[1]*1;
	                	tmp[2] = pointsArray[k-1].z + tmp[2]*1; 
	            	} else {
		                if (tmp[0].startsWith('+')) tmp[0] = pointsArray[k-1].x + tmp[0].substring(1)*1; // Set x relative to the previous point.
		                if (tmp[1].startsWith('+')) tmp[1] = pointsArray[k-1].y + tmp[1].substring(1)*1; // Set y relative to the previous point.
		                if (tmp[2].startsWith('+')) tmp[2] = pointsArray[k-1].z + tmp[2].substring(1)*1; // Set z relative to the previous point.
		            } 

	                var x = new THREE.Object3D();
	                x.position.x = tmp[0]*1;
	                x.position.y = tmp[1]*1;
	                x.position.z = tmp[2]*1;
	                pointsArray.push(x.getWorldPosition());
	            }



	            // Update the Curve if either the Curve-Points or other Properties changed
	            if (!AFRAME.utils.deepEqual(pointsArray, this.pathPoints) || (oldData !== 'CustomEvent' && !AFRAME.utils.deepEqual(this.data, oldData))) {
	                this.curve = null;

	                this.pathPoints = pointsArray;

	                // TODO: Make other Curve-Types work
	                //this.threeConstructor = THREE[this.data.type + 'Curve3'];
	                this.threeConstructor = THREE['CatmullRomCurve3'];

	                if (!this.threeConstructor) {
	                    throw new Error('No Three constructor of type (case sensitive): ' + this.data.type + 'Curve3');
	                }

	                // Create Curve
	                this.curve = new this.threeConstructor(this.pathPoints);
	                this.curve.closed = this.data.closed;

	                this.el.emit('curve-updated');
	            }
	        }

	    },

	    remove: function () {
	        this.el.removeEventListener("curve-point-change", this.update.bind(this));
	    },

	    closestPointInLocalSpace: function closestPoint(point, resolution, testPoint, currentRes) {
	        if (!this.curve) throw Error('Curve not instantiated yet.');
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
	                color: "#ff0000",
	                linewidth:10
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
	        relpoints: 'curve.relPoints',
	    }
	});


/***/ }
/******/ ]);
