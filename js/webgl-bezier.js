

/**
 * 全局变量
 */
let indexNum = 672;
let xRota = 1;
let yRota = 1;
let _mouseDowm = false;
let lastMouseX = 0;
let lastMouseY = 0;

const canvas = document.querySelector('#glcanvas');
/**
 * 直接声明的函数嵌套函数表达式
 * 一种IIFE 立即调用的函数表达式
 * 用于隔离作用域，防止污染全局命名空间
 * 
 * 例1. (function(){...}())
 */
const v2 = (function () {
    // adds 1 or more v2s
    function add(a, ...args) {
        const n = a.slice();
        [...args].forEach(p => {
            n[0] += p[0];
            n[1] += p[1];
        });
        return n;
    }

    function sub(a, ...args) {
        const n = a.slice();
        [...args].forEach(p => {
            n[0] -= p[0];
            n[1] -= p[1];
        });
        return n;
    }

    function mult(a, s) {
        if (Array.isArray(s)) {
            let t = s;
            s = a;
            a = t;
        }
        if (Array.isArray(s)) {
            return [
                a[0] * s[0],
                a[1] * s[1],
            ];
        } else {
            return [a[0] * s, a[1] * s];
        }
    }

    // 两点之间制造一新点
    function lerp(a, b, t) {
        if (!Array.isArray(a)) {
            return a + (b - a) * t;
        }
        return [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
        ];
    }

    function min(a, b) {
        return [
            Math.min(a[0], b[0]),
            Math.min(a[1], b[1]),
        ];
    }

    function max(a, b) {
        return [
            Math.max(a[0], b[0]),
            Math.max(a[1], b[1]),
        ];
    }

    // compute the distance squared between a and b
    function distanceSq(a, b) {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        return dx * dx + dy * dy;
    }

    // compute the distance between a and b
    function distance(a, b) {
        return Math.sqrt(distanceSq(a, b));
    }

    // compute the distance squared from p to the line segment
    // formed by v and w
    function distanceToSegmentSq(p, v, w) {
        const l2 = distanceSq(v, w);
        if (l2 === 0) {
            return distanceSq(p, v);
        }
        let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
        t = Math.max(0, Math.min(1, t));
        return distanceSq(p, lerp(v, w, t));
    }

    // compute the distance from p to the line segment
    // formed by v and w
    function distanceToSegment(p, v, w) {
        return Math.sqrt(distanceToSegmentSq(p, v, w));
    }

    return {
        add: add,
        sub: sub,
        max: max,
        min: min,
        mult: mult,
        lerp: lerp,
        distance: distance,
        distanceSq: distanceSq,
        distanceToSegment: distanceToSegment,
        distanceToSegmentSq: distanceToSegmentSq,
    };
}());


/**
 * 程序入口
 */
function main() {

    mouseInteract();
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // Vertex shader program

    const vsSource = `
    attribute vec4       aVertexPosition;
    attribute vec2       aTextureCoord;
    attribute vec3       aNormal;

    uniform   mat4       uViewMatrix;
    uniform   mat4       uModelMatrix;
    uniform   mat4       uProjectionMatrix;

    varying   highp vec2 vTextureCoord;
    varying   vec3       vNormal;

    void main(void) {
      gl_Position   = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
      vNormal       = mat3( uModelMatrix ) * aNormal;
    }
  `;

    // Fragment shader program

    const fsSource = `
    precision mediump  float;

    uniform vec3       uLightDirect;

    varying highp vec2 vTextureCoord;
    varying vec3       vNormal;

    void main(void) {
      vec3 nLightDirect = normalize(uLightDirect);
      vec3 nNormal      = normalize(vNormal);
      float light       = dot(nNormal, nLightDirect);
      gl_FragColor      = vec4(vTextureCoord, 0, 1);
      gl_FragColor.rgb *= light;
    }
  `;


    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            normal: gl.getAttribLocation(shaderProgram, 'aNormal'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            uLightDirect: gl.getUniformLocation(shaderProgram, 'uLightDirect'),
        }
    };

    //数据处理与参数准备
    const svg =
    "m44,434c18,-33 19,-66 15,-111c-4,-45 -37,-104 -39,-132c-2,-28 11,-51 16,-81c5,-30 3,-63 -36,-63";
    const curvePoints = parseSVGPath(svg);//控制点
    
    const points = getPointsOnBezierCurve(curvePoints, 0, 10);
    //归一化，方便旋转
    const pointsNormal = normalizePoints(points);
    
    const bufferInfo = lathePoints(pointsNormal, 0, 2 * Math.PI, 25, true, true);
    
    const buffers = initBuffers(gl, bufferInfo);

    // Draw the scene repeatedly
    function render() {

        drawScene(gl, programInfo, buffers);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    
}

