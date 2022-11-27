var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model
var teapotProgram = null;

window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas, { alpha: false });

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND)
	
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	var imageLoaded = false;
	var rotate = true;
	var jump = false;
	var movingUp = true;

	var P = perspective(60, 1, 0.1, 100);
	var eyePos = vec3(0.0, 2.0, 0.0);
	var eyeUp = vec3(0.0, 1.0, 0.0);
	var eyeAt = vec3(0.0, -1.0, -2.0)
	var V = lookAt(eyePos, eyeAt, eyeUp);
	var viewMatrix = mat4();
	var modelMatrix = mat4();
	var Ms = mat4();

	var visibility = 1;

	teapotProgram = initShaders(gl, "teapot-vertex-shader", "teapot-fragment-shader");
	var tableProgram = initShaders(gl, "table-vertex-shader", "table-fragment-shader");
	
	gl.useProgram(teapotProgram);
	var model = initObject(gl, "./teapot/teapot.obj", 0.25);

	var lightRadius = 2.0;
	var lightAlpha = 0.0;
	var lightPos = vec4(lightRadius*Math.sin(lightAlpha), 2, lightRadius*Math.cos(lightAlpha)-2, 1.0);
	Ms[3][3] = 0.0;
	Ms[3][1] = -1.0/(lightPos[1]+1+0.001);

	var teapotHeight = -1.0;

	var lightIntensity = vec3(1.0, 1.0, 1.0);
	var diffusionCoefficient = 0.5;
	var ambientCoefficient = 0.2;
	var specularCoefficient = 0.5;
	var shininessCoefficient = 500.0;

	var cameraPositionLoc = gl.getUniformLocation(teapotProgram,"u_cameraPosition");
	gl.uniform3fv(cameraPositionLoc, flatten(eyePos));

	var cameraAimLoc = gl.getUniformLocation(teapotProgram,"u_cameraAim");
	gl.uniform3fv(cameraAimLoc, flatten(eyeAt));

	var teapotLightPositionLoc = gl.getUniformLocation(teapotProgram,"u_lightPosition");
	var teapotLightIntensityLoc = gl.getUniformLocation(teapotProgram,"u_lightIntensity");
	var teapotDiffusionCoefficientLoc = gl.getUniformLocation(teapotProgram,"u_diffuseCoefficient");
	var teapotAmbientCoefficientLoc = gl.getUniformLocation(teapotProgram,"u_ambientCoefficient");
	var teapotSpecularCoefficientLoc = gl.getUniformLocation(teapotProgram,"u_specularCoefficient");
	var teapotShininessCoefficientLoc = gl.getUniformLocation(teapotProgram,"u_shininessCoefficient");

	var teapotPerspectiveMatrixLoc = gl.getUniformLocation(teapotProgram,"u_Perspective");
	gl.uniformMatrix4fv(teapotPerspectiveMatrixLoc, false, flatten(P));
	var teapotViewMatrixLoc = gl.getUniformLocation(teapotProgram,"u_View");
	var teapotModelMatrixLoc = gl.getUniformLocation(teapotProgram,"u_Model");
	var teapotNormalMatrixLoc = gl.getUniformLocation(teapotProgram,"u_NormalMatrix");
	var teapotVisibilityLoc = gl.getUniformLocation(teapotProgram,"u_Visibility");

	gl.useProgram(tableProgram);
	// marble background rectangle
	var vertices = [vec3(-2, -1, -1), vec3(2, -1, -1), vec3(2, -1, -5), vec3(-2, -1, -1), vec3(2, -1, -5), vec3(-2, -1, -5)];
	
	var positionbuffer = gl.createBuffer();
	positionbuffer.num = 3;
	positionbuffer.type = gl.FLOAT;
	gl.bindBuffer(gl.ARRAY_BUFFER, positionbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	
	tableProgram.a_Position = gl.getAttribLocation(tableProgram, "a_Position");
	gl.vertexAttribPointer(tableProgram.a_Position, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(tableProgram.a_Position);

	// texture coordinates
	var texCoord = [vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0)];
	var tBuffer = gl.createBuffer();
	tBuffer.num = 2;
	tBuffer.type = gl.FLOAT;
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);

	tableProgram.a_TexCoord = gl.getAttribLocation(tableProgram, "a_TexCoord");
	gl.vertexAttribPointer(tableProgram.a_TexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(tableProgram.a_TexCoord);

	// load marble image texture
	var image = document.createElement('img');
	image.crossorigin = 'anonymous';
	image.onload = function () {
		gl.useProgram(tableProgram);
		imageLoaded = true;
		gl.activeTexture(gl.TEXTURE0);
		var textureMarble = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, textureMarble);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		gl.generateMipmap(gl.TEXTURE_2D);
	
		gl.uniform1i(gl.getUniformLocation(tableProgram, "texMap"), 0);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	};
	image.src = 'xamp23.png';

	var tablePerspectiveMatrixLoc = gl.getUniformLocation(tableProgram,"u_Perspective");
	gl.uniformMatrix4fv(tablePerspectiveMatrixLoc, false, flatten(P));

	var tableViewMatrixLoc = gl.getUniformLocation(tableProgram,"u_View");

	toggleRotation.addEventListener("click", function (ev) {
		rotate = !rotate;
	});
	toggleMovement.addEventListener("click", function (ev) {
		jump = !jump;
	});
	document.getElementById("emittedRadience").oninput = function () {
		lightIntensity = vec3(document.getElementById("emittedRadience").value, document.getElementById("emittedRadience").value, document.getElementById("emittedRadience").value);
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
		render(gl, model);
		requestAnimationFrame(tick);
	}
	
	tick();

	function render(gl, model) {
		if (imageLoaded) {
			if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
				// OBJ and all MTLs are available
				g_drawingInfo = onReadComplete(gl, model, g_objDoc);
			}
		
			if (!g_drawingInfo) return;
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
			lightPos = vec4(lightRadius*Math.sin(lightAlpha), 2, lightRadius*Math.cos(lightAlpha)-2, 1);

			// draw background
			gl.useProgram(tableProgram);
			initAttributeVariable(gl, tableProgram.a_Position, positionbuffer);
			initAttributeVariable(gl, tableProgram.a_TexCoord, tBuffer);
			gl.depthFunc(gl.LESS);
			viewMatrix = V;
			visibility = 1.0;
			gl.uniformMatrix4fv(tableViewMatrixLoc, false, flatten(viewMatrix));
			gl.uniform1i(gl.getUniformLocation(tableProgram, "texMap"), 0);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
	
			// draw shadows
			gl.useProgram(teapotProgram)
			initAttributeVariable(gl, teapotProgram.a_Position, model.vertexBuffer);
			initAttributeVariable(gl, teapotProgram.a_Normal, model.normalBuffer);
			initAttributeVariable(gl, teapotProgram.a_Color, model.colorBuffer);
			gl.depthFunc(gl.GREATER);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			
			viewMatrix = mult(viewMatrix, translate(lightPos[0], lightPos[1], lightPos[2]));
			viewMatrix = mult(viewMatrix, Ms);
			viewMatrix = mult(viewMatrix, translate(-lightPos[0],-lightPos[1], -lightPos[2]));
			visibility = 0.0;
			modelMatrix = translate(vec3(0.0, teapotHeight, -3));
			var N = normalMatrix(modelMatrix, true);
			gl.uniform4fv(teapotLightPositionLoc, flatten(lightPos));
			gl.uniform3fv(teapotLightIntensityLoc, flatten(lightIntensity));
			gl.uniform1f(teapotAmbientCoefficientLoc, ambientCoefficient);
			gl.uniform1f(teapotDiffusionCoefficientLoc, diffusionCoefficient);
			gl.uniform1f(teapotSpecularCoefficientLoc, specularCoefficient);
			gl.uniform1f(teapotShininessCoefficientLoc, shininessCoefficient);
			
			gl.uniform1f(teapotVisibilityLoc, visibility);
			gl.uniformMatrix4fv(teapotModelMatrixLoc, false, flatten(modelMatrix));
			gl.uniformMatrix3fv(teapotNormalMatrixLoc, false, flatten(N));
			gl.uniformMatrix4fv(teapotViewMatrixLoc, false, flatten(viewMatrix));
			gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
	
			// draw the teapot
			gl.depthFunc(gl.LESS);
			viewMatrix = V;
			visibility = 1.0;
			gl.uniform1f(teapotVisibilityLoc, visibility);
			gl.uniformMatrix4fv(teapotViewMatrixLoc, false, flatten(viewMatrix));
			gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

			// movement
			if (rotate)
				lightAlpha += 0.02;

			if (jump) {
				if (teapotHeight >= 1.0)
					movingUp = false;
				if (teapotHeight <= -1.0)
					movingUp = true;
				if (movingUp)
					teapotHeight += 0.02;
				else
					teapotHeight -= 0.02;
			}

		}
	}
}

