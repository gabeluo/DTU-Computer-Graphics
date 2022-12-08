var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model
var shadow_g_drawingInfo = null; // The information for drawing 3D model
var teapotProgram = null;
var tableProgram = null;

window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas, { alpha: false, stencil: true });
	
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	var imageLoaded = false;
	var rotate = true;
	var jump = false;
	var movingUp = false;

	var P = perspective(65, 1, 0.1, 10);
	var eyePos = vec3(0.0, 0.0, 1.0);
	var eyeUp = vec3(0.0, 1.0, 0.0);
	var eyeAt = vec3(0.0, 0.0, -3.0);
	var V = lookAt(eyePos, eyeAt, eyeUp);
	var lightP = perspective(105, 1, 0.5, 4.75);
	var lighteyeUp = vec3(0.0, 1.0, 0.0);
	var lighteyeAt = vec3(0.0, -3.0, -2.0)
	var modelMatrix;
	var reflectionP;
	var reflectionClipPlane = findClipPlane(V);

	// initialize programs
	var shadowProgram = initShaders(gl, "shadow-vertex-shader", "shadow-fragment-shader");
	teapotProgram = initShaders(gl, "teapot-vertex-shader", "teapot-fragment-shader");
	tableProgram = initShaders(gl, "table-vertex-shader", "table-fragment-shader");
	
	// create the shadow map
	gl.useProgram(shadowProgram);
	var fbo = initFramebufferObject(gl, 2048, 2048);
	var texMapScale = vec2(1.0/fbo.width, 1.0/fbo.height);
	var shadowModel = initObject(gl, "./teapot/teapot.obj", 0.25, shadowProgram);

	var shadowPerspectiveMatrixLoc = gl.getUniformLocation(shadowProgram,"u_Perspective");
	gl.uniformMatrix4fv(shadowPerspectiveMatrixLoc, false, flatten(lightP));
	var shadowViewMatrixLoc = gl.getUniformLocation(shadowProgram,"u_View");
	var shadowModelMatrixLoc = gl.getUniformLocation(shadowProgram,"u_Model");

	// teapot
	gl.useProgram(teapotProgram);
	var model = initObject(gl, "./teapot/teapot.obj", 0.25, teapotProgram);

	var lightRadius = 2.0;
	var lightAlpha = 0.0;
	var lightPos = vec4(lightRadius*Math.sin(lightAlpha), 2, lightRadius*Math.cos(lightAlpha)-2, 1.0);

	var teapotHeight = -1.0;

	var lightIntensity = vec3(8.0, 8.0, 8.0);
	var diffusionCoefficient = 1.0;
	var ambientIntensity = 0.1;
	var specularCoefficient = 0.5;
	var shininessCoefficient = 500.0;

	var cameraPositionLoc = gl.getUniformLocation(teapotProgram,"u_cameraPosition");
	var teapotLightPositionLoc = gl.getUniformLocation(teapotProgram,"u_lightPosition");
	var teapotLightIntensityLoc = gl.getUniformLocation(teapotProgram,"u_lightIntensity");
	var teapotDiffusionCoefficientLoc = gl.getUniformLocation(teapotProgram,"u_diffuseCoefficient");
	var teapotAmbientIntensityLoc = gl.getUniformLocation(teapotProgram,"u_ambientIntensity");
	var teapotSpecularCoefficientLoc = gl.getUniformLocation(teapotProgram,"u_specularCoefficient");
	var teapotShininessCoefficientLoc = gl.getUniformLocation(teapotProgram,"u_shininessCoefficient");
	var teapotPerspectiveMatrixLoc = gl.getUniformLocation(teapotProgram,"u_Perspective");
	var teapotNormalMatrixLoc = gl.getUniformLocation(teapotProgram,"u_NormalMatrix");
	var teapotViewMatrixLoc = gl.getUniformLocation(teapotProgram,"u_View");
	var teapotModelMatrixLoc = gl.getUniformLocation(teapotProgram,"u_Model");
	var teapotReflectionMatrixLoc = gl.getUniformLocation(teapotProgram,"u_Reflection");
	var teapotLightViewMatrixLoc = gl.getUniformLocation(teapotProgram,"u_Light_View");
	var teapotLightPerspectiveMatrixLoc = gl.getUniformLocation(teapotProgram,"u_Light_Perspective");
	var teapottexMapScaleLoc = gl.getUniformLocation(teapotProgram,"texmapscale");

	// marble background rectangle
	gl.useProgram(tableProgram);
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
		gl.activeTexture(gl.TEXTURE1);
		var textureMarble = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, textureMarble);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		gl.generateMipmap(gl.TEXTURE_2D);
	
		gl.uniform1i(gl.getUniformLocation(tableProgram, "marbletexMap"), 1);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	};
	image.src = 'xamp23.png';

	var tablePerspectiveMatrixLoc = gl.getUniformLocation(tableProgram,"u_Perspective");
	var tableViewMatrixLoc = gl.getUniformLocation(tableProgram,"u_View");
	var tableLightViewMatrixLoc = gl.getUniformLocation(tableProgram,"u_Light_View");
	var tableLightPerspectiveMatrixLoc = gl.getUniformLocation(tableProgram,"u_Light_Perspective");
	var tableAmbientIntensityLoc = gl.getUniformLocation(tableProgram,"u_ambientIntensity");
	var tabletexMapScaleLoc = gl.getUniformLocation(tableProgram,"texmapscale");

	// event listeners
	toggleRotation.addEventListener("click", function (ev) {
		rotate = !rotate;
	});
	toggleMovement.addEventListener("click", function (ev) {
		jump = !jump;
	});
	document.getElementById("lightIntensity").oninput = function () {
		lightIntensity = vec3(document.getElementById("lightIntensity").value, document.getElementById("lightIntensity").value, document.getElementById("lightIntensity").value);
	};
	document.getElementById("ambientIntensity").oninput = function () {
		ambientIntensity = document.getElementById("ambientIntensity").value;
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
			if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete() && !shadow_g_drawingInfo) {
				// OBJ and all MTLs are available
				g_drawingInfo = onReadComplete(gl, model, g_objDoc);
				shadow_g_drawingInfo = onReadComplete(gl, shadowModel, g_objDoc);
			}
		
			if (!g_drawingInfo) return;
			if (!shadow_g_drawingInfo) return;

			// movement
			if (jump) {
				if (movingUp)
					teapotHeight += 0.01;
				else
					teapotHeight -= 0.01;
				if (teapotHeight >= 0.0)
					movingUp = false;
				if (teapotHeight <= -1.8)
					movingUp = true;
			}

			if (rotate)
				lightAlpha += 0.02;
			
			// recalculate values
			lightPos = vec4(lightRadius*Math.sin(lightAlpha), 2.0, lightRadius*Math.cos(lightAlpha)-2.0, 1);
			modelMatrix = translate(vec3(0.0, teapotHeight, -3));
			lightV = lookAt(vec3(lightPos[0], lightPos[1], lightPos[2]), lighteyeAt, lighteyeUp);

			// create shadow map
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			gl.viewport(0, 0, fbo.width, fbo.height);
			gl.clearColor(1.0, 1.0, 1.0, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.enable(gl.DEPTH_TEST);
			gl.disable(gl.STENCIL_TEST);

			gl.useProgram(shadowProgram);
			gl.uniformMatrix4fv(shadowViewMatrixLoc, false, flatten(lightV));

			// draw shadow ground
			initAttributeVariable(gl, shadowProgram.a_Position, positionbuffer);
			gl.uniformMatrix4fv(shadowModelMatrixLoc, false, flatten(mat4()));
			gl.drawArrays(gl.TRIANGLES, 0, 6);

			// draw shadow teapot
			initAttributeVariable(gl, shadowProgram.a_Position, shadowModel.vertexBuffer);
			initAttributeVariable(gl, shadowProgram.a_Normal, shadowModel.normalBuffer);
			initAttributeVariable(gl, shadowProgram.a_Color, shadowModel.colorBuffer);
			gl.uniformMatrix4fv(shadowModelMatrixLoc, false, flatten(modelMatrix));
			gl.drawElements(gl.TRIANGLES, shadow_g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
			gl.clearStencil(0);

			//create stencil buffer
			gl.enable(gl.STENCIL_TEST);
			gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
			gl.stencilFunc(gl.ALWAYS, 1, ~0);
			gl.colorMask(0,0,0,0);
			gl.disable(gl.DEPTH_TEST);
			
			// draw mirror surface, the table to stencil buffer
			drawTable(false);

			gl.stencilFunc(gl.EQUAL, 1, ~0); // match mirror’s visible pixels
			gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // do not change stencil values
			gl.colorMask(1,1,1,1); //  restore color mask
			gl.enable(gl.DEPTH_TEST); // enable depth test

			// reflected teapot
			reflectionP = modifyProjectionMatrix(reflectionClipPlane, P);
			drawTeapot(true, reflectionP);

			gl.disable(gl.STENCIL_TEST);
			gl.clear(gl.DEPTH_BUFFER_BIT);

			// draw table
			drawTable(true);

			// draw real teapot
			drawTeapot(false, P);
		}
	}

	function drawTable(alphaBlend){
		gl.useProgram(tableProgram);
		initAttributeVariable(gl, tableProgram.a_Position, positionbuffer);
		initAttributeVariable(gl, tableProgram.a_TexCoord, tBuffer);
		if (alphaBlend) {
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		}
		gl.uniformMatrix4fv(tableViewMatrixLoc, false, flatten(V));
		gl.uniformMatrix4fv(tableLightViewMatrixLoc, false, flatten(lightV));
		gl.uniformMatrix4fv(tableLightPerspectiveMatrixLoc, false, flatten(lightP));
		gl.uniformMatrix4fv(tablePerspectiveMatrixLoc, false, flatten(P));
		gl.uniform1f(tableAmbientIntensityLoc, ambientIntensity);
		gl.uniform2fv(tabletexMapScaleLoc, texMapScale);
		gl.uniform1i(gl.getUniformLocation(tableProgram, "shadowMap"), 0);
		gl.uniform1i(gl.getUniformLocation(tableProgram, "marbletexMap"), 1);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		if (alphaBlend)
			gl.disable(gl.BLEND);
	}

	function drawTeapot(reflection, perspectiveMatrix) {
		gl.useProgram(teapotProgram);
		initAttributeVariable(gl, teapotProgram.a_Position, model.vertexBuffer);
		initAttributeVariable(gl, teapotProgram.a_Normal, model.normalBuffer);
		initAttributeVariable(gl, teapotProgram.a_Color, model.colorBuffer);
		var N = normalMatrix(modelMatrix, true);
		gl.uniform3fv(cameraPositionLoc, eyePos);
		gl.uniform4fv(teapotLightPositionLoc, flatten(lightPos));
		gl.uniform3fv(teapotLightIntensityLoc, flatten(lightIntensity));
		gl.uniform1f(teapotAmbientIntensityLoc, ambientIntensity);
		gl.uniform1f(teapotDiffusionCoefficientLoc, diffusionCoefficient);
		gl.uniform1f(teapotSpecularCoefficientLoc, specularCoefficient);
		gl.uniform1f(teapotShininessCoefficientLoc, shininessCoefficient);
		gl.uniformMatrix4fv(teapotViewMatrixLoc, false, flatten(V));
		gl.uniformMatrix4fv(teapotPerspectiveMatrixLoc, false, flatten(perspectiveMatrix));
		gl.uniformMatrix4fv(teapotLightViewMatrixLoc, false, flatten(lightV));
		gl.uniformMatrix4fv(teapotLightPerspectiveMatrixLoc, false, flatten(lightP));
		gl.uniformMatrix4fv(teapotModelMatrixLoc, false, flatten(modelMatrix));
		gl.uniformMatrix3fv(teapotNormalMatrixLoc, false, flatten(N));
		gl.uniform1i(gl.getUniformLocation(teapotProgram, "shadowMap"), 0);
		gl.uniform2fv(teapottexMapScaleLoc, texMapScale);
		var R = mat4();
		if (reflection) {
			var V_r = vec3(0.0, 1.0, 0.0);
			var P_r = vec3(0.0, -1.0, -3.0);
			R[0][0] = 1.0-2.0*Math.pow(V_r[0],2.0);
			R[0][1] = -2.0*V_r[0]*V_r[1];
			R[0][2] = -2.0*V_r[0]*V_r[2];
			R[0][3] = 2.0*(dot(P_r, V_r))*V_r[0];
			R[1][0] = -2.0*V_r[0]*V_r[1];
			R[1][1] = 1.0-2.0*Math.pow(V_r[1],2.0);
			R[1][2] = -2.0*V_r[1]*V_r[2];
			R[1][3] = 2.0*(dot(P_r, V_r))*V_r[1];
			R[2][0] = -2.0*V_r[0]*V_r[2];
			R[2][1] = -2.0*V_r[1]*V_r[2];
			R[2][2] = 1.0-2.0*Math.pow(V_r[2],2.0);
			R[2][3] = 2.0*(dot(P_r, V_r))*V_r[2];
		}
		gl.uniformMatrix4fv(teapotReflectionMatrixLoc, false, flatten(R));
		gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
	}

}

