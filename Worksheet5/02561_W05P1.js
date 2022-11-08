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

	var model = initObject(gl, "./BatarangArkham.obj", 0.01);

	var P = perspective(45, 1, 0.1, 100);
	var V = lookAt(vec3(0, 0, 4), vec3(0, 0, 0), vec3(0, 1, 0));
	var T = translate(-1.065, 0, -0.5);
	
	// Apply rotations
	var Rx = rotateX(-90);
	T = mult(Rx, T);

	var viewMatrix = gl.getUniformLocation(gl.program,"u_View");
	gl.uniformMatrix4fv(viewMatrix, false, flatten(V));

	var perspectiveMatrix = gl.getUniformLocation(gl.program,"u_Perspective");
	gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(P));

	var translationMatrix = gl.getUniformLocation(gl.program,"u_Translation");
	gl.uniformMatrix4fv(translationMatrix, false, flatten(T));

	var cameraAlpha = 0;
	var cameraRadius = 4;
	
	function tick() {
		var cameraPosition = vec3(cameraRadius*Math.sin(cameraAlpha), 0, cameraRadius*Math.cos(cameraAlpha));
		cameraAlpha += 0.04;
		V = lookAt(cameraPosition, vec3(0, 0, 0), vec3(0, 1, 0));
		gl.uniformMatrix4fv(viewMatrix, false, flatten(V));
		render(gl, model);
		requestAnimationFrame(tick);
	}
	tick();
}

function render(gl, model)
{
	if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
		// OBJ and all MTLs are available
		g_drawingInfo = onReadComplete(gl, model, g_objDoc);
	}

	if (!g_drawingInfo) return;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}


function initObject(gl, obj_filename, scale)
{
	gl.program.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	gl.program.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
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
	o.normalBuffer = createEmptyArrayBuffer(gl, gl.program.a_Normal, 3, gl.FLOAT);
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

	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

	// Write the indices to the buffer object
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

	return drawingInfo;
}