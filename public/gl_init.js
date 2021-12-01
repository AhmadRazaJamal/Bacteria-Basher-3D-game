const vertexShaderSrc = `
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

uniform float oneColor;
uniform vec4 single_color;

attribute vec4 point;
attribute vec4 color;
attribute vec3 normal;

attribute vec2 tex_coord;

uniform vec3 light_point;
uniform vec3 light_color;
uniform float light_ambient;
uniform float light_diffuse;
uniform float light_specular;

varying vec4 vertexPosition;

varying vec4 vertexColor;
varying float colorCoat;
varying vec4 singleColor;

varying vec3 vertexNormal;
varying vec3 lightPosition;
varying vec3 lightColor;

varying float lightAmbient;
varying float lightDiffuse;
varying float lightSpecular;

varying vec3 cameraPosition;

void  main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * point;
                
  vertexPosition = viewMatrix * modelMatrix * point;
                
  vertexColor = color;
  colorCoat = oneColor;
  singleColor = single_color;
  
  vertexNormal = normalize(vec3(viewMatrix * modelMatrix * vec4(normal, 0.0)));  
  
  lightPosition = light_point;
  lightColor = light_color;
  
  lightAmbient = light_ambient;
  lightDiffuse = light_diffuse;
  lightSpecular = light_specular;
  
  cameraPosition = -vec3(viewMatrix * vec4(0.0, 0.0, 0.0, 1.0));
  
}`

const fragmentShaderSrc = `
precision mediump float;
      
varying vec4 vertexPosition;
varying vec4 vertexColor;
varying vec3 vertexNormal;

varying float colorCoat;
varying vec4 singleColor;

varying vec3 lightPosition;
varying vec3 lightColor;

varying float lightAmbient;
varying float lightDiffuse;
varying float lightSpecular;

varying vec3 cameraPosition;

void main() {

  vec4 light_color = vec4(lightColor, 1.0);
  vec3 light_delta = lightPosition - vertexPosition.xyz;
  vec3 light_direction = normalize(light_delta);

  if (colorCoat > 0.5) {
    gl_FragColor = singleColor;
  } else {
    float cosAngle = clamp(dot(light_direction, vertexNormal), 0.0, 1.0);
    float cosReflect = clamp(dot(reflect(-light_direction, vertexNormal), normalize(cameraPosition)), 0.0, 1.0);
    
    gl_FragColor = 
        lightAmbient * vertexColor + 
        lightDiffuse * vertexColor * light_color * cosAngle +
        lightSpecular * vertexColor * light_color * pow(cosReflect, 3.0);
    
    gl_FragColor.w = vertexColor.w;
  }
}`;

// Initializes openGl, sets up shaders, compiles them links it to the program
const initOpenGl = (gl, uniformNames, attributesNames) => {
    const { vertexShader, fragmentShader } = compileShaders(gl, vertexShaderSrc, fragmentShaderSrc);
    const program = linkShadersToProgram(gl, vertexShader, fragmentShader);
    const uniforms = getUniformsLocation(gl, uniformNames, program);
    const attributes = enableAttributes(gl, attributesNames, program);

    glObj = { gl, vertexShader, fragmentShader, program, uniforms, attributes }
    return glObj;
}

// Creates and compiles shaders
const compileShaders = (gl, vertexShaderSource, fragmentShaderSource) => {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
        return;
    }

    return { vertexShader, fragmentShader }

}

// Links shaders to the shader program 
const linkShadersToProgram = (gl, vertexShader, fragmentShader) => {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program!', gl.getProgramInfo(program));
        return;
    }

    return program;
}

// Sets all the unform glsl variables
const getUniformsLocation = (gl, uniformNames, program) => {
    var uniforms = {};
    uniformNames.forEach((uniform) => uniforms[uniform] = gl.getUniformLocation(program, uniform));
    return uniforms;
}

// Enables attributes
enableAttributes = (gl, attributeNames, program) => {
    var attributes = {};

    attributeNames.forEach((attr) => {
        attributes[attr] = gl.getAttribLocation(program, attr);
        gl.enableVertexAttribArray(attributes[attr]);
    });

    return attributes;
}

// Loads buffer data
loadBufferData = (gl, bufferData, buffer, indices) => {
    if (!indices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
    } else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
    }
}