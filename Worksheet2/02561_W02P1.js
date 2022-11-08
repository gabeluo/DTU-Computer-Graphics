window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	var max_verts = 1000;
	var index = 0;
	var numPoints = 0;
	
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	var canvas = document.getElementById("gl-canvas");
	
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "a_Position");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	render(gl, numPoints);
	
	var mousepos = vec2(0.0, 0.0);
	canvas.addEventListener("click", function (ev) {
		var bbox = ev.target.getBoundingClientRect();
		mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
		gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));
		numPoints = Math.max(numPoints, ++index);
		index %= max_verts;
		render(gl, numPoints);
	});
}

function render(gl, numPoints) {
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.POINTS, 0, numPoints);
}