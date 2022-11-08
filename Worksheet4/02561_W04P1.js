var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

var pointsArray = [];

var index = 0;

window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	numSubdivs = 5;
	
	var V = lookAt(vec3(0.5, 0.5, 7), vec3(0, 0, 0), vec3(0, 1, 0));

	var P = perspective(45, 1, 0.1, 100);
	
	gl.enable(gl.DEPTH_TEST);
		
	gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(gl.program);

	gl.vBuffer = null;
	initSphere(gl, numSubdivs);
	
	var viewMatrix = gl.getUniformLocation(gl.program,"u_View");
	gl.uniformMatrix4fv(viewMatrix, false, flatten(V));

	var perspectiveMatrix = gl.getUniformLocation(gl.program,"u_Perspective");
	gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(P));
	
	incrementSubd.addEventListener("click", function (ev) {
		numSubdivs++;
		pointsArray = [];
		initSphere(gl, numSubdivs);
		render(gl);
	});
	decrementSubd.addEventListener("click", function (ev) {
		if (numSubdivs) {
			numSubdivs--;
			pointsArray = [];
			initSphere(gl, numSubdivs);
			render(gl);
		}
	});

	render(gl);
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
}
	