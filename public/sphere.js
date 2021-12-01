// Creates the point buffer.
Sphere.prototype.initPointsBuffer = function() {
    const gl = this.glObj.gl;

    const pointsbuffer = [
        sphere_vector(0.0, 0.0),
        sphere_vector(0.0, Math.acos(-1.0 / 3.0)),
        sphere_vector(2.0 * Math.PI / 3.0, Math.acos(-1.0 / 3.0)),
        sphere_vector(4.0 * Math.PI / 3.0, Math.acos(-1.0 / 3.0)),
    ];

    this.buffers.points = {
        glBuffer: gl.createBuffer(),
        buffer: pointsbuffer
    }

    const indexbuffer = [
        0, 2, 1,
        0, 1, 3,
        0, 3, 2,
        1, 2, 3
    ];

    this.buffers.indices = {
        glBuffer: gl.createBuffer(),
        buffer: indexbuffer
    }
}


// Creates the index buffer
Sphere.prototype.initIndexBuffer = function() {
    const gl = this.glObj.gl;

    const buffer = [
        0, 2, 1,
        0, 1, 3,
        0, 3, 2,
        1, 2, 3
    ];

    this.buffers.indices = {
        glBuffer: gl.createBuffer(),
        buffer: buffer
    }
}

// Creates a color buffer
Sphere.prototype.initcolorBuffer = function() {
    const gl = this.glObj.gl;

    const colorMatrix = mat4.create();
    const colorNormal = vec4.fromValues(0.0, 0.0, 1.0, 0.0);

    // Applies the client specified color to the sphere
    const colorDiff = vec4.sub(vec4.create(), this.gradientColorStop, this.gradientColorStart);

    for (let i = 0; i < 3; i++) {
        colorMatrix[0 + i * 4] = colorDiff[0] * colorNormal[i];
        colorMatrix[1 + i * 4] = colorDiff[1] * colorNormal[i];
        colorMatrix[2 + i * 4] = colorDiff[2] * colorNormal[i];
    }

    colorMatrix[12] = this.gradientColorStart[0];
    colorMatrix[13] = this.gradientColorStart[1];
    colorMatrix[14] = this.gradientColorStart[2];

    const tempBuffer = [];

    this.buffers.points.buffer.forEach(function(point) {
        const color = vec4.create();
        vec4.transformMat4(color, point, colorMatrix);

        tempBuffer.push(color);
    }, this);

    this.buffers.colors = {
        glBuffer: gl.createBuffer(),
        buffer: tempBuffer
    }
}

// Creates the normal buffer.
Sphere.prototype.initNormalBuffer = function() {
    const gl = this.glObj.gl;

    const tempBuffer = [];
    this.buffers.points.buffer.forEach(function(point) {
        tempBuffer.push(vec3.clone(point));
    }, this);

    this.buffers.normals = {
        glBuffer: gl.createBuffer(),
        buffer: tempBuffer
    };
}


const getNewIndices = (p1, p2, points, new_points) => {
    const vec = vec4.create()
    vec[3] = 1.0;
    vec3.lerp(vec, points[p1], points[p2], 0.5);
    vec3.normalize(vec, vec);

    const index = points.length;

    points.push(vec);

    new_points.set([p1, p2], index);
    new_points.set([p2, p1], index);
    return index;
}

/** Draws the shape to the openGL environment.
 */
Sphere.prototype.draw = function() {
    const gl = this.glObj.gl;

    gl.uniformMatrix4fv(glObj.uniforms.modelMatrix, false, new Float32Array(this.model));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.points.glBuffer);
    gl.vertexAttribPointer(glObj.attributes.point, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors.glBuffer);
    gl.vertexAttribPointer(glObj.attributes.color, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normals.glBuffer);
    gl.vertexAttribPointer(glObj.attributes.normal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices.glBuffer);
    gl.drawElements(gl.TRIANGLES, this.buffers.indices.buffer.length,
        gl.UNSIGNED_SHORT, 0);
}

