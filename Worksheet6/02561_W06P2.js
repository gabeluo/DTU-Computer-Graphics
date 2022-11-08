window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);

	var texSize = 64;
	var numRows = 8;
	var numCols = 8;

	var linearFiltering = true;
	var mipmap = false;

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	var P = perspective(90, 1, 0.1, 100);

	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// rectangle
	var vertices = [vec3(-4, -1, -1), vec3(4, -1, -1), vec3(4, -1, -21), vec3(-4, -1, -1), vec3(4, -1, -21), vec3(-4, -1, -21)];
	var positionbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "a_Position");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// texture coordinates
	var texCoord = [vec2(-1.5, 0.0), vec2(2.5, 0.0), vec2(2.5, 10.0), vec2(-1.5, 0.0), vec2(2.5, 10.0), vec2(-1.5, 10.0)];
	var tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);

	var aTexCoord = gl.getAttribLocation(program, "a_TexCoord");
	gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(aTexCoord);
	
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// generate checkerboard image
	var myTexels = new Uint8Array(4*texSize*texSize); // 4 for RGBA image, texSize is the resolution
	for(var i = 0; i < texSize; ++i) {
		for(var j = 0; j < texSize; ++j)
		{
			var patchx = Math.floor(i/(texSize/numRows));
			var patchy = Math.floor(j/(texSize/numCols));
			var c = (patchx%2 !== patchy%2 ? 255 : 0);
			var idx = 4*(i*texSize + j);
			myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;
			myTexels[idx + 3] = 255;
		}
	}

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);

	var perspectiveMatrix = gl.getUniformLocation(program,"u_Perspective");
	gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(P));

	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

	gl.generateMipmap(gl.TEXTURE_2D);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	document.getElementById("texWrapMenu").oninput = function () {
		switch (texWrapMenu.selectedIndex) {
			case 0:
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				break;
			case 1:
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		}
		requestAnimationFrame(render);
	};
	
	document.getElementById("magMenu").oninput = function () {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST + magMenu.selectedIndex);
		requestAnimationFrame(render);
	};

	document.getElementById("minfilterMenu").oninput = function () {
		if (linearFiltering) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST + minfilterMenu.selectedIndex);
			requestAnimationFrame(render);
		}
	};

	document.getElementById("minMipmapMenu").oninput = function () {
		if (mipmap) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST + minMipmapMenu.selectedIndex);
			requestAnimationFrame(render);
		}
	};

	linearFilteringButton.addEventListener("click", function (ev) {
		if (!linearFiltering) {
			linearFiltering = true;
			mipmap = false;
			document.getElementById("minMode").innerHTML = "Linear Filtering";
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST + minfilterMenu.selectedIndex);
			requestAnimationFrame(render);
		}
	});

	mipmapButton.addEventListener("click", function (ev) {
		if (!mipmap) {
			linearFiltering = false;
			mipmap = true;
			document.getElementById("minMode").innerHTML = "Texture Mipmapping";
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST + minMipmapMenu.selectedIndex);
			requestAnimationFrame(render);
		}
	});

	function render() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	render();
}