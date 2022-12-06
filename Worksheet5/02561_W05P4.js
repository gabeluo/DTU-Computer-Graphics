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

	var model = initObject(gl, "./BatarangArkham.obj", 0.0125);

	var P = perspective(45, 1, 0.1, 100);
	var T = translate(-1.35, 0, -0.5);
	var V;
	
	// Apply rotations
	var Rx = rotateX(-90);
	T = mult(Rx, T);

	var viewMatrix = gl.getUniformLocation(gl.program,"u_View");

	var perspectiveMatrix = gl.getUniformLocation(gl.program,"u_Perspective");
	gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(P));

	var translationMatrix = gl.getUniformLocation(gl.program,"u_Translation");
	gl.uniformMatrix4fv(translationMatrix, false, flatten(T));

	var cameraAlpha = 0;
	var cameraRadius = 4;
	var rotate = true;
	var cameraAim = vec3(0.0, 0.0, 0.0);

	var lightEmission = vec3(1.0, 1.0, 1.0);
	var lightDirectionVec = vec4(0.0, 1.0, -1.0, 0.0);
	var diffusionCoefficient = 0.5;
	var ambientCoefficient = 0.5;
	var specularCoefficient = 0.5;
	var shininessCoefficient = 500.0;

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

	function tick() {
		var cameraPosition = vec3(cameraRadius*Math.sin(cameraAlpha), 0, cameraRadius*Math.cos(cameraAlpha));
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