//Reconstructs the model matrix after a tranformation.
Sphere.prototype.reconstructModelMatrix = function() {
    this.model = mat4.create();

    mat4.translate(this.model, this.model, this.translationMatrix);
    mat4.scale(this.model, this.model, this.scalingMatrix);
    mat4.mul(this.model, this.model, this.rotationMatrix);
}

function Sphere(glObj, resolution, centre, radius, colorStart, colorStop) {
    this.glObj = glObj;
    this.buffers = {};
    this.model = mat4.create();

    this.translationMatrix = centre || vec3.create();
    this.scalingMatrix = vec3.fromValues(1.0, 1.0, 1.0);
    this.rotationMatrix = mat4.create();

    if (radius) vec3.set(this.scalingMatrix, radius, radius, radius);

    this.gradientColorStart = colorStart || vec4.fromValues(0.8, 0.3, 1, 1.0);
    this.gradientColorStop = colorStop || vec4.fromValues(0.8, 0.3, 1, 1.0);

    this.reconstructModelMatrix();

    this.initPointsBuffer();
    subdivide(resolution, this.buffers);

    this.initcolorBuffer();
    this.initNormalBuffer();

    loadBufferData(glObj.gl, convert2gl_vec_list(this.buffers.points.buffer), this.buffers.points.glBuffer);
    loadBufferData(glObj.gl, convert2gl_vec_list(this.buffers.colors.buffer), this.buffers.colors.glBuffer);
    loadBufferData(glObj.gl, convert2gl_vec3_list(this.buffers.normals.buffer), this.buffers.normals.glBuffer);
    loadBufferData(glObj.gl, new Uint16Array(this.buffers.indices.buffer), this.buffers.indices.glBuffer, true);
}

/* 
HELPER FUNCTIONS
*/

// Converts from an id to an openGL compatible color 
const convert_id2color = (id) => {
    if (id > 2 << (16 * 3)) return vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    const a = (id >> (16 * 0)) & (255);
    const b = (id >> (16 * 1)) & (255);
    const c = (id >> (16 * 2)) & (255);
    return vec4.fromValues(a / 255.0, b / 255.0, c / 255.0, 1.0);
}

// Gets the id from the color in OpenGL
const convert_color2id = (color) => {
    return (color[0] << (16 * 0)) | (color[1] << (16 * 1)) | (color[2] << (16 * 2));
}

// Converts from a list of vectors to glsl compatible vectors list
const convert2gl_vec_list = (vectors) => {
    const size = vectors.length * 4;
    const glVecList = new Float32Array(size);
    vectors.forEach(function(vector, index) {
        for (let i = 0; i < 4; i++) {
            glVecList[index * 4 + i] = vector[i];
        }
    });
    return glVecList;
}

//Converts a list of vec3 to a buffer usable by openGL.
const convert2gl_vec3_list = (vectors) => {
    const size = vectors.length * 3;
    const glVec3List = new Float32Array(size);
    vectors.forEach(function(vector, index) {
        for (let i = 0; i < 3; i++) {
            glVec3List[index * 3 + i] = vector[i];
        }
    });
    return glVec3List;
}

// This is a recursive function that loops to divide the indices and vertices based on the given resolution
const subdivide = (resolution, buffers) => {
    if (resolution == 0) return;

    const new_points = new Map();
    const new_indices = [];

    for (let i = 0; i < buffers.indices.buffer.length; i += 3) {

        const p1 = buffers.indices.buffer[i + 0];
        const p2 = buffers.indices.buffer[i + 1];
        const p3 = buffers.indices.buffer[i + 2];

        const p1p2 = getNewIndices(p1, p2, buffers.points.buffer, new_points);
        const p2p3 = getNewIndices(p2, p3, buffers.points.buffer, new_points);
        const p3p1 = getNewIndices(p3, p1, buffers.points.buffer, new_points);

        new_indices.push(p1, p1p2, p3p1);
        new_indices.push(p2, p2p3, p1p2);
        new_indices.push(p3, p3p1, p2p3);
        new_indices.push(p1p2, p2p3, p3p1);

    }

    buffers.indices.buffer = new_indices;
    subdivide(resolution - 1, buffers);
}