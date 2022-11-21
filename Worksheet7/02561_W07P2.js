var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

var vertices = [vec4(-1, -1, 0.999, 1), vec4(1, -1, 0.999, 1),  vec4(1, 1, 0.999, 1), vec4(-1, -1, 0.999, 1),  vec4(1, 1, 0.999, 1), vec4(-1, 1, 0.999, 1)];
var pointsArray = [];
var normalsArray = [];

var g_tex_ready = 0;

window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	numSubdivs = 5;
	
	cameraPosition = vec3(0.0, 0.0, 3.0);
	var V = lookAt(cameraPosition, vec3(0, 0, 0), vec3(0, 1, 0));
	var P = perspective(90, 1, 0.1, 100);

	var Perspective_inv = inverse(P);
	var View_inv = inverse(V);
	View_inv[3][0] = 0;
	View_inv[3][1] = 0;
	View_inv[3][2] = 0;
	View_inv[3][3] = 0;
	View_inv[0][3] = 0;
	View_inv[1][3] = 0;
	View_inv[2][3] = 0;
	var Mtex = mult(View_inv,Perspective_inv);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
		
	gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(gl.program);

	initTexture(gl);

	gl.vBuffer = null;

	// add vertices for background
	pointsArray = vertices;
	// add vertices for sphere
	initSphere(gl, numSubdivs);
	
	var viewMatrix = gl.getUniformLocation(gl.program,"u_View");

	var perspectiveMatrix = gl.getUniformLocation(gl.program,"u_Perspective");

	var textureMatrix = gl.getUniformLocation(gl.program,"u_TextureMatrix");
	
	incrementSubd.addEventListener("click", function (ev) {
		numSubdivs++;
		pointsArray = [];
		normalsArray = [];
		initSphere(gl, numSubdivs);
		render(gl);
	});
	decrementSubd.addEventListener("click", function (ev) {
		if (numSubdivs) {
			numSubdivs--;
			pointsArray = [];
			normalsArray = [];
			initSphere(gl, numSubdivs);
			render(gl);
		}
	});

	function animate() {
		if (g_tex_ready >= 6) {
			render(gl);
		} else {
			requestAnimationFrame(animate);
		}
	}
	animate();

	function render(gl) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// draw background
		gl.uniformMatrix4fv(viewMatrix, false, flatten(mat4()));
		gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(mat4()));
		gl.uniformMatrix4fv(textureMatrix, false, flatten(Mtex));
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// draw sphere
		gl.uniformMatrix4fv(viewMatrix, false, flatten(V));
		gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(P));
		gl.uniformMatrix4fv(textureMatrix, false, flatten(mat4()));
		gl.drawArrays(gl.TRIANGLES, 6, pointsArray.length-6);
	}
}

function initTexture(gl)
{
	var cubemap = ['textures/cm_left.png', // POSITIVE_X
					'textures/cm_right.png', // NEGATIVE_X
					'textures/cm_top.png', // POSITIVE_Y
					'textures/cm_bottom.png', // NEGATIVE_Y
					'textures/cm_back.png', // POSITIVE_Z
					'textures/cm_front.png']; // NEGATIVE_Z
	gl.activeTexture(gl.TEXTURE0);
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	for(var i = 0; i < 6; ++i) {
		var image = document.createElement('img');
		image.crossorigin = 'anonymous';
		image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
		image.onload = function(event)
		{
			var image = event.target;
			gl.activeTexture(gl.TEXTURE0);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
			++g_tex_ready;
		};
		image.src = cubemap[i];
	}
	gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
}

function initSphere(gl, numSubdivs) {
	tetrahedron(va, vb, vc, vd, numSubdivs);
	gl.deleteBuffer(gl.vBuffer);
	gl.vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(gl.program, "a_Position");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// var colors = []
	// for (var i=0; i<pointsArray.length; i++) {
	// 	colors[i] = vec4(0.5*pointsArray[i][0]+0.5, 0.5*pointsArray[i][1]+0.5, 0.5*pointsArray[i][2]+0.5, 0.5*pointsArray[i][3]+0.5);
	// }
	// var colorbuffer = gl.createBuffer();
	// gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);
	// gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
	
	// var vColor = gl.getAttribLocation(gl.program, "a_Color");
	// gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	// gl.enableVertexAttribArray(vColor);

	// var nBuffer = gl.createBuffer();
    // gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    // gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    // var vNormal = gl.getAttribLocation(gl.program, "a_Normal" );
    // gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0 );
    // gl.enableVertexAttribArray(vNormal);
}

function tetrahedron(a, b, c, d, n)
{
	divideTriangle(a, b, c, n);
	divideTriangle(d, c, b, n);
	divideTriangle(a, d, b, n);
	divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count)
{
	if (count > 0) {
		var ab = normalize(mix(a, b, 0.5), true);
		var ac = normalize(mix(a, c, 0.5), true);
		var bc = normalize(mix(b, c, 0.5), true);
		divideTriangle(a, ab, ac, count - 1);
		divideTriangle(ab, b, bc, count - 1);
		divideTriangle(bc, c, ac, count - 1);
		divideTriangle(ab, bc, ac, count - 1);
	}
	else {
		triangle(a, b, c);
	}
}

function triangle(a, b, c) {
	pointsArray.push(a);
	pointsArray.push(b);
	pointsArray.push(c);

	normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
	normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
	normalsArray.push(vec4(c[0], c[1], c[2], 0.0));
}
	