function findClipPlane(viewMatrix) {
	var N = vec3(0.0, -1.0, 0.0);
	var P = vec3(0.0, -1.0, -3.0);

	var plane = vec4(N, -1.0*dot(N, P));
	var viewMatrix = transpose(inverse(viewMatrix));

	return mult(viewMatrix, plane);
}

function initObject(gl, obj_filename, scale, program)
{
	program.a_Position = gl.getAttribLocation(program, 'a_Position');
	program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
	program.a_Color = gl.getAttribLocation(program, 'a_Color');
	// Prepare empty buffer objects for vertex coordinates, colors, and normals
	var model = initVertexBuffers(gl, program);
	// Start reading the OBJ file
	readOBJFile(obj_filename, gl, model, scale, true);
	return model;
}

function initVertexBuffers(gl, program) {
	var o = new Object();
	o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
	o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
	o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
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
	gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

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

function initFramebufferObject(gl, width, height)
{
	var framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	var renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
	var shadowMap = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, shadowMap);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	framebuffer.texture = shadowMap;
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

	var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	if (status !== gl.FRAMEBUFFER_COMPLETE) {
		console.log('Framebuffer object is incomplete: ' + status.toString());
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	framebuffer.width = width; framebuffer.height = height;
	return framebuffer;
}

function modifyProjectionMatrix(clipplane, projection) {
	// MV.js has no copy constructor for matrices
	var oblique = mult(mat4(), projection);
	var q = vec4((Math.sign(clipplane[0]) + projection[0][2])/projection[0][0],
	(Math.sign(clipplane[1]) + projection[1][2])/projection[1][1],
	-1.0,
	(1.0 + projection[2][2])/projection[2][3]);
	var s = 2.0/dot(clipplane, q);
	oblique[2] = vec4(clipplane[0]*s, clipplane[1]*s,
	clipplane[2]*s + 1.0, clipplane[3]*s);
	return oblique;
}