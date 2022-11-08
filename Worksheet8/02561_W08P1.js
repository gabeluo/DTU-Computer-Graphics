var imageLoaded = false;

window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	var P = perspective(90, 1, 0.1, 100);

	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// rectangle
	var vertices = [vec3(-2, -1, -1), vec3(2, -1, -1), vec3(2, -1, -5), vec3(-2, -1, -1), vec3(2, -1, -5), vec3(-2, -1, -5)];
	//vertices.push([vec3(0.25, -0.5, -1.25), vec3(0.75, -0.5, -1.25), vec3(0.75, -0.5, -1.75), vec3(0.25, -0.5, -1.25), vec3(0.75, -0.5, -1.75), vec3(0.25, -0.5, -1.75)]);
	//vertices.push([vec3(0.25, -0.5, -1.25), vec3(0.75, -0.5, -1.25), vec3(0.75, -0.5, -1.75), vec3(0.25, -0.5, -1.25), vec3(0.75, -0.5, -1.75), vec3(0.25, -0.5, -1.75)]);
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

	// // generate checkerboard image
	// var myTexels = new Uint8Array(4*texSize*texSize); // 4 for RGBA image, texSize is the resolution
	// for(var i = 0; i < texSize; ++i) {
	// 	for(var j = 0; j < texSize; ++j)
	// 	{
	// 		var patchx = Math.floor(i/(texSize/numRows));
	// 		var patchy = Math.floor(j/(texSize/numCols));
	// 		var c = (patchx%2 !== patchy%2 ? 255 : 0);
	// 		var idx = 4*(i*texSize + j);
	// 		myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;
	// 		myTexels[idx + 3] = 255;
	// 	}
	// }

	var image = document.createElement('img');
	image.crossorigin = 'anonymous';
	image.onload = function () {
		imageLoaded = true;
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		gl.generateMipmap(gl.TEXTURE_2D);
	
		gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	};
	image.src = 'xamp23.png';

	var perspectiveMatrix = gl.getUniformLocation(program,"u_Perspective");
	gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(P));

	//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]));

	function tick() {
		render(gl);
		requestAnimationFrame(tick);
	}
	
	tick();
}

function render(gl) {
	if (imageLoaded) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
}