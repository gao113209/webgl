var cubeRotation = 0.0;
var zTrans       = -6;
var xRota        = 1;
var yRota        = 1;
var wheel        = 1;

var camera       = mat4.create();
var eye          = [0, 0, 2]; 
var center       = [0, 0, 1];
var up           = [0, 1, 0];
mat4.lookAt(camera, eye, center, up);
 // ^replace the viewMatrix with camera which is a inverse matrix of viewMatrix. 
var vec          = vec3.create();
vec3.set(vec, 0, 0, 0);
var invertP    = mat4.create();

const canvas     = document.querySelector('#glcanvas');
const gl         = canvas.getContext('webgl');

main();

//
// Start here
//
function main() {

    mouseInteract();

    // Vertex shader program

    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uViewMatrix;
    uniform mat4 uModelMatrix;
    uniform mat4 uProjectionMatrix;
    varying highp vec2 vTextureCoord;
    void main(void) {
      gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;

    // Fragment shader program

    const fsSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;
    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aTextureCoord and also
    // look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
        }
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl);

    const texture = loadTexture(gl, 'img/asia.jpg');
    const textureB = loadTexture(gl, 'img/star.jpg');

    var then = 0;


    // Draw the scene repeatedly
    function render(now) {
        //
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, texture, textureB, deltaTime);

        //使用 window.请求动画帧(),绝对不能用setTimeout(),因为其与“帧的绘制”不同步
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers(gl) {

    // Create a buffer for the cube's vertex positions.

    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the cube.

    const positions = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
    ];

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Now set up the texture coordinates for the faces.

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

    const textureCoordinates = [
        // Front
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
        // Back
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        // Top
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        // Bottom
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
        // Right
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
        // Left
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
        gl.STATIC_DRAW);

    // Build the element array buffer; this specifies the indices
    // into the vertex arrays for each face's vertices.

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    const indices = [
        0, 1, 2, 0, 2, 3,         // front
        4, 5, 6, 4, 6, 7,         // back
        8, 9, 10, 8, 10, 11,      // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23,   // left
    ];

    // Now send the element array to GL

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
    };
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
 
    const image = new Image();
    image.crossOrigin = '*';
    image.crossOrigin = 'Anonymous';
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            gl.RGBA, gl.UNSIGNED_BYTE, image);

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        }
    };
    image.src = url;

    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, texture, textureB, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument   ---透视投影矩阵   台体可见空间
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const viewMatrix   = mat4.create();
    const modelMatrix  = mat4.create();
    const modelMatrixB = mat4.create();
    
    

    // Now move the drawing position a bit to where we want to
    // start drawing the square.

    mat4.translate(
        modelMatrixB,     // destination matrix
        modelMatrixB,     // matrix to translate
        [0.0, 0.0, -45.0]
    );                 // amount to translate  Z轴平移

    mat4.translate(
        modelMatrixB,     // destination matrix
        modelMatrixB,     // matrix to translate
        [vec[0], vec[1], 0.0]
    );                 // amount to translate  Z轴平移

    mat4.scale(
        modelMatrixB,     // destination matrix
        modelMatrixB,     // matrix to translate
        [20.0, 20.0, 0.0]
    );                 // amount to scale

    mat4.scale(
        modelMatrix,     // destination matrix
        modelMatrix,     // matrix to translate
        [wheel, wheel, wheel]
    );                 // amount to scale


    
    mat4.translate(
        viewMatrix,      // destination matrix
        viewMatrix,      // matrix to translate
        [0.0, 0.0, -30.0]
    );                 // amount to translate  z轴平移

    mat4.lookAt(camera, eye, center, up);
                       // amount to translate  第三人称移动到指定位置
    
    //console.log(vec);

    mat4.rotate(
        modelMatrix,      // destination matrix
        modelMatrix,      // matrix to rotate
        xRota,           // amount to rotate in radians
        [0, 1, 0]
    );                 // axis to rotate around         y轴旋转

    mat4.rotate(
        modelMatrix,      // destination matrix
        modelMatrix,      // matrix to rotate
        yRota,           // amount to rotate in radians
        [1, 0, 0]
    );                 // axis to rotate around         x轴旋转


    var mpMatrix  = mat4.create();
    var vmpMatrix = mat4.create();
    mat4.multiply(mpMatrix, modelMatrixB, projectionMatrix);
    mat4.multiply(vmpMatrix, camera, mpMatrix);

    mat4.invert( invertP, projectionMatrix );

    //console.log(projectionMatrix);

    var vec1 = vec3.create();
    vec3.set(vec1, 1, 1, 1);
    vec3.transformMat4(vec1, vec1, invertP);
    //console.log(vec1);
    var factor = vec1[2] / -45;
    vec3.set(vec1, vec1[0] / factor, vec1[1] / factor, vec1[2] / factor);

    //console.log(vec1);




    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL how to pull out the texture coordinates from
    // the texture coordinate buffer into the textureCoord attribute.
    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(
            programInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.textureCoord);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Tell WebGL to use our program when drawing

    gl.useProgram(programInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.viewMatrix,
        false,
        viewMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelMatrix,
        false,
        modelMatrix);

    // Specify the texture to map onto the faces.

    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    // The Cube 1 
    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    // The background
    gl.bindTexture(gl.TEXTURE_2D, textureB);
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.viewMatrix,
        false,
        camera);                       //初始的相机位置
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelMatrix,
        false,
        modelMatrixB);
    {
        const vertexCount = 6;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    // Update the rotation for the next draw

    cubeRotation += deltaTime;
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function mouseInteract() {
    canvas.onmousedown  = handleMouseDown;
    canvas.onmouseup    = handleMouseUp;
    canvas.onmousemove  = handleMouseMove;
    canvas.onmousewheel = handleMouseWheel;
}

//
// 鼠标事件
//
var _mouseDown = false;
var lastMouseX = 0;
var lastMouseY = 0;
function handleMouseDown(event) {
    lastMouseX = event.clientX;
    lastMouseX = event.clientX;
    //alert(lastMouseX);
    _mouseDown = true;

}

function handleMouseUp(event) {
    _mouseDown = false;
    
    screen2model(event);
    console.log(event.clientX + "," + event.clientY);
}

function handleMouseMove(event) {
    if (!_mouseDown)
        return;
    var offsetX = event.clientX - lastMouseX;
    var offsetY = event.clientY - lastMouseY;
    xRota = offsetX * 0.01;
    yRota = offsetY * 0.01;
}

function handleMouseWheel(event) {

    if (wheel <= 0) {
        wheel = 1;
        return;
    }
    wheel += event.wheelDelta / 120;
    console.log(wheel);
}

function screen2model(event){
    var modelXY  = [0, 0];
    // 标准化屏幕坐标 -1 0 1
    modelXY[0]   =  -( event.clientX - ( gl.canvas.clientWidth / 2 ) ) / gl.canvas.clientWidth * 2;
    modelXY[1]   =  ( event.clientY - ( gl.canvas.clientHeight / 2 ) ) / gl.canvas.clientHeight * 2;
    
    vec3.set(vec, modelXY[0], modelXY[1], 1);
    vec3.transformMat4(vec, vec, invertP);
    var factor = vec[2] / -45;
    vec3.set(vec, vec[0] / factor, vec[1] / factor, vec[2] / factor);

}