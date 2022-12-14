var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	
	gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(gl.program);

	var model = initObject(gl, "./teapot/teapot.obj", 0.25);

	var P = perspective(30, 1, 0.1, 10);
	var V = lookAt(vec3(0, 0, 4), vec3(0, 0, 0), vec3(0, 1, 0));
	var T = translate(0, -0.5, 0);

	var currentAngle = [0.0, 0.0];

	var viewMatrixLoc = gl.getUniformLocation(gl.program,"u_View");
	var perspectiveMatrixLoc = gl.getUniformLocation(gl.program,"u_Perspective");
	var transformationMatrixLoc = gl.getUniformLocation(gl.program,"u_Transformation");

	initEventHandlers(canvas, currentAngle);
	
	function tick() {
		render(gl, model);
		requestAnimationFrame(tick);
	}
	tick();

	function render(gl, model)
	{
		if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
			// OBJ and all MTLs are available
			g_drawingInfo = onReadComplete(gl, model, g_objDoc);
		}

		if (!g_drawingInfo) return;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// Apply rotations
		var Rx = rotateX(-currentAngle[0]);
		var Ry = rotateY(-currentAngle[1]);
		rotatedT = mult(Rx, mult(Ry, T));
		gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V));
		gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(P));
		gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(rotatedT));
		gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
	}
}

function initEventHandlers(canvas, currentAngle) {
	var dragging = false; // Dragging or not
	var lastX = -1, lastY = -1; // Last position of the mouse

	canvas.onmousedown = function(ev) { // Mouse is pressed
		var x = ev.clientX, y = ev.clientY;
		// Start dragging if a mouse is in <canvas>
		var rect = ev.target.getBoundingClientRect();
		if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
			lastX = x; lastY = y;
			dragging = true;
		}
	};
	// Mouse is released
	canvas.onmouseup = function(ev) {
		dragging = false;
	};

	canvas.onmousemove = function(ev) { // Mouse is moved
		var x = ev.clientX, y = ev.clientY;
		if (dragging) {
			var factor = 100/canvas.height; // The rotation ratio
			var dx = factor * (x - lastX);
			var dy = factor * (y - lastY);
			// Limit x-axis rotation angle to -90 to 90 degrees
			currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
			currentAngle[1] = currentAngle[1] + dx;
		}
		lastX = x, lastY = y;
	};
}


function initObject(gl, obj_filename, scale)
{
	gl.program.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	gl.program.a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	// Prepare empty buffer objects for vertex coordinates, colors, and normals
	var model = initVertexBuffers(gl);
	// Start reading the OBJ file
	readOBJFile(obj_filename, gl, model, scale, true);
	return model;
}

function initVertexBuffers(gl) {
	var o = new Object();
	o.vertexBuffer = createEmptyArrayBuffer(gl, gl.program.a_Position, 3, gl.FLOAT);
	o.colorBuffer = createEmptyArrayBuffer(gl, gl.program.a_Color, 4, gl.FLOAT);
	o.indexBuffer = gl.createBuffer();
	return o;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
	var buffer = gl.createBuffer(); // Create a buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	gl.enableVertexAttribArray(a_attribute); // Enable the assignment
	return buffer;
}

// Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState === 4 && request.status !== 404) {
			onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
		}
	}
	request.open('GET', fileName, true); // Create a request to get file
	request.send(); // Send the request
}

// OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
	var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
	var result = objDoc.parse(fileString, scale, reverse);
	if (!result) {
		g_objDoc = null; g_drawingInfo = null;
		console.log("OBJ file parsing error.");
		return;
	}
	g_objDoc = objDoc;
}

// OBJ File has been read completely
function onReadComplete(gl, model, objDoc) {
	// Acquire the vertex coordinates and colors from OBJ file
	var drawingInfo = objDoc.getDrawingInfo();

	// Write data into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices,gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

	// Write the indices to the buffer object
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

	return drawingInfo;
}