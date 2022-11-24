window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);

	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	var imageLoaded = false;
	var rotate = true;

	var P = perspective(90, 1, 0.1, 100);
	var V = lookAt(vec3(0, 0, 0), vec3(0, 0, 0), vec3(0, 1, 0));
	var modelViewMatrix = mat4();
	var Ms = mat4();

	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	var lightRadius = 2;
	var lightAlpha = 0;
	var lightPos = vec4(lightRadius*Math.sin(lightAlpha), 2, lightRadius*Math.cos(lightAlpha)-2, 1);
	Ms[3][3] = 0.0;
	Ms[3][1] = -1.0/(lightPos[1]+1);

	// marble background rectangle
	var vertices = [vec3(-2, -1, -1), vec3(2, -1, -1), vec3(2, -1, -5), vec3(-2, -1, -1), vec3(2, -1, -5), vec3(-2, -1, -5)];
	// first rectangle
	vertices.push(vec3(0.25, -0.5, -1.25), vec3(0.75, -0.5, -1.25), vec3(0.75, -0.5, -1.75), vec3(0.25, -0.5, -1.25), vec3(0.75, -0.5, -1.75), vec3(0.25, -0.5, -1.75));
	// second rectangle
	vertices.push(vec3(-1, -1, -2.5), vec3(-1, 0, -2.5), vec3(-1, 0, -3), vec3(-1, -1, -2.5), vec3(-1, 0, -3), vec3(-1, -1, -3));
	
	var positionbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "a_Position");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// texture coordinates
	var texCoord = [vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0)];
	var tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);

	var aTexCoord = gl.getAttribLocation(program, "a_TexCoord");
	gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(aTexCoord);

	// load marble image texture
	var image = document.createElement('img');
	image.crossorigin = 'anonymous';
	image.onload = function () {
		imageLoaded = true;
		gl.activeTexture(gl.TEXTURE0);
		var textureMarble = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, textureMarble);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		gl.generateMipmap(gl.TEXTURE_2D);
	
		gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	};
	image.src = 'xamp23.png';

	// create red texture
	gl.activeTexture(gl.TEXTURE1);
	var textureRed = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, textureRed);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]));
	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);

	var perspectiveMatrix = gl.getUniformLocation(program,"u_Perspective");
	gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(P));

	var viewMatrix = gl.getUniformLocation(program,"u_View");

	toggleRotation.addEventListener("click", function (ev) {
		rotate = !rotate;
	});

	function tick() {
		render(gl);
		requestAnimationFrame(tick);
	}
	
	tick();

	function render(gl) {
		if (imageLoaded) {
			gl.clear(gl.COLOR_BUFFER_BIT);
	
			// draw background
			modelViewMatrix = V;
			gl.uniformMatrix4fv(viewMatrix, false, flatten(modelViewMatrix));
			gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
	
			// draw shadows
			lightPos = vec4(lightRadius*Math.sin(lightAlpha), 2, lightRadius*Math.cos(lightAlpha)-2, 1);
			if (rotate)
				lightAlpha += 0.02;
			
			modelViewMatrix = mult(modelViewMatrix, translate(lightPos[0], lightPos[1], lightPos[2]));
			modelViewMatrix = mult(modelViewMatrix, Ms);
			modelViewMatrix = mult(modelViewMatrix, translate(-lightPos[0],-lightPos[1], -lightPos[2]));

			gl.uniformMatrix4fv(viewMatrix, false, flatten(modelViewMatrix));
			gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
			gl.drawArrays(gl.TRIANGLES, 6, 12);
	
			// draw the two rectangles
			modelViewMatrix = V;
			gl.uniformMatrix4fv(viewMatrix, false, flatten(modelViewMatrix));
			gl.drawArrays(gl.TRIANGLES, 6, 12);
		}
	}
}