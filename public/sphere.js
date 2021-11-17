"use strict";

// MIT License

// Copyright (c) 2016 Trevor Barnwell

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


/** A Sphere object.

    Parameters:
      gle: The openGL environment to use.
      depth: The resolution (recommended between 3 and 7).
      centre: The centre for the sphere.
      radius: The radius of the sphere.
      colourStart: The colour for the bottom of the sphere.
      colourStop: The colour for the top of the sphere.
      colourAmbient: The glow coefficient.
      colourDiffuse: The light scattering coefficient.
      colourSpecular: The light reflection coefficient.
*/
function Sphere(gl, depth, centre, radius, colourStart, colourStop,
    colourAmbient, colourDiffuse, colourSpecular) {
    this.gl = gl;
    this.buffers = {};
    this.model = mat4.create();
    this.translation = centre || vec3.create();
    this.scale = vec3.fromValues(1.0, 1.0, 1.0);
    this.rotation = mat4.create();
    this.id = 0;

    if (depth === undefined) depth = 5;

    if (radius !== undefined) vec3.set(this.scale, radius, radius, radius);

    this.colour_start = colourStart || vec4.fromValues(0.0, 0.5, 0.7, 1.0);
    this.colour_stop = colourStop || vec4.fromValues(0.4, 0.8, 0.9, 1.0);

    if (colourAmbient === undefined) colourAmbient = 0.3;
    if (colourDiffuse === undefined) colourDiffuse = 0.5;
    if (colourSpecular === undefined) colourSpecular = 0.5;

    this.colour_ambient = colourAmbient;
    this.colour_diffuse = colourDiffuse;
    this.colour_specular = colourSpecular;

    this.buildModel();

    this._createPointBuffer();
    this._createIndexBuffer();

    this._subdivide(depth);

    this._createColourBuffer();
    this._createNormalBuffer();

    this._loadPointBuffer();
    this._loadColourBuffer();
    this._loadIndexBuffer();
    this._loadNormalBuffer();
}

/** Reconstructs the model matrix after a tranformation.
 */
Sphere.prototype.buildModel = function() {
    this.model = mat4.create();

    mat4.translate(this.model, this.model, this.translation);
    mat4.scale(this.model, this.model, this.scale);
    mat4.mul(this.model, this.model, this.rotation);
}

/** Generates the point from the
    spherical co-ordinates with radius 1.

    Parameters:
      theta: The angle off the Y-pole (theta in [-pi/2, pi/2]).
      phi: The angle in the x/z plane (phi in [0, 2*pi)).

    Returns:
      A vec4 with the point on the sphere.
*/
function sphere_vector(theta, phi) {
    var retval = vec4.fromValues(
        Math.cos(theta) * Math.sin(phi),
        Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
        1.0
    );
    return retval;
}

/** Converts a list of vec4 to a buffer usable
    by openGL.

    Parameters:
      vectors: A list of vec4s fo put in the buffer.

    Returns:
      A buffer with the vec4s side by side.
*/
function gl_vector_list(vectors) {
    var size = vectors.length * 4;
    var return_value = new Float32Array(size);
    vectors.forEach(function(vector, index) {
        for (var i = 0; i < 4; i++) {
            return_value[index * 4 + i] = vector[i];
        }
    }, this);
    return return_value;
}


/** Converts a list of vec3 to a buffer usable
    by openGL.

    Parameters:
      vectors: A list of vec3s fo put in the buffer.

    Returns:
      A buffer with the vec3s side by side.
*/
function gl_vector3_list(vectors) {
    var size = vectors.length * 3;
    var return_value = new Float32Array(size);
    vectors.forEach(function(vector, index) {
        for (var i = 0; i < 3; i++) {
            return_value[index * 3 + i] = vector[i];
        }
    }, this);
    return return_value;
}

/** Creates the point buffer.
 */
Sphere.prototype._createPointBuffer = function() {
    var gl = this.gl;
    var gl_buffer = gl.createBuffer();

    var buffer = [
        sphere_vector(0.0, 0.0),
        sphere_vector(0.0, Math.acos(-1.0 / 3.0)),
        sphere_vector(2.0 * Math.PI / 3.0, Math.acos(-1.0 / 3.0)),
        sphere_vector(4.0 * Math.PI / 3.0, Math.acos(-1.0 / 3.0)),
    ];

    this.buffers.points = {
        gl_buffer: gl_buffer,
        buffer: buffer
    }
}

/** Loads the point buffer into the openGL environment.
 */
Sphere.prototype._loadPointBuffer = function() {
    var gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.points.gl_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, gl_vector_list(this.buffers.points.buffer),
        gl.STATIC_DRAW);
}

/** Creates the colour buffer.
 */
