// Global variable declaration to be used by the render function
points = [];
triangles = [];

window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	var max_verts = 10000;
	var index = 0;
	var trianglePoints = 0;
	
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
	var cIndex = 0;
	var clearColorIndex = 8;
	
	var drawMode = 0; // 0 = points, 1 = triangles
	
	// set the default clear colour to cornflower
	gl.clearColor(colors[clearColorIndex][0], colors[clearColorIndex][1], colors[clearColorIndex][2], colors[clearColorIndex][3]);
	
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	// define HTML elements
	var canvas = document.getElementById("gl-canvas");
	var colorMenu = document.getElementById("colorMenu");
	var clearMenu = document.getElementById("clearMenu");
	var clearButton = document.getElementById("clearButton");
	
	// vertex buffer
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
	
	render(gl);
	
	var mousepos = vec2(0.0, 0.0);
	
	// event listeners
	canvas.addEventListener("click", function (ev) {
		var bbox = ev.target.getBoundingClientRect();
		mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, v_buffer);
		if (drawMode == 1 && trianglePoints == 2) {
			points.pop()
			triangles.push(points.pop());
			trianglePoints = 0;
		}
		else {
			points.push(index);
			if (drawMode == 1) {
				trianglePoints++;
			}
		}
		gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));
		gl.bindBuffer(gl.ARRAY_BUFFER, c_buffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec4'], flatten(vec4(colors[cIndex])));
		index++;
		index %= max_verts;
		render(gl);
	});
	
	colorMenu.addEventListener("click", function (ev) {
		cIndex = colorMenu.selectedIndex;
	});
	
	clearMenu.addEventListener("click", function (ev) {
		clearColorIndex = clearMenu.selectedIndex;
	});
	
	clearButton.addEventListener("click", function (ev) {
		points = [];
		triangles = [];
		index = 0;
		gl.clearColor(colors[clearColorIndex][0], colors[clearColorIndex][1], colors[clearColorIndex][2], colors[clearColorIndex][3]);
		render(gl);
	});
	
	pointMode.addEventListener("click", function (ev) {
		drawMode = 0;
	});
	
	triangleMode.addEventListener("click", function (ev) {
		drawMode = 1;
		trainglePoints = 0;
	});
}

function render(gl) {
	gl.clear(gl.COLOR_BUFFER_BIT);

	var counter = 0;
	var temp = points[0];
	// points
	for (let i = 0; i<points.length; i++) {
		if (points[i] == temp) {
			temp = points[i]+1;
			if (i == points.length-1) {
				if (i == 0){
					gl.drawArrays(gl.POINTS, points[i], 1)
				} else {
					gl.drawArrays(gl.POINTS, points[i-counter], counter+1)
				}
			}
			counter++;
		}
		else {
			gl.drawArrays(gl.POINTS, points[i-counter], counter)
			temp = points[i]+1;
			counter = 1;
			if (i == points.length-1) {
				gl.drawArrays(gl.POINTS, points[i], 1)
			}
		}
	}
	
	// triangles
	counter = 0
	temp = triangles[0];
	for (let i = 0; i<triangles.length; i++) {
		if (triangles[i] == temp) {
			temp = triangles[i]+3;
			if (i == triangles.length-1) {
				if (i == 0){
					gl.drawArrays(gl.TRIANGLES, triangles[i], 3)
				} else {
					gl.drawArrays(gl.TRIANGLES, triangles[i-counter], (counter+1)*3)
				}
			}
			counter++;
		}
		else {
			gl.drawArrays(gl.TRIANGLES, triangles[i-counter], counter*3)
			temp = triangles[i]+3;
			counter = 1;
			if (i == triangles.length-1) {
				gl.drawArrays(gl.TRIANGLES, triangles[i], 3)
			}
		}
	}
}