/**
 * 按索引绘制
 * 
 * @param {WebGL} gl 
 * @param {Object.<string,function>} programInfo 包括GLSL的各属性变量的绑定激活
 * @param {Object.<string,function>} buffers 坐标纹理索引缓冲区绑定完成,进行读取规则的设置
 */
function drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();
    

    mat4.scale(
        modelMatrix,     // destination matrix
        modelMatrix,     // matrix to translate
        [5.0, 5.0, 5.0]
    );                 

    mat4.translate(
        viewMatrix,      // destination matrix
        viewMatrix,      // matrix to translate
        [0.0, 0.0, -10.0]
    );                 // amount to translate  z轴平移

    mat4.rotate(
        viewMatrix,      // destination matrix
        viewMatrix,      // matrix to rotate
        xRota,           // amount to rotate in radians
        [0, 1, 0]
    );                 // axis to rotate around         y轴旋转

    mat4.rotate(
        viewMatrix,      // destination matrix
        viewMatrix,      // matrix to rotate
        yRota,           // amount to rotate in radians
        [1, 0, 0]
    );                 // axis to rotate around         x轴旋转


    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
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
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoordBuffer);
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

    // Tell WebGL how to pull out the normal coordinates from
    // the normal coordinate buffer into the uNormal attribute.
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.normal,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.normal);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

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
    gl.uniform3fv(
        programInfo.uniformLocations.uLightDirect,
        [0.0, 0.0, 1.0]);

    {
        const vertexCount = indexNum;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

}

/**
 * 初始化着色器程序
 * 
 * @param {WebGL} gl 
 * @param {string} vsSource 
 * @param {string} fsSource 
 */
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

/**
 * 加载单个着色器--隶属于@initShaderProgram
 * 
 * @param {WebGL} gl 
 * @param {string} type 
 * @param {string} source 
 */
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



/**
 * 鼠标交互事件的注册
 */
function mouseInteract() {
    canvas.onmousedown = handleMouseDown;
    canvas.onmouseup = handleMouseUp;
    canvas.onmousemove = handleMouseMove;
}

/**
 * 鼠标按下
 * @param {events} event 
 */
function handleMouseDown(event) {
    lastMouseX = event.clientX;
    lastMouseX = event.clientX;
    //alert(lastMouseX);
    _mouseDowm = true;
}

/**
 * 鼠标弹起
 * @param {events} event 
 */
function handleMouseUp(event) {
    _mouseDowm = false;
}

/**
 * 鼠标移动
 * @param {events} event 
 */
function handleMouseMove(event) {
    if (!_mouseDowm)
        return;
    var offsetX = event.clientX - lastMouseX;
    var offsetY = event.clientY - lastMouseY;
    xRota = offsetX * 0.01;
    yRota = offsetY * 0.01;
}





/**
 * 根据SVG的Paths路径数据的定义
 * 将字符串解析为坐标
 * 
 * @param {string} svg 
 * @returns {number[]} 
 */
function parseSVGPath(svg) {
    const points = [];
    let delta = false;
    let keepNext = false;
    let need = 0;
    let value = '';
    let values = [];
    let lastValues = [0, 0];
    let nextLastValues = [0, 0];

    function addValue() {
        if (value.length > 0) {
            values.push(parseFloat(value));
            if (values.length === 2) {
                if (delta) {
                    values[0] += lastValues[0];
                    values[1] += lastValues[1];
                }
                points.push(values);
                if (keepNext) {
                    nextLastValues = values.slice();
                }
                --need;
                if (!need) {
                    lastValues = nextLastValues;
                }
                values = [];
            }
            value = '';
        }
    }

    svg.split('').forEach(c => {
        if ((c >= '0' && c <= '9') || 'c' === '.') {
            value += c;
        } else if (c === '-') {
            addValue();
            value = '-';
        } else if (c === 'm') {
            addValue();
            keepNext = true;
            need = 1;
            delta = true;
        } else if (c === 'c') {
            addValue();
            keepNext = true;
            need = 3;
            delta = true;
        } else if (c === 'M') {
            addValue();
            keepNext = true;
            need = 1;
            delta = false;
        } else if (c === 'C') {
            addValue();
            keepNext = true;
            need = 3;
            delta = false;
        } else if (c === ',') {
            addValue();
        } else if (c === ' ') {
            addValue();
        }
    });
    addValue();
    let min = points[0].slice();
    let max = points[0].slice();
    for (let i = 1; i < points.length; ++i) {
        min = v2.min(min, points[i]);
        max = v2.max(max, points[i]);
    }
    let range = v2.sub(max, min);
    let halfRange = v2.mult(range, .5);
    for (let i = 0; i < points.length; ++i) {
        const p = points[i];
        p[0] = p[0] - min[0];
        p[1] = (p[1] - min[0]) - halfRange[1];
    }
    return points;
}

