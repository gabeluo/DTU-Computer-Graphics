window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	numPoints = 6;
	
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	// square
	var vertices = [ vec2(0.0, -0.5), vec2(0.5, 0.0), vec2(-0.5, 0.0), vec2(0.0, 0.5), vec2(0.5, 0.0), vec2(-0.5, 0.0) ];
	var positionbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "a_Position");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	// color
    var colors = [ vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) ];
	var colorbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
	
	var vColor = gl.getAttribLocation(program, "a_Color");
	gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	
	// rotation
	var betaLoc = gl.getUniformLocation(program, "beta");
	var beta = 0.0;

    function animate() {
		beta += 0.02;
		gl.uniform1f(betaLoc, beta);
		render(gl, numPoints);
		requestAnimationFrame(animate);
	}
	animate();
}

function render(gl, numPoints)
{
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, numPoints);
}