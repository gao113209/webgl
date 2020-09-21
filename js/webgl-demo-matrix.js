main();
function main() {
    //0.从canvas中获取WebGL--选择清洁剂颜色(黑)，并使用清洁剂
    const canvas = document.querySelector("#glcanvas");
    const webgl = canvas.getContext("webgl");

    if (!webgl) {
        console.log('浏览器不支持');
        //return;
    } else {
        console.log("pass 1");
    };

    webgl.clearColor(0.0, 0.0, 0.0, 1.0);
    webgl.clear(webgl.COLOR_BUFFER_BIT);

    //1.定义顶点着色器的GLSL--位置坐标系变换
    const vsSource = `
  attribute vec4 vPosition;
  uniform mat4 proj;
  void main(){
      gl_Position = vPosition*proj;
  }

`;
    //2.定义片段着色器的GLSL--上色均为白
    const fsSource = `
  void main(){
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }

`;


    //3.使用两个着色器的GLSL
    const vShaderF = function () {
        //一个空的vs着色器
        const shader = webgl.createShader(webgl.VERTEX_SHADER);
        //添加GLSL
        webgl.shaderSource(shader, vsSource);
        //编译生成一个vs着色器
        webgl.compileShader(shader);
        return shader;
    };

    const fShaderF = function () {
        //一个空的fs着色器
        const shader = webgl.createShader(webgl.FRAGMENT_SHADER);
        //添加GLSL
        webgl.shaderSource(shader, fsSource);
        //编译生成一个vs着色器
        webgl.compileShader(shader);
        return shader;
    };
    const vShader = vShaderF();
    const fShader = fShaderF();

    //4.创建使用两个着色器的着色器系统--附加两个着色器后，连接成着色器
    const shaderProgram = webgl.createProgram();
    webgl.attachShader(shaderProgram, vShader);
    webgl.attachShader(shaderProgram, fShader);
    webgl.linkProgram(shaderProgram);

    if (!webgl.getProgramParameter(shaderProgram, webgl.LINK_STATUS)) {
        console.log('初始化着色器系统失败 ');
        //return;
    } else {
        console.log("pass 2");
    };


    //5.手动将GLSL中的Attribute(Uniform)，分配到对应的变量中
    const vPosition = webgl.getAttribLocation(shaderProgram, 'vPosition');
    const proj = webgl.getUniformLocation(shaderProgram,'proj');

    //6.制作顶点（颜色）的缓冲区
    const positionBuffer = webgl.createBuffer();
    //绑定新创建的缓冲区--事先预定Data为Array类型的坐标点
    webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
    //坐标数组
    const vertices = [
        0.5, 0.5,   //右上   *------*
        -0.5, 0.5,  //左上     \
        0.5, -0.5,  //右下       \
        -0.5, -0.5, //左下         \
    ];                  //       -------*
    //坐标数组的size导入缓冲区
    webgl.bufferData(webgl.ARRAY_BUFFER,
        new Float32Array(vertices),
        webgl.STATIC_DRAW);

    //7.场景渲染--平行投影矩阵
   //制定Attribute的读取规则
    webgl.vertexAttribPointer(
        vPosition,   //Attribute的对应变量
        2,           //位置点的维度(x,y,z)
        webgl.FLOAT,
        false,
        0,          //距离到下一个位置点的数组长度
        0           //第一个位置点的起点
    );
    //激活对应的Attribute
    webgl.enableVertexAttribArray(vPosition);
    //使用编辑好的着色器系统
    webgl.useProgram(shaderProgram);

    //设置矩阵(正交平行投影)--矩阵的赋值需要 先使用着色器系统
    const projMatrix= mat4.create();
    mat4.ortho(
        projMatrix,                 //out
        -10,                        //left
        +10,                        //right
        -1,                         //bottom
        +1,                         //top
        -1,                         //near
        +1                          //far
        );        
    webgl.uniformMatrix4fv(proj,false,projMatrix);
    //画
    webgl.drawArrays(
        webgl.LINE_STRIP, //构造三角形面的方法之一（比较省坐标点的方法）
        0,
        4                  //四个坐标点
    );

}