/**
 * 将SVG坐标范围缩至（-1，1）
 * 
 * @param {number[][]} _points 
 * @returns {number[][]}
 */
function normalizePoints(_points) {
    const maxY = _points[0][1];
    const minY = _points[_points.length - 1][1];
    let maxX = 0;
    let minX = 0;
    for (let p = 0; p < _points.length; p++) {
        if (_points[p][0] < minX) {
            minX = _points[p][0];
        };
        if (_points[p][0] > maxX) {
            maxX = _points[p][0];
        };
    }
    const xLength = Math.abs(maxX) > Math.abs(minX) ? Math.abs(maxX) : Math.abs(minX);
    const yLength = Math.abs(maxY) > Math.abs(minY) ? Math.abs(maxY) : Math.abs(minY);
    const length  = xLength > yLength ? xLength : yLength; 
    _points.forEach((p) => {
        p[0] = p[0] / length;
        p[1] = p[1] / length;
    });
    return _points;
}

/**
 * 获取到贝塞尔曲线上的一个点
 * 
 * @param {number[]} points 为构造曲线的必要点
 * @param {number} offset 为读取点时的偏移量，一般为0
 * @param {number} t 决定点在曲线上的位置
 * @returns {number[]} 曲线上一对坐标
 */
function getAPointOnBezierCurve(points, offset, t) {
    const invT = (1 - t);
    return v2.add(
        v2.mult(points[offset + 0], invT * invT * invT),
        v2.mult(points[offset + 1], 3 * t * invT * invT),
        v2.mult(points[offset + 2], 3 * invT * t * t),
        v2.mult(points[offset + 3], t * t * t));
}


/**
 * 根据贝塞尔曲线的控制点制作numPoints数量的曲线拟合点
 * t = i / numPoints 但是通过t划分点，可能在曲线较锋利处
 * 较少的点无法满足曲线的变化率，而在较平滑处，点可能有冗余
 * 可使用平滑检测与道格拉斯-普克算法解决上述两个问题
 * 
 * @param {number[]} _points 贝塞尔曲线的控制点
 * @param {number} offset 一般为0
 * @param {number} numPoints 拟合点的数量
 * @returns {number[][]}
 */
function getPointsOnBezierCurve(_points, offset, numPoints) {
    const points = [];
    const ctrl   = (_points.length - 1) / 3; //跳转到下一个四点控制的动点
    for (let j = 0; j < ctrl; ++j) {
        for (let i = 0; i < numPoints; ++i) {
            const t = i / (numPoints - 1);
            points.push(getAPointOnBezierCurve(_points, offset, t));
            //
        }
        offset += 3;
    }
    return points;
}

/**
 * 加工（旋转）曲线点，使其三维化
 * 
 * @param {number[][]} points    二维点坐标集 
 * @param {number} startAngle  起点角度 : 0
 * @param {number} endAngle    终止角度 : 2 * Math.PI (360)
 * @param {number} numDivisions 一个坐标延Y轴变成几个
 * @param {boolean} capStart   是否封顶
 * @param {boolean} capEnd     是否封底
 * @returns {Object.<string,function>|module:webgl-utils:BufferInfo} buffer
 */
