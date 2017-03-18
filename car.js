//////////////////////////////////////////////////////////////////////////
/*                             REFERENCES                               */
//////////////////////////////////////////////////////////////////////////
/* PROGRAM CORE: Lighting Demo by Frederick Li                          */
/* MOVEMENT CONTROLS: http://yojimbo87.github.io/2012/08/23/repeated    */
/* -and-multiple-key-press-events-without-stuttering-in-javascript.html */
//////////////////////////////////////////////////////////////////////////

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' +       // Normal
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform mat4 u_ViewMatrix;\n' +
    'uniform mat4 u_ProjMatrix;\n' +
    'uniform vec3 u_LightColor;\n' +     // Light color
    'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
    'varying vec4 v_Color;\n' +
    'uniform bool u_isLighting;\n' +
    'void main() {\n' +
       // Render object on screen
    '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
    '  if(u_isLighting)\n' +
    '  {\n' +
    '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
    '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
          // Calculate the color due to diffuse reflection
    '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
    '     v_Color = vec4(diffuse, a_Color.a);\n' +  '  }\n' +
    '  else\n' +
    '  {\n' +
    '     v_Color = a_Color;\n' +
    '  }\n' +
    '}\n';

// Fragment shader
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

// var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;       // The rotation x angle (degrees)
var g_yAngle = 90.0;      // The rotation y angle (degrees)
var carX = 0.0;           // Initial position of x-axis
var carZ = 5.0;           // Initial position of z-axis
var distance = 0.3;       // Distance to travel
var wheelRotation = 0;    // Keeps track of wheel rotation


function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Set clear color and enable hidden surface removal
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Get the storage locations of uniform attributes
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

    // Trigger using lighting or not
    var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

    if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
        !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
        !u_isLighting ) {
        console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
        return;
    }

    // Set the light color (white)
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    // Set the light direction (in the world coordinate)
    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize();     // Normalize
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    // Calculate the view matrix and the projection matrix
    // Matrix4.setLookAt(eyeX, eyeY, eyeZ, atX, atY, atZ, upX, upY, upZ)
    viewMatrix.setLookAt(0, 3, 20, 0, 0, -100, 0, 1, 0);
    projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    // Pass the model, view, and projection matrix to the uniform variable respectively
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    document.onkeydown = function(ev) {
        //TODO: Replace with own function
        keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
    };

    draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
    switch (ev.keyCode) {
        case 38: // Up arrow key -> the positive rotation of arm1 around the y-axis
            carZ = (carZ - distance);
            wheelRotation = (wheelRotation + 20) % 360;
            break;
        case 40: // Down arrow key -> the negative rotation of arm1 around the y-axis
            carZ = (carZ + distance);
            wheelRotation = (wheelRotation - 20) % 360;
            break;
        case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
            carX += distance * Math.cos(45.0);
            carZ -= distance * Math.sin(45.0);
            wheelRotation = (wheelRotation + 20) % 360;
            break;
        case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
            g_yAngle += 3.0;
            // carX = (carX - distance);
            break;
        default: return; // Skip drawing at no effective action

    }

    // TODO: Call this in a loop?
    // Draw the scene
    draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

// function keydown(callback) {
//     var keys = {},
//         keysCount = 0,
//         interval = null,
//         trackedKeys = {
//             119: true, // W
//             87: true,  // w
//             115: true, // S
//             83: true,  // s
//             97: true,  // A
//             65: true,  // a
//             100: true, // D
//             68: true,  // d
//             37: true,  // left arrow
//             38: true,  // up arrow
//             39: true,  // right arrow
//             40: true   // down arrow
//         };
//
//     $(document).keydown(function(event) {
//         var code = event.which;
//
//         if (trackedKeys[code]) {
//             if (!keys[code]) {
//                 keys[code] = true;
//                 keysCount++;
//             }
//
//             if (interval === null) {
//                 interval = setInterval(function() {
//                     var direction = '';
//
//                     // check if north or south
//                     if (keys[119] || keys[87] || keys[38]) {
//                         direction = 'n';
//                     } else if (keys[115] || keys[83] || keys[40]) {
//                         direction = 's';
//                     }
//
//                     // concat west or east
//                     if (keys[97] || keys[65] || keys[37]) {
//                         direction += 'w';
//                     } else if (keys[100] || keys[68] || keys[39]) {
//                         direction += 'e';
//                     }
//
//                     callback(direction);
//                 }, 1000 / 50);
//             }
//         }
//     });
//
//     $(document).keyup(function(event) {
//         var code = event.which;
//
//         if (keys[code]) {
//             delete keys[code];
//             keysCount--;
//         }
//
//         // need to check if keyboard movement stopped
//         if ((trackedKeys[code]) && (keysCount === 0)) {
//             clearInterval(interval);
//             interval = null;
//             callback('none');
//         }
//     });
// }

