window.onload = function init()
{
	var canvas = document.getElementById("gl-canvas");
	var gl = WebGLUtils.setupWebGL(canvas);
	numPoints = 100;
	radius = 0.25;
	
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	// circle
	var vertices = [ vec2(0.0, 0.0) ];
	for (var i = 0; i <= numPoints; i++) {
		var theta = 2*Math.PI*i/numPoints;
		vertices.push(vec2(radius * Math.cos(theta), radius * Math.sin(theta)));
	}
	var positionbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "a_Position");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	//movement
	var vLoc = gl.getUniformLocation(program, "v_y");
	var w = 0.015;
	var v = 0.0;

    function animate() {
		v += w;
		w = Math.sign(1-radius-Math.abs(v))*w;
		gl.uniform1f(vLoc, v);
		render(gl, numPoints);
		requestAnimationFrame(animate);
	}
	animate();
}

function render(gl, numPoints)
{
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, numPoints+2);
}