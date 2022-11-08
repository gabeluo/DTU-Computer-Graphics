// Global variable declaration to be used by the render function
points = [];
triangles = [];
circles = [];
numCirclePoints = 100;

window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	var max_verts = 10000;
	var index = 0;
	var trianglePoints = 0;
	var circlePoints = 0;
	var circleCentre = vec2(0,0);
	
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
	
	var drawMode = 0; // 0 = points, 1 = triangles, 2 = circles
	
	// set the default clear colour to cornflower
	gl.clearColor(colors[clearColorIndex][0], colors[clearColorIndex][1], colors[clearColorIndex][2], colors[clearColorIndex][3]);
	
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
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
	canvas.addEventListener("click", function (ev) {
		var bbox = ev.target.getBoundingClientRect();
		mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, v_buffer);
		if (drawMode == 2 && circlePoints == 1) {
			if (index + numCirclePoints+1 < max_verts) {
				circles.push(points.pop());
				var vertices = [];
				var colourVertices = [];
				var radius = Math.sqrt( Math.pow((circleCentre[0]-mousepos[0]), 2) + Math.pow((circleCentre[1]-mousepos[1]), 2) );
				for (var i = 0; i <= numCirclePoints; i++) {
					var theta = 2*Math.PI*i/numCirclePoints;
					vertices.push(vec2(radius * Math.cos(theta) + circleCentre[0], radius * Math.sin(theta) + circleCentre[1]));
					colourVertices.push(vec4(colors[cIndex]));
				}
				
				gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(vertices));
				
				gl.bindBuffer(gl.ARRAY_BUFFER, c_buffer);
				gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec4'], flatten(colourVertices));
				
				index += numCirclePoints+1;
			}
			circlePoints = 0;
		}
		else {
			if (drawMode == 1 && trianglePoints == 2) {
				points.pop()
				triangles.push(points.pop());
				trianglePoints = 0;
			}
			else {
				points.push(index);
				console.log(triangles);
				console.log(points);
				if (drawMode == 2) {
					circleCentre = mousepos;
					circlePoints++;
				}
				if (drawMode == 1) {
					trianglePoints++;
				}
			}
			gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));
			gl.bindBuffer(gl.ARRAY_BUFFER, c_buffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec4'], flatten(vec4(colors[cIndex])));
			index++;
			index %= max_verts;
		}
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
		circles = [];
		index = 0;
		gl.clearColor(colors[clearColorIndex][0], colors[clearColorIndex][1], colors[clearColorIndex][2], colors[clearColorIndex][3]);
		render(gl);
	});
	
	pointMode.addEventListener("click", function (ev) {
		drawMode = 0;
		console.log("Point Mode");
	});
	
	triangleMode.addEventListener("click", function (ev) {
		drawMode = 1;
		trainglePoints = 0;
		console.log("Triangle Mode");
	});
	
	circleMode.addEventListener("click", function (ev) {
		drawMode = 2;
		console.log("Circle Mode");
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
					console.log("pointsintial");
					gl.drawArrays(gl.POINTS, points[i], 1)
				} else {
					console.log("points1");
					gl.drawArrays(gl.POINTS, points[i-counter], counter+1)
				}
			}
			counter++;
		}
		else {
			console.log("points2");
			gl.drawArrays(gl.POINTS, points[i-counter], counter)
			temp = points[i]+1;
			counter = 1;
			if (i == points.length-1) {
				console.log("points3");
				gl.drawArrays(gl.POINTS, points[i], 1)
			}
		}
	}
	
	counter = 0
	temp = triangles[0];
	for (let i = 0; i<triangles.length; i++) {
		if (triangles[i] == temp) {
			temp = triangles[i]+3;
			console.log(i);
			if (i == triangles.length-1) {
				if (i == 0){
					console.log("triangleinitial");
					gl.drawArrays(gl.TRIANGLES, triangles[i], 3)
				} else {
					console.log("triangles1");
					console.log(counter);
					gl.drawArrays(gl.TRIANGLES, triangles[i-counter], (counter+1)*3)
				}
			}
			counter++;
		}
		else {
			console.log("triangles2");
			gl.drawArrays(gl.TRIANGLES, triangles[i-counter], counter*3)
			temp = triangles[i]+3;
			counter = 1;
			if (i == triangles.length-1) {
				console.log("triangles3");
				gl.drawArrays(gl.TRIANGLES, triangles[i], 3)
			}
		}
	}
	
/* 	for (let j = 0; j<triangles.length; j++) {
		gl.drawArrays(gl.TRIANGLES, triangles[j], 3);
	} */
	
	// Draw the circles
	for (let k = 0; k<circles.length; k++) {
		console.log(circles[k]);
		gl.drawArrays(gl.TRIANGLE_FAN, circles[k], numCirclePoints+2);
	}
}