var cubeRotation = 0.0;
var zTrans = -6;
var xRota = 1;
const canvas = document.querySelector('#glcanvas');

main();

//
// Start here
//
function main() {

    const gl = canvas.getContext('webgl');

    // If we don't have a GL context, give up now

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

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

    const texture = loadTexture(gl, 'img/sun.jpg');
    const textureDynamic = gl.createTexture();
    const framebuffer = initFramebufferObject(gl, textureDynamic);

    var then = 0;

    // Draw the scene repeatedly
    function render(now) {
        //
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;
        //console.log(texture2);

        renderScene(gl, programInfo, buffers, texture, deltaTime, framebuffer, textureDynamic);
    
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

        //FBO
        0, 0, 0,
        0.3, 0, 0,
        0.3, 0.3, 0,
        0, 0, 0,
        0.3, 0.3, 0,
        0, 0.3, 0,
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
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // top
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
    const texture1 = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture1);

    const image = new Image();
    image.crossOrigin = '*';
    image.crossOrigin = 'Anonymous';
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            gl.RGBA, gl.UNSIGNED_BYTE, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        }
    };
    image.src = url;

    return texture1;
    
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

//
// Render the scene.
//
function renderScene(gl, programInfo, buffers, texture, deltaTime, fbo, textureDynamic) {

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // 以下所有过程都将绘制在 动态纹理 上 ，直到bindFramebuffer -- null
    //gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);


    gl.clearColor(1.0, 1.0, 1.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument   ---透视投影矩阵   台体可见空间
    // as the destination to receive the result.
    mat4.perspective(
        projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);


    const orthoMatrix = mat4.create();
    mat4.ortho(
        orthoMatrix,       //--- 正射矩阵无远近  ------------> x
        0,                //-x                 |
        1,                 //+x                |
        1,                //                   y
        0,
        -1.0,
        1.0
    );


    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();

    mat4.translate(
        modelMatrix,     // destination matrix
        modelMatrix,     // matrix to translate
        [-0.0, 0.0, -10.0]
    );                 // amount to translate  z轴平移

    mat4.translate(
        viewMatrix,     // destination matrix
        viewMatrix,     // matrix to translate
        [0.0, 0.0, 0.0]
    );                 // amount to translate  z轴平移

    mat4.rotate(
        modelMatrix,  // destination matrix
        modelMatrix,  // matrix to rotate
        cubeRotation * xRota,// amount to rotate in radians
        [0, 1, 0]
    );                 // axis to rotate around         x轴旋转


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

    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        //此刻，应该只是将内容绘制到帧缓存中，Canvas中被没有绘制
    }

    // Update the rotation for the next draw

    drawScene(gl, programInfo, buffers, textureDynamic, deltaTime);
    cubeRotation += deltaTime;
}

//
// Draw the scene in FBO
//
function drawScene(gl, programInfo, buffers, textureDynamic, deltaTime){
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);


    gl.clearColor(1.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument   ---透视投影矩阵   台体可见空间
    // as the destination to receive the result.
    mat4.perspective(
        projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);


    const orthoMatrix = mat4.create();
    mat4.ortho(
        orthoMatrix,       //--- 正射矩阵无远近  ------------> x
        0,                //-x                 |
        1,                 //+x                |
        1,                //                   y
        0,
        -1.0,
        1.0
    );


    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();

    mat4.translate(
        modelMatrix,     // destination matrix
        modelMatrix,     // matrix to translate
        [-0.0, 0.0, -10.0]
    );                 // amount to translate  z轴平移

    mat4.translate(
        viewMatrix,     // destination matrix
        viewMatrix,     // matrix to translate
        [0.0, 0.0, 0.0]
    );                 // amount to translate  z轴平移

    mat4.rotate(
        modelMatrix,  // destination matrix
        modelMatrix,  // matrix to rotate
        cubeRotation * xRota,// amount to rotate in radians
        [0, 1, 0]
    );                 // axis to rotate around         x轴旋转


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
    gl.bindTexture(gl.TEXTURE_2D, textureDynamic);

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        //此刻，真正的将动态纹理绘制到 立方体 各面
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

//
// create a FBO 帧缓冲对象 
//
//
function initFramebufferObject(gl, textureDynamic) {

    //1.创建帧缓冲区对象
    var framebuffer = gl.createFramebuffer();
    //2.创建纹理对象，设置并绑定
    //const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureDynamic);
    gl.texImage2D(gl.TEXTURE_2D,
        0,
        gl.RGBA,
        canvas.clientWidth,
        canvas.clientHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );
    // 设置纹理参数 保存纹理对象
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //framebuffer.texture = textureDynamic; // 保存纹理对象
    //3.创建渲染缓冲区对象
    const depthBuffer = gl.createRenderbuffer();
    //4.绑定渲染缓冲区，设置渲染缓冲区参数
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(
        gl.RENDERBUFFER,
        gl.DEPTH_COMPONENT16,
        canvas.clientWidth,
        canvas.clientHeight
    );
    //5.将纹理对象关联到--帧缓冲区对象上
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        textureDynamic,
        0
    );   //关联颜色
    //6.将渲染缓冲区对象关联到--帧缓冲对象上
    gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        depthBuffer
    );
    return framebuffer;
}