function lathePoints(points, startAngle, endAngle, numDivisions, capStart, capEnd) {

    const positions = [];
    const texcoords = [];
    const indices = [];

    const sOffset = capStart ? 1 : 0;//封顶则设置一个偏量
    const eOffset = capStart ? 1 : 0;//封底则设置一个偏量
    // 一片有几个点，如不封顶则上下贯通
    const pointsPerColumn = points.length + sOffset + eOffset;

    // 旋转吧！创建坐标与纹理缓冲区
    for (let division = 0; division <= numDivisions; ++division) {
        const t = division / numDivisions; //就如同贝塞尔的t
        const angle  //取模运算，主要是防止angle超过360
            = v2.lerp(startAngle, endAngle, t) % (2 * Math.PI);
        const mat = mat4.create();
        mat4.rotate(mat, mat, angle, [0, 1, 0]);//Y旋转矩阵
        if (capStart) {
            // 维度为3，第0个点的Y
            positions.push(
                0,
                parseFloat(points[0][1].toFixed(2)),
                0
            );
            texcoords.push(t, 0);
        }
        points.forEach((p, indx) => {
            // ...数组转参数化序列
            // points[0] -> p 
            //   ...p    -> p[0],p[1]
            // 即: (mat, p[0], p[1], 0)
            let vec = vec3.create();
            vec3.set(vec, p[0], p[1], 0);
            vec3.transformMat4(vec, vec, mat);
           
            positions.push(
                parseFloat(vec[0].toFixed(2)),
                parseFloat(vec[1].toFixed(2)),
                parseFloat(vec[2].toFixed(2))
            );
            const v = (indx + sOffset) / (numDivisions - 1);
            texcoords.push(t, v);
        })
        if (capEnd) {
            // 维度为3，最后一个点的Y
            positions.push(0,
                parseFloat(points[points.length - 1][1].toFixed(2)),
                0
            );
            texcoords.push(t, 1);
        }

    }

    // 创建索引缓冲区
    for (let division = 0; division < numDivisions; division++) {
        //一列一列创建索引
        const column1offset = division * pointsPerColumn;//一开始:0（从开始到结尾一条）
        const column2offset = column1offset + pointsPerColumn;//下一次开始位置
        for (let quad = 0; quad < pointsPerColumn - 1; quad++) {
            indices.push(column1offset + quad,      //   2---1
                column2offset + quad,               //    \
                column1offset + quad + 1            //       3
            );
            indices.push(column1offset + quad + 1,  //   2     
                column2offset + quad,               //   |  \
                column2offset + quad + 1            //   3   1
            );
        }
    }
    // 创建法线的缓冲区
    const normals = generateNormals(positions, indices);
    indexNum = indices.length;


    return {
        positions: positions,
        texcoords: texcoords,
        indices: indices,
        normals: normals,
    };




}

/**
 * 初始化坐标、纹理、索引缓冲区
 * 
 * @param {WebGL} gl 
 * @param {Object.<string,function>|module:webgl-utils:BufferInfo} bufferInfo
 * @returns {Object.<string,function>|module:webgl-utils:Buffer}
 */
function initBuffers(gl, bufferInfo) {

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = bufferInfo.positions;
    //console.log(positions);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    const normals = bufferInfo.normals;
    //console.log(normals);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);


    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    const textureCoordinates = bufferInfo.texcoords;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);


    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = bufferInfo.indices;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


    
    return {
        positionBuffer: positionBuffer,
        textureCoordBuffer: textureCoordBuffer,
        indexBuffer: indexBuffer,
        normalBuffer: normalBuffer,
    };
}

//position 需要修改一下
function generateNormals(position, index){
    const faces = index.length / 3; //索引维度为3 --- 2
    const normals = [];
    const _normals = [];
    let offset = 0;
    const vec = vec3.create();
    const vecA = vec3.create();
    const vecB = vec3.create();
    
    const _position = [];
    for(let i = 0; i < position.length ; i+=3){
        let vecP = vec3.create();
        _position.push(
            vec3.set(
                vecP,   
                parseFloat((position[i + 0] * 1000).toFixed(2)), 
                parseFloat((position[i + 1] * 1000).toFixed(2)), 
                parseFloat((position[i + 2] * 1000).toFixed(2)),
            )
        )
    }
    //
    //法线数目必须与坐标数目一致
    for(let i = 0; i < faces; i++){
        //三个顶点变成两个向量，求两个向量的法向量
        vec3.subtract(vecA, _position[index[offset + 1]], _position[index[offset + 0]]);
        vec3.subtract(vecB, _position[index[offset + 2]], _position[index[offset + 0]]);
        vec3.cross(vec, vecA, vecB);//叉乘为0
        
        let _vec = vec3.create();
        //检查方向
        if(vec3.dot(vec, _position[index[offset + 0]]) < 0){
           vec3.set(_vec,-vec[0], -vec[1], -vec[2]);
        }
        
        _normals.push(_vec);
        _normals.push(_vec);
        _normals.push(_vec);
        offset += 3;

    }
    
    for(let i =0 ; i < index.length ; i++){
        normals[index[i]] = _normals[i];
    }
    
    const normalsT = [];
    for(let i =0 ; i < normals.length ; i++){
        normalsT.push(normals[i][0], normals[i][1], normals[i][2]);
    }
    
    return normalsT;

}


main();