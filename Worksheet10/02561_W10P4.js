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

	var q_rot = new Quaternion();
	var q_inc = new Quaternion();

	dollyDist = 4;
	var P = perspective(30, 1, 0.1, 300);
	var eye = vec3(0, 0, dollyDist);
	var up = vec3(0, 1, 0);
	var at = vec3(0, 0, 0);
	var z = vec3([eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]]);
	q_rot = q_rot.make_rot_vec2vec(vec3(0, 0, 1), normalize(z));
	pan_disp = vec2(0,0);
	var T = translate(0, -0.5, 0);
	var C, x_rot, y_rot;
	
	var viewMatrixLoc = gl.getUniformLocation(gl.program,"u_View");
	var perspectiveMatrixLoc = gl.getUniformLocation(gl.program,"u_Perspective");
	var transformationMatrixLoc = gl.getUniformLocation(gl.program,"u_Transformation");

	initEventHandlers(canvas, q_inc, q_rot);
	
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
		q_rot = q_rot.multiply(q_inc);
		x_rot = q_rot.apply(vec3(1,0,0));
		y_rot = q_rot.apply(up);
		C = vec3(at[0] - pan_disp[0]*x_rot[0] - pan_disp[1]*y_rot[0], at[1] - pan_disp[0]*x_rot[1] - pan_disp[1]*y_rot[1], at[2] - pan_disp[0]*x_rot[2] - pan_disp[1]*y_rot[2]);
		V = lookAt(add(q_rot.apply(vec3(0, 0, dollyDist)), C), C, y_rot);

		gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V));
		gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(P));
		gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(T));
		gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
	}
}

function initEventHandlers(canvas, qinc, qrot) {
	var dragging = false; // Dragging or not
	var lastX = -1, lastY = -1; // Last position of the mouse
	var current_action = 3; // Actions: 0 - orbit, 1 - pan, 2 - dolly, 3 - none

	canvas.onmousedown = function(ev) { // Mouse is pressed
		ev.preventDefault();
		var x = ev.clientX, y = ev.clientY;
		// Start dragging if a mouse is in <canvas>
		var rect = ev.target.getBoundingClientRect();
		if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
			lastX = x; lastY = y;
			dragging = true;
			current_action = ev.button;
		}
	};

	// Mouse is released
	canvas.onmouseup = function(ev) {
		dragging = false;
		var x = ev.clientX, y = ev.clientY;
		// Only stop when orbiting, if dollying or panning it should not affect the spinning
		if (x == lastX && y == lastY && current_action == 0) {
			qinc.setIdentity();
		}
		current_action = 3; // reset the action
	};

	canvas.oncontextmenu = function (ev) { ev.preventDefault(); };

	var g_last = Date.now();
	canvas.onmousemove = function(ev) { // Mouse is moved
		var x = ev.clientX, y = ev.clientY;
		
		if (dragging) {
			var now = Date.now();
			var elapsed = now - g_last;
			if (elapsed > 20) {
				g_last = now;
				var bbox = ev.target.getBoundingClientRect();
				var mousepos = vec2(2*(x - bbox.left)/canvas.width - 1, 2*(canvas.height - y + bbox.top - 1)/canvas.height - 1);
				var lastmousepos = vec2(2*(lastX - bbox.left)/canvas.width - 1, 2*(canvas.height - lastY + bbox.top - 1)/canvas.height - 1);
		
				switch (current_action) {
					case 0: { // orbit
						var v1 = vec3([mousepos[0], mousepos[1], project_to_sphere(mousepos[0], mousepos[1])]);
						var v2 = vec3([lastmousepos[0], lastmousepos[1], project_to_sphere(lastmousepos[0], lastmousepos[1])]);
						qinc = qinc.make_rot_vec2vec(normalize(v1), normalize(v2));
					}
					break;
					case 1: { // pan
						pan_disp[0] += (mousepos[0] - lastmousepos[0]) * dollyDist * 0.2;
						pan_disp[1] += (mousepos[1] - lastmousepos[1]) * dollyDist * 0.2;
					}
					break;
					case 2: { // dolly
						dollyDist += (mousepos[1] - lastmousepos[1]) * dollyDist;
						dollyDist = Math.min(Math.max(dollyDist, 0.75), 300);
					}
					break;
				}
				lastX = x, lastY = y;
			}
		}
	};
}

function project_to_sphere(x, y) {
	var r = 2;
	var d = Math.sqrt(x * x + y * y);
	var t = r * Math.sqrt(2);
	var z;
	if (d < r) // Inside sphere
	  z = Math.sqrt(r * r - d * d);
	else if (d < t)
	  z = 0;
	else       // On hyperbola
	  z = t * t / d;
	return z;
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