Sphere.prototype._createColourBuffer = function() {
    var gl = this.gl;
    var gl_buffer = gl.createBuffer();

    var colour_norm = vec4.fromValues(0.0, 0.0, 1.0, 0.0);

    var colour_difference = vec4.sub(vec4.create(),
        this.colour_stop, this.colour_start);

    var colour_matrix = mat4.create();
    for (var i = 0; i < 3; i++) {
        colour_matrix[0 + i * 4] = colour_difference[0] * colour_norm[i];
        colour_matrix[1 + i * 4] = colour_difference[1] * colour_norm[i];
        colour_matrix[2 + i * 4] = colour_difference[2] * colour_norm[i];
    }

    colour_matrix[12] = this.colour_start[0];
    colour_matrix[13] = this.colour_start[1];
    colour_matrix[14] = this.colour_start[2];

    var m = mat4.create()

    mat4.scale(m, m, [0.5, 0.5, 0.5]);
    mat4.translate(m, m, [1.0, 1.0, 1.0]);
    mat4.mul(colour_matrix, colour_matrix, m);

    var buffer = [];

    this.buffers.points.buffer.forEach(function(point) {
        var colour = vec4.create();
        vec4.transformMat4(colour, point, colour_matrix);

        buffer.push(colour);
    }, this);

    this.buffers.colours = {
        gl_buffer: gl_buffer,
        buffer: buffer
    }
}

/** Loads the colour buffer into the openGL environment.
 */
Sphere.prototype._loadColourBuffer = function() {
    var gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colours.gl_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, gl_vector_list(this.buffers.colours.buffer),
        gl.STATIC_DRAW);
}

/** Creates the index buffer.
 */
Sphere.prototype._createIndexBuffer = function(depth) {
    var gl = this.gl;
    var gl_buffer = gl.createBuffer();

    var buffer = [];

    buffer.push(0, 2, 1);
    buffer.push(0, 1, 3);
    buffer.push(0, 3, 2);
    buffer.push(1, 2, 3);

    this.buffers.indices = {
        gl_buffer: gl_buffer,
        buffer: buffer
    }
}

/** Loads the index buffer into the openGL environment.
 */
Sphere.prototype._loadIndexBuffer = function() {
    var gl = this.gl;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices.gl_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(this.buffers.indices.buffer), gl.STATIC_DRAW);
}

/** Creates the normal buffer.
 */
Sphere.prototype._createNormalBuffer = function() {
    var gl = this.gl;

    var gl_buffer = gl.createBuffer();
    var buffer = [];

    this.buffers.points.buffer.forEach(function(point) {
        buffer.push(vec3.clone(point));
    }, this);

    this.buffers.normals = {
        gl_buffer: gl_buffer,
        buffer: buffer
    };
}

/** Loads the normal buffer into the openGL environment.
 */
Sphere.prototype._loadNormalBuffer = function() {
    var gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normals.gl_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, gl_vector3_list(this.buffers.normals.buffer),
        gl.STATIC_DRAW);
}

/** Subdivides the points buffer and indicies buffer
    to create more triangles (makes the shape smoother).

    Parameters:
      depth: The number of times to subdivide.
*/
Sphere.prototype._subdivide = function(depth) {
    if (depth == 0) return;

    var points = this.buffers.points.buffer;
    var indices = this.buffers.indices.buffer;

    var new_points = new Map();

    /** Finds the existing vertex or creates it.

        Parameters:
          a: One end index.
          b: The other end index.

        Returns:
          The index of the appropriate point.
    */
    function get_index(a, b) {
        if (new_points.has([a, b])) {
            return new_points.get([a, b]);
        } else {
            var vec = vec4.create()
            vec[3] = 1.0;
            vec3.lerp(vec, points[a], points[b], 0.5);
            vec3.normalize(vec, vec);

            var index = points.length;

            points.push(vec);

            new_points.set([a, b], index);
            new_points.set([b, a], index);
            return index;
        }
    }

    var new_indices = [];

    for (var i = 0; i < indices.length; i += 3) {

        var a = indices[i + 0];
        var b = indices[i + 1];
        var c = indices[i + 2];

        var ab = get_index(a, b);
        var bc = get_index(b, c);
        var ca = get_index(c, a);

        new_indices.push(a, ab, ca);
        new_indices.push(b, bc, ab);
        new_indices.push(c, ca, bc);
        new_indices.push(ab, bc, ca);

    }

    this.buffers.indices.buffer = new_indices;

    this._subdivide(depth - 1);
}

/** Draws the shape to the openGL environment.
 */
Sphere.prototype.draw = function(program) {
    var gl = this.gl;

    gl.uniform1f(gl.getUniformLocation(program, "lightAmbient"), this.colour_ambient);
    gl.uniform1f(gl.getUniformLocation(program, "lightDiffuse"), this.colour_diffuse);
    gl.uniform1f(gl.getUniformLocation(program, "lightSpecular"), this.colour_specular);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, new Float32Array(this.model));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.points.gl_buffer);
    gl.vertexAttribPointer(gl.getUniformLocation(program, "vertexPosition"), 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colours.gl_buffer);
    gl.vertexAttribPointer(gl.getUniformLocation(program, "vertexColor"), 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normals.gl_buffer);
    gl.vertexAttribPointer(gl.getUniformLocation(program, "vertexNormal"), 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices.gl_buffer);
    gl.drawElements(gl.TRIANGLES, this.buffers.indices.buffer.length,
        gl.UNSIGNED_SHORT, 0);
}