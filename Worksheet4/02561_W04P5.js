var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

var pointsArray = [];
var normalsArray = [];

var index = 0;

window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	numSubdivs = 5;
	
	var cameraPosition = vec3(0.0, 0.0, 0.0);
	var cameraAim = vec3(0.0, 0.0, 0.0);
	var V;

	var P = perspective(45, 1, 0.1, 100);

	var lightEmission = vec3(1.0, 1.0, 1.0);
	var lightDirectionVec = vec4(0.0, 0.0, -1.0, 0.0);
	var diffusionCoefficient = 0.5;
	var ambientCoefficient = 0.5;
	var specularCoefficient = 0.5;
	var shininessCoefficient = 500.0;

	var cameraRadius = 4;
	var cameraAlpha = 0;
	var rotate = true;

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
		
	gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(gl.program);

	gl.vBuffer = null;
	initSphere(gl, numSubdivs);
	
	var viewMatrix = gl.getUniformLocation(gl.program,"u_View");

	var perspectiveMatrix = gl.getUniformLocation(gl.program,"u_Perspective");
	gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(P));

	var cameraPositionLoc = gl.getUniformLocation(gl.program,"u_cameraPosition");

	var cameraAimLoc = gl.getUniformLocation(gl.program,"u_cameraAim");
	gl.uniform3fv(cameraAimLoc, flatten(cameraAim));

	var lightDirection = gl.getUniformLocation(gl.program,"u_lightDirection");
	gl.uniform4fv(lightDirection, flatten(lightDirectionVec));

	var lightEmissionLoc = gl.getUniformLocation(gl.program,"u_lightEmission");
	var diffusionCoefficientLoc = gl.getUniformLocation(gl.program,"u_diffuseCoefficient");
	var ambientCoefficientLoc = gl.getUniformLocation(gl.program,"u_ambientCoefficient");
	var specularCoefficientLoc = gl.getUniformLocation(gl.program,"u_specularCoefficient");
	var shininessCoefficientLoc = gl.getUniformLocation(gl.program,"u_shininessCoefficient");

	incrementSubd.addEventListener("click", function (ev) {
		numSubdivs++;
		pointsArray = [];
		normalsArray = [];
		initSphere(gl, numSubdivs);
		render(gl);
	});
	decrementSubd.addEventListener("click", function (ev) {
		if (numSubdivs) {
			numSubdivs--;
			pointsArray = [];
			normalsArray = [];
			initSphere(gl, numSubdivs);
			render(gl);
		}
	});
	toggleRotation.addEventListener("click", function (ev) {
		rotate = !rotate;
	});

	document.getElementById("emittedRadience").oninput = function () {
		lightEmission = vec3(document.getElementById("emittedRadience").value, document.getElementById("emittedRadience").value, document.getElementById("emittedRadience").value);
	};
	document.getElementById("ambientCoefficient").oninput = function () {
		ambientCoefficient = document.getElementById("ambientCoefficient").value;
	};
	document.getElementById("diffuseCoefficient").oninput = function () {
		diffusionCoefficient = document.getElementById("diffuseCoefficient").value;
	};
	document.getElementById("specularCoefficient").oninput = function () {
		specularCoefficient = document.getElementById("specularCoefficient").value;
	};
	document.getElementById("shininessCoefficient").oninput = function () {
		shininessCoefficient = document.getElementById("shininessCoefficient").value;
	};

	function animate() {
		cameraPosition = vec3(cameraRadius*Math.sin(cameraAlpha), 0, cameraRadius*Math.cos(cameraAlpha));
		if (rotate)
			cameraAlpha += 0.04;
		V = lookAt(cameraPosition, cameraAim, vec3(0, 1, 0));
		gl.uniformMatrix4fv(viewMatrix, false, flatten(V));
		gl.uniform3fv(cameraPositionLoc, flatten(cameraPosition));
		gl.uniform3fv(lightEmissionLoc, flatten(lightEmission));
		gl.uniform1f(ambientCoefficientLoc, ambientCoefficient);
		gl.uniform1f(diffusionCoefficientLoc, diffusionCoefficient);
		gl.uniform1f(specularCoefficientLoc, specularCoefficient);
		gl.uniform1f(shininessCoefficientLoc, shininessCoefficient);
		render(gl);
		requestAnimationFrame(animate);
	}
	animate();
}

function render(gl) {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function initSphere(gl, numSubdivs) {
	tetrahedron(va, vb, vc, vd, numSubdivs);
	gl.deleteBuffer(gl.vBuffer);
	gl.vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(gl.program, "a_Position");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	var colors = []
	for (var i=0; i<pointsArray.length; i++) {
		colors[i] = vec4(0.5*pointsArray[i][0]+0.5, 0.5*pointsArray[i][1]+0.5, 0.5*pointsArray[i][2]+0.5, 0.5*pointsArray[i][3]+0.5);
	}
	var colorbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
	
	var vColor = gl.getAttribLocation(gl.program, "a_Color");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation(gl.program, "a_Normal" );
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
}

function tetrahedron(a, b, c, d, n)
{
	divideTriangle(a, b, c, n);
	divideTriangle(d, c, b, n);
	divideTriangle(a, d, b, n);
	divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count)
{
	if (count > 0) {
		var ab = normalize(mix(a, b, 0.5), true);
		var ac = normalize(mix(a, c, 0.5), true);
		var bc = normalize(mix(b, c, 0.5), true);
		divideTriangle(a, ab, ac, count - 1);
		divideTriangle(ab, b, bc, count - 1);
		divideTriangle(bc, c, ac, count - 1);
		divideTriangle(ab, bc, ac, count - 1);
	}
	else {
		triangle(a, b, c);
	}
}

function triangle(a, b, c) {
	pointsArray.push(a);
	pointsArray.push(b);
	pointsArray.push(c);

	normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
	normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
	normalsArray.push(vec4(c[0], c[1], c[2], 0.0));
}
	