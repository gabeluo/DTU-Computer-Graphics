window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	var max_verts = 1000;
	var index = 0;
	var numPoints = 0;
	
	var colors = [
		vec4(0.0, 0.0, 0.0, 1.0), // black
		vec4(1.0, 0.0, 0.0, 1.0), // red
		vec4(1.0, 1.0, 0.0, 1.0), // yellow
		vec4(0.0, 1.0, 0.0, 1.0), // green
		vec4(0.0, 0.0, 1.0, 1.0), // blue
		vec4(1.0, 0.0, 1.0, 1.0), // magenta
		vec4(0.0, 1.0, 1.0, 1.0), // cyan
		vec4(1.0, 1.0, 1.0, 1.0), // white
		vec4(0.3921, 0.5843, 0.9294, 1.0), // cornflower
	];
	
	// default drawing color is black
	var cIndex = 0;
	// default clear color is cornflower
	var clearColorIndex = 8;
	
	gl.clearColor(colors[clearColorIndex][0], colors[clearColorIndex][1], colors[clearColorIndex][2], colors[clearColorIndex][3]);
	
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	var canvas = document.getElementById("gl-canvas");
	var colorMenu = document.getElementById("colorMenu");
	var clearMenu = document.getElementById("clearMenu");
	var clearButton = document.getElementById("clearButton");
	
	var v_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, v_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "a_Position");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	// colour
	var c_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, c_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec4'], gl.STATIC_DRAW);
	
	var vColor = gl.getAttribLocation(program, "a_Color");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	
	render(gl, numPoints);
	
	var mousepos = vec2(0.0, 0.0);
	canvas.addEventListener("click", function (ev) {
		var bbox = ev.target.getBoundingClientRect();
		mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, v_buffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));
		
		gl.bindBuffer(gl.ARRAY_BUFFER, c_buffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec4'], flatten(vec4(colors[cIndex])));
		
		numPoints = Math.max(numPoints, ++index);
		index %= max_verts;
		render(gl, numPoints);
	});
	
	colorMenu.addEventListener("click", function (ev) {
		cIndex = colorMenu.selectedIndex;
	});
	
	clearMenu.addEventListener("click", function (ev) {
		clearColorIndex = clearMenu.selectedIndex;
	});
	
	clearButton.addEventListener("click", function (ev) {
		numPoints = 0;
		index = 0;
		gl.clearColor(colors[clearColorIndex][0], colors[clearColorIndex][1], colors[clearColorIndex][2], colors[clearColorIndex][3]);
		render(gl, numPoints);
	});
}

function render(gl, numPoints) {
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.POINTS, 0, numPoints);
}