function initObject(gl, obj_filename, scale)
{
	teapotProgram.a_Position = gl.getAttribLocation(teapotProgram, 'a_Position');
	teapotProgram.a_Normal = gl.getAttribLocation(teapotProgram, 'a_Normal');
	teapotProgram.a_Color = gl.getAttribLocation(teapotProgram, 'a_Color');
	// Prepare empty buffer objects for vertex coordinates, colors, and normals
	var model = initVertexBuffers(gl);
	// Start reading the OBJ file
	readOBJFile(obj_filename, gl, model, scale, true);
	return model;
}

function initVertexBuffers(gl) {
	var o = new Object();
	o.vertexBuffer = createEmptyArrayBuffer(gl, teapotProgram.a_Position, 3, gl.FLOAT);
	o.normalBuffer = createEmptyArrayBuffer(gl, teapotProgram.a_Normal, 3, gl.FLOAT);
	o.colorBuffer = createEmptyArrayBuffer(gl, teapotProgram.a_Color, 4, gl.FLOAT);
	o.indexBuffer = gl.createBuffer();
	return o;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
	var buffer = gl.createBuffer(); // Create a buffer object
	buffer.num = num;
	buffer.type = type;
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

function initAttributeVariable(gl, attribute, buffer)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0);
	gl.enableVertexAttribArray(attribute);
}
