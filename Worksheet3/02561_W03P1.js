window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	numVertices = 24;
	
	var indices = [
		1, 0, 3,
		3, 2, 1,
		2, 3, 7,
		7, 6, 2,
		3, 0, 4,
		4, 7, 3,
		6, 5, 1,
		1, 2, 6,
		4, 5, 6,
		6, 7, 4,
		5, 4, 0,
		0, 1, 5
	];
	
	var lineIndices = [
		0, 1,
		1, 2,
		2, 3,
		3, 0,
		4, 5,
		5, 6,
		6, 7,
		7, 4,
		0, 4,
		1, 5,
		2, 6,
		3, 7
	];
	
	var vertices = [
		vec4(-0.5, -0.5, 0.5, 1.0),
		vec4(-0.5, 0.5, 0.5, 1.0),
		vec4(0.5, 0.5, 0.5, 1.0),
		vec4(0.5, -0.5, 0.5, 1.0),
		vec4(-0.5, -0.5, -0.5, 1.0),
		vec4(-0.5, 0.5, -0.5, 1.0),
		vec4(0.5, 0.5, -0.5, 1.0),
		vec4(0.5, -0.5, -0.5, 1.0)
	];
	
	var colors = [
		vec4(1.0, 1.0, 1.0, 1.0), // white
		vec4(0.0, 1.0, 0.0, 1.0), // green
		vec4(0.0, 0.0, 1.0, 1.0), // blue
		vec4(0.0, 1.0, 1.0, 1.0), // cyan
		vec4(1.0, 0.0, 1.0, 1.0), // magenta
		vec4(0.0, 0.0, 0.0, 1.0), // black
		vec4(1.0, 0.0, 0.0, 1.0), // red
		vec4(1.0, 13921.0, 0.0, 1.0), // yellow
		vec4(0., 0.5843, 0.9294, 1.0), // cornflower
	];
	
	var T = translate(0.5, 0.5, 0.5);
	
	var V = lookAt(vec3(0.5, 0.5, 0.5), vec3(1, 1, 1), vec3(0, 1, 0))
	
	gl.enable(gl.DEPTH_TEST);
		
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	var translationMatrix=gl.getUniformLocation(program,"u_Translation");
	gl.uniformMatrix4fv(translationMatrix, false, flatten(T));
	
	var viewMatrix=gl.getUniformLocation(program,"u_viewLocation");
	gl.uniformMatrix4fv(viewMatrix, false, flatten(V));
	
	var positionbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "a_Position");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	var colorbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
	
	var vColor = gl.getAttribLocation(program, "a_Color");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	
	var iBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(lineIndices), gl.STATIC_DRAW);
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);
}