// Write the vertex shader and fragment shader functions
var vertexShaderText = [
    'attribute vec3 vertPosition;',
    'varying vec3 fragColor;',
    'attribute vec3 vertColor;',
    '',
    'void main() {',
    '	fragColor = vertColor;',
    '	gl_Position = vec4(vertPosition, 1.0);',
    '}'
].join('\n');

var fragmentShaderText = [
    'precision mediump float;',
    'varying vec3 fragColor;',

    'void main()',
    '{',

    '	gl_FragColor = vec4(fragColor,1.0);',
    '}',
].join('\n')

const deadImgTag = document.getElementById(`dead`);
const pressPlayTxt = document.getElementById('pressPlayTxt');
var wonGameTxt = document.getElementById("gameWon");
var bacteriaArray;
var gameScore;
var playerLives;


function bacteriaBasher() {

    /* 
    SET UP WEBGL PTX
    */
    const canvas = document.querySelector("#webgl");
    const particleCanvas = document.querySelector("#particleCanvas");
    // Initialize the GL ptx
    const gl = canvas.getContext("webgl");

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;

    // Centered the circle at the center of the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set up WebGL, vertexShader, fragmentShader and shader program
    var uniforms = [
        "modelMatrix",
        "viewMatrix",
        "projectionMatrix",

        "light_point",
        "light_colour",

        "light_ambient",
        "light_diffuse",
        "light_specular",
    ];

    var attributes = [
        "point",
        "colour",
        "normal",
    ];

    var light_point = vec3.fromValues(2.0, 2.0, 2.0);
    var light_colour = vec3.fromValues(1.0, 1.0, 1.0);

    var vs_source = document.getElementById("vertex_shader").innerHTML;
    var fs_source = document.getElementById("fragment_shader").innerHTML;

    const gle = new GLEnvironment(gl,
        vs_source, fs_source,
        uniforms, attributes);

    gl.useProgram(gle.shader);

    /*  
     DRAWING
    */
    // Game global variables
    gameScore = 0;
    bacteriaArray = [];
    // Spawn a total of 30 bacteria
    var remainingBacteria = 30;
    playerLives = 2;
    var totalBacteria = 5;
    var RGB_values = [];
    // A variable that holds what color bacteria was recently destroyed, if it was green and then green 
    // again, don't reduce points, else if they are two different colored ones, reduce player points
    var recentColorDestroyed = [];

    // Add color values to the RGB array 
    for (var i = 0; i < totalBacteria; i++) {
        RGB_values.push([Math.tan(i), Math.tanh(i), Math.sin(i)]);
    }

    // Initialize player score as zero
    const playerScoreTag = document.getElementById(`player_score`)
    playerScoreTag.innerText = gameScore;

    // Converts degrees to radians
    function radian(degree) {
        var rad = degree * (Math.PI / 360);
        return rad;
    }

    // Initialize Bacteria color array
    var bacterColorsArray = [];

    for (i = 0; i < remainingBacteria; i++) {
        bacterColorsArray.push([Math.random(), Math.random(), Math.random()])
    }

    // Initialize Bacteria ids array 
    var bacteriaIdArray = new Set();
    for (var i = 0; i < remainingBacteria; i++) {
        bacteriaIdArray.add(i + 3);
    }

    // Function to draw a circle
    function drawCircle(x, y, r, isBacteria, index) {
        var vertices = [];
        var color = [];

        // Create vertices from 1 to 360
        for (let i = 1; i <= 360; i += 0.1) {
            var y1 = Math.sin(i) * r + y;
            var x1 = Math.cos(i) * r + x;

            var y2 = Math.sin(i + 1) * r + y;
            var x2 = Math.cos(i + 1) * r + x;

            vertices.push(x, y, 0)
            vertices.push(x1, y1, 0);
            vertices.push(x2, y2, 0);

            // If bacteria then add green color else add pink color to the game surface
            if (!isBacteria) {
                color.push(Math.cosh(radian(i)), Math.tan(radian(i)), Math.cosh(radian(i)));
                color.push(Math.cosh(radian(i)), Math.cos(radian(i)), Math.cosh(radian(i)));
                color.push(Math.cosh(radian(i)), Math.cos(radian(i)), Math.cosh(radian(i)));
            } else {
                color.push(RGB_values[index][0], RGB_values[index][1], RGB_values[index][2]);
                color.push(RGB_values[index][0], RGB_values[index][1], RGB_values[index][2]);
                color.push(RGB_values[index][0], RGB_values[index][1], RGB_values[index][2]);
            }
        }

        // // attributeSet(gl, program, "vertPosition", 3, vertices);
        // // attributeSet(gl, program, "vertColor", 3, color);

        // gl.drawArrays(gl.TRIANGLES, 0, 360 * 3);

    }

    // Find the distance between two bacteria 
    function distance(bacteria_1, bacteria_2) {
        if (bacteria_1 == undefined || bacteria_2 == undefined) return;

        var distance_x = bacteria_2.x - bacteria_1.x;
        var distance_y = bacteria_2.y - bacteria_1.y;
        return Math.sqrt(Math.pow(distance_x, 2) + Math.pow(distance_y, 2));
    }

    // Checks if two bacteria are colliding with each other
    function collidingBacteria(bacteria_1, bacteria_2) {
        if (bacteria_1 == undefined || bacteria_2 == undefined) return;

        if (distance(bacteria_1, bacteria_2) - (bacteria_1.r + bacteria_2.r) < 0) {
            return true;
        }
        return false;
    }

    // A function that decreases the number of hearts for a player if it reaches a certain threshold
    function decreasePlayerLives(lives) {
        if (lives > 0) {
            const heartImgTag = document.getElementById(`heart_${lives}`);
            heartImgTag.style.display = "none";
            playerLives--;
        }
        if (gameScore < 15 && lives == 1) {
            deadImgTag.style.display = "initial";
        }
    }

<<<<<<< HEAD
    function element_offset(element) {
        var x = 0;
        var y = 0;

        while (element != null) {
            x += element.offsetTop;
            y += element.offsetLeft;
            element = element.parentElement;
        }
        return { x: x, y: y };
    }

    draw = function() {

        var light_point = vec3.fromValues(2.0, 2.0, 2.0);
        var light_colour = vec3.fromValues(1.0, 1.0, 1.0);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(gle.uniforms.viewMatrix, false, this.viewMatrix);
        gl.uniformMatrix4fv(gle.uniforms.projectionMatrix, false,
            this.projectionMatrix);

        gl.uniform3fv(gle.uniforms.light_point, light_point);
        gl.uniform3fv(gle.uniforms.light_colour, light_colour);

        ball.draw(gl, gle.shader);

        (bacteriaArray)
        bacteriaArray.forEach(function(bacteria) {
            bacteria.draw(gl, gle.shader);
        }, this);
    }


    /** Draw fake colours.

        Note:
          Usefull for checking things.
    */

    const false_draw = () => {
        gl.uniform1f(gle.uniforms.one_colour, 1.0);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        draw();
        gl.clearColor(0.0, 0.4, 0.7, 1.0);
        gl.uniform1f(gle.uniforms.one_colour, 0.0);
    }

    // Checks if a bacteria is clicked on
    canvas.onmousedown = function click(event) {
        // var x = e.clientX,
        //     y = e.clientY;

        // // The height of the canvas is 400
        // const rect = e.target.getBoundingClientRect();
        // x = ((x - rect.left) - 400 / 2) / (400 / 2);
        // y = (400 / 2 - (y - rect.top)) / (400 / 2);

        // var clickedPoint = { x: x, y: y, r: 0 };
        // (x, y)

        // // Loop through all bacteria and check if you clicked within the radius of any
        // // Increase score and destroy the bacteria
        // for (var i in bacteriaArray) {
        //     if (collidingBacteria(clickedPoint, bacteriaArray[i])) {
        //         kaboom(bacteriaArray[i]);

        //         const playerScoreTag = document.getElementById(`player_score`)
        //         gameScore += 1;
        //         playerScoreTag.innerText = gameScore;

        //         destroy(bacteriaArray[i], i);
        //         hit = true;
        //         break;
        //     }
        // }

        var x = event.clientX,
            y = event.clientY;

        // The height of the canvas is 400
        const rect = event.target.getBoundingClientRect();
        x = (x - rect.left);
        y = (400 - (y - rect.top));
        console.log(x, y)

        var colour = new Uint8Array(4);
        false_draw();
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, colour);
        console.log(colour)

        var id = colour2id(colour);

        var hit = false;
        draw();
=======
    // Checks if a bacteria is clicked on
    canvas.onmousedown = function click(e) {
        var x = e.clientX,
            y = e.clientY;

        // The height of the canvas is 400
        const rect = e.target.getBoundingClientRect();
        x = ((x - rect.left) - 400 / 2) / (400 / 2);
        y = (400 / 2 - (y - rect.top)) / (400 / 2);

        var clickedPoint = { x: x, y: y, r: 0 };
        console.log(x, y)

        // Loop through all bacteria and check if you clicked within the radius of any
        // Increase score and destroy the bacteria
        for (var i in bacteriaArray) {
            if (collidingBacteria(clickedPoint, bacteriaArray[i])) {
                kaboom(bacteriaArray[i]);

                const playerScoreTag = document.getElementById(`player_score`)
                gameScore += 1;
                playerScoreTag.innerText = gameScore;

                destroy(bacteriaArray[i], i);
                hit = true;
                break;
            }
        }
>>>>>>> parent of 5b38628 (moved code around and simplified bacteria spawning)
    }

    function destroy(bacteria, index) {
        if (bacteria == undefined) { return; }
        bacteria.dead = true;
        remainingBacteria -= 1;
        bacteria.x = 0;
        bacteria.y = 0;
        bacteria.r = 0;

        for (i in bacteria.consuming) {
            destroy(bacteria.consuming[i], bacteriaArray.indexOf(bacteria.consuming[i]));
        }

        for (i in bacteriaArray) {
            if (bacteriaArray[i] == undefined || bacteriaArray[i].consuming == undefined) {
                continue;
            }
            if (bacteriaArray[i].consuming.indexOf(bacteria) != -1) {
                bacteriaArray[i].consuming.splice(bacteriaArray[i].consuming.indexOf(bacteria), 1);
            }
        }

        // Set the bacteria consumption array to empty and remove it from the bacteria array
        bacteria.consuming = [];
        bacteriaArray[index] = undefined;

        if (remainingBacteria >= totalBacteria & playerLives > 0) {
            bacteriaArray[bacteriaArray.findIndex(Object.is.bind(null, undefined))] = (createBacteria());
            createBacteria(bacteriaArray[totalBacteria - 1]);
        }
    }

    function increaseBacteriaSize(bacteria, index) {
        if (bacteria !== undefined && !bacteria.dead) {
            // If the radius of bacteria is greater than 0.35, decrease player's life and kill the bacteria
            if (bacteria.r < 0.35) {
                // Increase the size of each bacteria by 0.0003 each tick
                bacteria.r += 0.0004;

                // Checking if the bacteria to updates collides with any of the bacteria in the array
                for (var i = 0; i < bacteriaArray.length; i++) {
                    // Skip itslef 
                    if (bacteria == bacteriaArray[i] || bacteriaArray[i] == undefined) {
                        continue;
                    }
                    // If the bacteria aren't in each other consumption arrays 
                    if (bacteria.consuming.indexOf(bacteriaArray[i]) == -1 && bacteriaArray[i].consuming.indexOf(bacteria) == -1) {
                        // If bacteria are touching, add it to the consuming array of this bacteria
                        if (collidingBacteria(bacteria, bacteriaArray[i])) {
                            if (bacteria.id < bacteriaArray[i].id) {
                                bacteria.consuming.push(bacteriaArray[i]);
                            }
                        }
                        // If bacteria already exists in the consuming array, move it towards it and shrink its radius
                    } else {
                        for (i in bacteria.consuming) {
                            var consuming = bacteria.consuming[i];
                            // If the consuming bacteria has fully entered the larger bacteria, destroy the consumed
                            if (distance(bacteria, consuming) <= (bacteria.r - consuming.r) || consuming.r <= 0.0) {
                                destroy(consuming, bacteriaArray.indexOf(consuming));
                            } else {
                                // Move the bacteria towards the consumer and decrease it's radius
                                consuming.x -= 0.001;
                                consuming.y -= 0.001;
                                consuming.r -= 0.0020;
                                bacteria.r += 0.01 * consuming.r;
                            }
                        }
                    }
                }
            } else {
                // If bacteria reaches threshold size, then destroy bacteria and reduce player score
                if (recentColorDestroyed !== RGB_values[index] && gameScore < 15) {
                    decreasePlayerLives(playerLives)
                }
                recentColorDestroyed = RGB_values[index];
                destroy(bacteria, bacteriaArray.indexOf(bacteria));
            }
            drawCircle(bacteria.x, bacteria.y, bacteria.r, true, index);
        }
    }

    function calculateBacteriaCoordinates() {
        var x = Math.random() >= .5 ? 0.6 : -0.6;
        var y = Math.random() >= .5 ? 0.6 : -0.6;
        var trig = Math.random() >= .5 ? "sin" : "cos";
        var angle = Math.random();

        if (trig == "sin") {
            x = x * Math.sin(angle);
            y = y * Math.cos(angle);
        } else {
            x = x * Math.cos(angle);
            y = y * Math.sin(angle);
        }
        return [x, y];
    }

<<<<<<< HEAD
    /** Intialize the bacteria colours.
     */
    const bacteriaColorsInit = () => {
        (bacteriaIdArray.entries())
        var id_iterate = bacteriaIdArray.entries();

        for (var i = 0; i < bacteriaIdArray.size; i++) {
            var hue = i * 360.0 / bacteriaIdArray.size;

            var stop = hsl2rgb([hue, 1.0, 0.8 - 0.2 * (i % 2)]);
            var start = hsl2rgb([hue, 1.0, 0.4 - 0.2 * (i % 2)]);

            bacteriaColors.set(id_iterate.next().value[0], [
                vec4.fromValues(start[0], start[1], start[2], 1.0),
                vec4.fromValues(stop[0], stop[1], stop[2], 1.0)
            ]);
        }
        this._bacteriaColors = bacteriaColors;
        (bacteriaColors)
    }

    function createBacteria(maxBacteria, ids, gle) {
        var radius = 0.2;
        (bacteriaColors)
        if (bacteriaArray.length < maxBacteria && bacteriaIdArray.size > 0) {
=======
    function createBacteria(maxBacteria, ids, gle) {
        var radius = 0.06;

        if (bacteriaArray.length < maxBacteria) {
>>>>>>> parent of 5b38628 (moved code around and simplified bacteria spawning)
            var r = vec3.fromValues(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            vec3.normalize(r, r);

            var id = ids(bacteriaIdArray);
            var bacteria = new Sphere(
                gle,
                gl,
                5,
                r,
                radius,
                bacterColorsArray[Math.floor(Math.random() * bacterColorsArray.length)],
                bacterColorsArray[Math.floor(Math.random() * bacterColorsArray.length)],
                0.3);
            bacteria.id = id;

            var pole = vec3.fromValues(0.0, 0.0, 1.0);

            if (!vec3.equals(r, pole)) {
                var axis = vec3.cross(vec3.create(), pole, r);
                vec3.normalize(axis, axis);

                var angle = Math.acos(vec3.dot(pole, r));
                bacteria.rotation = mat4.rotate(mat4.create(), mat4.create(),
                    angle, axis);
                bacteria.buildModel();
            }

            return bacteria;
        }
    }

    // Creates explosion at the bacteria just killed
    function kaboom(bacteria) {
        // Initialize particle variables
        var ptx = particleCanvas.getContext("2d");
        let particles = [];

        // Particle class 
        class Particle {
            constructor(x, y, radius, dx, dy, color) {
                this.x = x;
                this.y = y;
                this.radius = radius;
                this.dx = dx;
                this.dy = dy;
                this.color = color;
            }
            draw() {
                ptx.save();
                ptx.fillStyle = `rgb(${this.color[0] * 255}, ${this.color[1] * 255}, ${this.color[2] * 255})`;

                // Begin arc path
                ptx.beginPath();

                // A circle is created
                ptx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
                ptx.fill();

                // Restore recent canvas context
                ptx.restore();
            }
            update() {
                this.draw();
                this.x += this.dx;
                this.y += this.dy;
            }
        }

        for (i = 0; i <= 50; i++) {
            let dx = (Math.random() - 0.5) * (Math.random() * 6);
            let dy = (Math.random() - 0.5) * (Math.random() * 6);
            let radius = Math.random() * 3;

            // Changinf bacteria coordinates to canvas coordinates
            let particle = new Particle(
                (bacteria.x + 2 / 75 + 1) * 600, -1 * (bacteria.y - 1) * 250,
                radius,
                dx,
                dy,
                RGB_values[bacteriaArray.indexOf(bacteria)]
            );

            // Create new particles
            particles.push(particle);
        }


        /* Particle explosion function */
        function explosion() {
            // Clear the canvas and then draw the particles 
            ptx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((particle, i) => {
                particle.update()
            })

            // Animate
            requestAnimationFrame(explosion);
        }

        explosion();
    }

    // for (var i = 0; i < totalBacteria; i++) {
    //     var createdBacteria = createBacteria();
    //     bacteriaArray.push(createdBacteria);
    //     drawCircle(createdBacteria.x, createdBacteria.y, createdBacteria.r, false, i);
    // }

    // // Starts the game and loops till either all bacteria are killed or player lives are equal to zero
    // function startGame() {
    //     // Updates the score span element in the html
    //     for (i in bacteriaArray) {
    //         increaseBacteriaSize(bacteriaArray[i], i);
    //     }
    //     drawCircle(0, 0, 0.6, false);
    //     if (playerLives > 0) {
    //         checkForWin();
    //         requestAnimationFrame(startGame);
    //     } else {
    //         gameOver.style.display = "block";
    //         document.getElementById("gameOver").innerText += " " + gameScore;
    //     }
    // }
    // requestAnimationFrame(startGame);

    var ball = new Sphere(gle, gl, 5);

    setCamera();
    setProjection();

    // var gl2 = gle.gl;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(gle.uniforms.viewMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(gle.uniforms.projectionMatrix, false,
        projectionMatrix);

    gl.uniform3fv(gle.uniforms.light_point, light_point);
    gl.uniform3fv(gle.uniforms.light_colour, light_colour);

    ball.draw(gl, gle.shader);

    var i = 0;
    while (i < 100) {
        bacteriaArray.push(createBacteria(100, bacteriaIdProvider, gle))
        i++;
    }

    bacteriaArray.forEach(function(bacteria) {
        bacteria.draw(gl, gle.shader);
    }, this);

}

function pressPlay() {
    pressPlayTxt.style.display = "none";
    bacteriaBasher();
}

function pressRestart() {
    gameOver.style.display = "none"; //remove gameover text
    // deadImgTag.style.display = "none"; //remove deadImg
    var heartImg1 = document.getElementById("heart_1");
    var heartImg2 = document.getElementById("heart_2");
    deadImgTag.style.display = "none";

    //reshow both heart images
    heartImg1.style.display = "initial";
    heartImg2.style.display = "initial";
    gameScore = 0;
    document.getElementById("gameOver").innerHTML = "GAME OVER. Player Score: ";

    // If game won remove the win message
    document.getElementById("gameWon").style.display = "none";
    pressPlay();

}

function checkForWin() {
    if (gameScore >= 15) {
        wonGameTxt.style.display = "block";
        document.getElementById("gameOver").style.display = "block";
        document.getElementById("gameOver").innerText = "GAME OVER. Player Score: " + gameScore;
        for (i in bacteriaArray) {
            bacteriaArray[i] = [];
        }
    }
}

// Sets the view matrix
const setCamera = () => {
    var look_from = [0.0, 2.0, 3.0];
    var look_at = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];

    this.viewMatrix = mat4.create();
    mat4.lookAt(this.viewMatrix, look_from, look_at, up);
}

// Sets the projection matrix
const setProjection = () => {
    var fov = radian(120);
    var width = 400;
    var height = 400;
    var aspect = width / height;
    var near = 0.1;
    var far = 100.0;

    this.projectionMatrix = mat4.create();
    mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
}

const bacteriaIdProvider = (bacteriaIdArray) => {
    var bucket = Array.from(bacteriaIdArray);
    var id = bucket[Math.floor(Math.random() * bucket.length)];

    bacteriaIdArray.delete(id);
    return id;
}

// Converts degrees to radians
function radian(degree) {
    var rad = degree * (Math.PI / 360);
    return rad;
}