function initVertexBuffers(gl, colorBlock) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var vertices = new Float32Array([   // Coordinates
        0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,  // v0-v1-v2-v3 front
        0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,  // v0-v3-v4-v5 right
        0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,  // v0-v5-v6-v1 up
        -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
        -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
        0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5   // v4-v7-v6-v5 back
    ]);


    var colors = colorBlock;


    var normals = new Float32Array([    // Normal
        0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0    // v4-v7-v6-v5 back
    ]);


    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,   // left
        16,17,18,  16,18,19,   // down
        20,21,22,  20,22,23    // back
    ]);


    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
}

var g_matrixStack = [];  // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
    var m2 = new Matrix4(m);
    g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
    return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1i(u_isLighting, false); // Will not apply lighting

    // Calculate the view matrix and the projection matrix
    modelMatrix.setTranslate(0, 0, 0);  // No Translation
    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.uniform1i(u_isLighting, true); // Will apply lighting

    // Set the vertex coordinates and color (for the cube)
    var n = initVertexBuffers(gl, colorBlock(1,0,0));
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    n = initVertexBuffers(gl, colorBlock(0.137255,0.556863,0.137255));
    // Model the plane
    pushMatrix(modelMatrix);
    modelMatrix.scale(20.0, 0.1, 100.0);
    modelMatrix.translate(0.0, -10, 0.0);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    // Rotate, and then translate group of cubes
    modelMatrix.setTranslate(carX, 0, carZ);  // Translation (No translation is supported here)
    modelMatrix.rotate(g_yAngle, 0, 1, 0);    // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0);    // Rotate along x axis

    n = initVertexBuffers(gl, colorBlock(0.258824,0.258824,1.0));
    // Model the body of the car
    pushMatrix(modelMatrix);
    // Scaling: length (x), height (y), width (z)
    modelMatrix.scale(1.5, 0.5, 0.75); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    // Model the top of the car
    pushMatrix(modelMatrix);
    modelMatrix.scale(1.0, 0.375, 0.75);
    modelMatrix.translate(-0.15, 1.0, 0.0);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    n = initVertexBuffers(gl, colorBlock(0,0,0));
    // Model the left backwheel
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 0.3, 0.3);
    modelMatrix.translate(-1.5, -0.5, -1.3);
    modelMatrix.rotate(wheelRotation,0,0,1);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    // Model the left frontwheel
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 0.3, 0.3);
    modelMatrix.translate(1.5, -0.5, -1.3);
    modelMatrix.rotate(wheelRotation,0,0,1);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    // Model the right backwheel
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 0.3, 0.3);
    modelMatrix.translate(-1.5, -0.5, 1.3);
    modelMatrix.rotate(wheelRotation,0,0,1);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    // Model the right frontwheel
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 0.3, 0.3);
    modelMatrix.translate(1.5, -0.5, 1.3);
    modelMatrix.rotate(wheelRotation,0,0,1);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    // Model the spare tyre
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 0.3, 0.3);
    modelMatrix.translate(-2.5, 0.1, 0.0);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    n = initVertexBuffers(gl, colorBlock(0.658,0.658,0.658));
    // Model the bumper
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.15, 0.1, 0.65);
    modelMatrix.translate(5, -1.3, 0.0);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    n = initVertexBuffers(gl, colorBlock(1,1,0));
    // Model the left headlight
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.15, 0.15, 0.15);
    modelMatrix.translate(5, 0.75, -1.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    // Model the right headlight
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.15, 0.15, 0.15);
    modelMatrix.translate(5, 0.75, 1.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();


    n = initVertexBuffers(gl, colorBlock(0.1,0.1,1.0));
    // Model the right door
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.5, 0.2, 0.05);
    modelMatrix.translate(-0.3, 0.8, 8);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    // Model the right door
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.5, 0.2, 0.05);
    modelMatrix.translate(-0.3, 0.8, -8);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
}

function colorBlock(r, g, b) {
    var colors = new Float32Array([    // Colors
        r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v1-v2-v3 front
        r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v3-v4-v5 right
        r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v5-v6-v1 up
        r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v1-v6-v7-v2 left
        r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v7-v4-v3-v2 down
        r, g, b,   r, g, b,   r, g, b,  r, g, b　    // v4-v7-v6-v5 back
    ]);
    return colors;
}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
    pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    modelMatrix = popMatrix();
}