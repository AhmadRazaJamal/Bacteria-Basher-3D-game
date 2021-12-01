/* 
 ____   __    ___  ____  ____  ____  __   __     ____   __   ____  _  _  ____  ____ 
(  _ \ / _\  / __)(_  _)(  __)(  _ \(  ) / _\   (  _ \ / _\ / ___)/ )( \(  __)(  _ \
 ) _ (/    \( (__   )(   ) _)  )   / )( /    \   ) _ (/    \\___ \) __ ( ) _)  )   /
(____/\_/\_/ \___) (__) (____)(__\_)(__)\_/\_/  (____/\_/\_/(____/\_)(_/(____)(__\_)

Creators: Florencia Chomski & Ahmad Raza Jamal
*/

const pressPlayTxt = document.getElementById('pressPlayTxt');
const wonGameTxt = document.getElementById("gameWon");
const deadImgTag = document.getElementById(`dead`);
const restartedGame = false;
var playerLives;

const BacteriaBasher = () => {
    const canvas = document.querySelector("#webgl");
    const particleCanvas = document.querySelector("#particleCanvas");

    let gl = canvas.getContext("webgl");

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    // Set light positions and colors
    const lightPosition = vec3.fromValues(2.0, 2.0, 2.0);
    const lightColor = vec3.fromValues(1, 1, 1);

    const sphere_properties = {
        centre: vec2.fromValues(canvas.width / 2, canvas.height / 2),
        radius: (Math.min(canvas.width, canvas.height) - 10) / 2.0
    };

    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Enable 3D
    gl.enable(gl.DEPTH_TEST);

    // Uniform variables 
    var uniforms = [
        "modelMatrix",
        "viewMatrix",
        "projectionMatrix",

        "oneColor",
        "single_color",
        "use_texture",

        "light_point",
        "light_color",

        "light_ambient",
        "light_diffuse",
        "light_specular",
    ];

    // Attributes
    var attributes = [
        "point",
        "color",
        "normal",
    ];

    const glObj = initOpenGl(gl, uniforms, attributes);
    gl = glObj.gl;

    gl.useProgram(glObj.program);

    // Game variables
    gameScore = 0;
    playerLives = 2;
    const playerScoreTag = document.getElementById(`player_score`)
    playerScoreTag.innerText = gameScore;

    const sphere = new Sphere(glObj, 5);
    const bacteriaArray = [];

    const maxBacteria = 15;
    const bacteriaIds = new Set();
    for (var i = 0; i < maxBacteria; i++) {
        bacteriaIds.add(i + 3);
    }

    // Sets up the camera in place
    const initCamera = () => {
        var look_from = [0.0, 0.0, 3.0];
        var look_at = [0.0, 0.0, 0.0];
        var up = [0.0, 1.0, 0.0];

        return mat4.lookAt(mat4.create(), look_from, look_at, up);
    }

    // Sets up the projection plane
    const initProjection = () => {
        var fov = glMatrix.toRadian(55);
        var aspect = canvas.width / canvas.height;

        return mat4.perspective(mat4.create(), fov, aspect, 0.1, 100);
    }

    // Initializes the bacteria color values and links it to their ids
    const bacteriaColorsInit = () => {
        var bacteriaColors = new Map();

        var ids = bacteriaIds.entries();

        for (var i = 0; i < bacteriaIds.size; i++) {
            var stop = [0, Math.random() + 10, Math.random()];
            var start = [0, Math.random() + 10, Math.random()];

            bacteriaColors.set(ids.next().value[0], [
                vec4.fromValues(start[1], start[2], start[3], 0.8),
                vec4.fromValues(stop[1], stop[2], stop[3], 0.8)
            ]);
        }
        return bacteriaColors;
    }

    // Coats over the sphere and bacteria object inorder to determine 
    // which point was clicked inorder to determine bacteria to kill
    const setSingleColor = () => {
        gl.uniform1f(glObj.uniforms.oneColor, 1.0);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        draw();
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.uniform1f(glObj.uniforms.oneColor, 0.0);
    }

    // Checks if a bacteria is clicked on
    canvas.addEventListener('click', function click(e) {
        var clickedLocation = getClickLocation(e);
        var x = clickedLocation.x;
        var y = clickedLocation.y;

        var color = new Uint8Array(4);
        setSingleColor();
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

        var id = convert_color2id(color);

        var hit = false;

        for (var i = 0; i < bacteriaArray.length; i++) {
            if (bacteriaArray[i].id == id) {
                const playerScoreTag = document.getElementById(`player_score`)
                gameScore += 1;
                playerScoreTag.innerText = gameScore;

                hit = true;
                bacteriaArray.splice(i, 1);
                bacteriaIds.add(id);
                kaboom(x, y, color)
                break;
            }
        }
        if (hit) {} else {}
        draw();
    })

    // Checks if the user intends to rotate the bacteria by clicking and holding the game sphere
    canvas.addEventListener('mousedown', function(e) {
        if (e.button == 2) {

            var clickLocation = getClickLocation(e);

            var point = {
                x: clickLocation.x - sphere_properties.centre[0],
                y: clickLocation.y - sphere_properties.centre[1],
                z: 0
            };

            sphere_properties.matrix_stash = mat4.copy(mat4.create(), viewMatrix);

            var d2 = point.x * point.x + point.y * point.y;
            var r2 = sphere_properties.radius * sphere_properties.radius;
            if (d2 < r2) {
                point.z = Math.sqrt(r2 - d2);
            }

            sphere_properties.moveStart = vec3.fromValues(point.x, point.y, point.z);
            vec3.normalize(sphere_properties.moveStart, sphere_properties.moveStart);
        }
    });

    // Checks for when the sphere is moved around
    canvas.addEventListener('mousemove', function(e) {
        if ((e.buttons & 2) == 2 && sphere_properties.moveStart != null) {
            var offset = getClickLocation(e);

            var point = {
                x: offset.x - sphere_properties.centre[0],
                y: offset.y - sphere_properties.centre[1],
                z: 0
            };

            var d2 = point.x * point.x + point.y * point.y;
            var r2 = sphere_properties.radius * sphere_properties.radius;
            if (d2 < r2) {
                point.z = Math.sqrt(r2 - d2);
            }

            sphere_properties.moveEnd = vec3.fromValues(point.x, point.y, point.z);
            vec3.normalize(sphere_properties.moveEnd, sphere_properties.moveEnd);

            var axis = vec3.cross(vec3.create(), sphere_properties.moveStart, sphere_properties.moveEnd);
            var angle = Math.acos(vec3.dot(sphere_properties.moveStart, sphere_properties.moveEnd));

            if (vec3.equals(sphere_properties.moveStart, sphere_properties.moveEnd)) {
                mat4.copy(viewMatrix, sphere_properties.matrix_stash);
            } else {
                var transform = mat4.create();

                // Translate into sphere.
                var translate_in = mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0.0, 0.0, 3.0));

                var rot = mat4.rotate(mat4.create(), mat4.create(), angle, axis);

                // Translate out of sphere.
                var translate_out = mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0.0, 0.0, -3.0));


                mat4.mul(transform, translate_in, transform)
                mat4.mul(transform, rot, transform);
                mat4.mul(transform, translate_out, transform);
                mat4.mul(viewMatrix, transform, sphere_properties.matrix_stash);
            }
        }
    });

    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Draw the sphere and bacteria 
    const draw = () => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        sphere.draw();

        // Set the light and projection matrix positions
        gl.uniform3fv(glObj.uniforms.light_point, lightPosition);
        gl.uniform3fv(glObj.uniforms.light_color, lightColor);

        gl.uniformMatrix4fv(glObj.uniforms.viewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(glObj.uniforms.projectionMatrix, false, projectionMatrix);

        // Uses the Phong lighting model to set light attributes
        gl.uniform1f(glObj.uniforms.light_ambient, 0.3);
        gl.uniform1f(glObj.uniforms.light_diffuse, 0.5);
        gl.uniform1f(glObj.uniforms.light_specular, 0.5);

        bacteriaArray.forEach((bacteria) => {
            gl.uniform4fv(glObj.uniforms.single_color, convert_id2color(bacteria.id));
            bacteria.draw();
        });
    }

    const viewMatrix = initCamera();
    const projectionMatrix = initProjection();

    // Gets the next available id from the bacteriaId
    const nextId = () => {
        var bucket = Array.from(bacteriaIds);
        var id = bucket[Math.floor(Math.random() * bucket.length)];

        bacteriaIds.delete(id);
        return id;
    }

    const bacteriaColors = bacteriaColorsInit();

    // Creates a bacteria
    const createBacteria = () => {
        var frequency = 45;
        var radius = 0.07;

        if (Math.random() < 1.0 / frequency && bacteriaArray.length < maxBacteria) {
            var r = vec3.fromValues(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            );
            vec3.normalize(r, r);

            var id = nextId();
            var colors = bacteriaColors.get(id);

            var bacteria = new Sphere(
                glObj,
                5,
                r,
                radius,
                colors ? colors[0] : [0, Math.random() + 10, Math.random()],
                colors ? colors[1] : [0, Math.random() + 10, Math.random()],
                undefined,
                undefined,
                0.02);

            bacteria.id = id;

            bacteriaArray.push(bacteria);
        }
    }

    // Increase the size of bacteria
    const increaseBacteriaSize = () => {
        var incrementAmount = 0.0001;
        var increment = vec3.fromValues(incrementAmount, incrementAmount, incrementAmount);
        var maximumSize = incrementAmount * 2000;

        bacteriaArray.forEach((bacteria) => {
            if (bacteria.scalingMatrix[0] < maximumSize) {
                vec3.add(bacteria.scalingMatrix, bacteria.scalingMatrix, increment);
                bacteria.reconstructModelMatrix();
            } else {
                bacteriaIds.delete(bacteria.id);
                bacteriaColors.delete(bacteria.id)
                bacteriaArray.splice(bacteriaArray.indexOf(bacteria), 1)

                decreasePlayerLives(playerLives);
            }
        });
    }

    // Creates explosion at the bacteria just killed
    function kaboom(x, y, color) {
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
                ptx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

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

        for (i = 0; i <= 10; i++) {
            let dx = (Math.random() - 0.5) * (Math.random() * 6);
            let dy = (Math.random() - 0.5) * (Math.random() * 6);
            let radius = Math.random() * 2;

            let particle = new Particle(
                x, 400 - y,
                radius,
                dx,
                dy,
                color
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

    draw();

    // Runs the game loop 
    function startGame() {
        createBacteria();
        increaseBacteriaSize();
        draw();
        if (playerLives > 0) {
            checkForWin();
            requestAnimationFrame(startGame);
        } else {
            gameOver.style.display = "block";
            document.getElementById("gameOver").innerText += " " + gameScore;
        }
    }
    requestAnimationFrame(startGame);
}

function pressPlay() {
    document.getElementById("playButton").style.display = "none";
    pressPlayTxt.style.display = "none";
    BacteriaBasher();
}

function pressRestart() {
    gameOver.style.display = "none"; //remove gameover text
    deadImgTag.style.display = "none"; //remove deadimg

    //reinstate initial 2 lives (show hearts again)
    var heartImg1 = document.getElementById("heart_1");
    var heartImg2 = document.getElementById("heart_2");
    heartImg1.style.display = "initial";
    heartImg2.style.display = "initial";

    document.getElementById("gameOver").innerHTML = "GAME OVER. Player Score: "; //reset gameover message
    console.log(document.getElementById("gameOver").innerHTML);

    // If game won remove the win message
    document.getElementById("gameWon").style.display = "none";
    pressPlay();
}

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

// Gets the location of the click
function getClickLocation(e) {
    var x = e.clientX,
        y = e.clientY;

    // The height of the canvas is 400
    const rect = e.target.getBoundingClientRect();
    x = (x - rect.left);
    y = 400 - (y - rect.top);
    return { x: x, y: y };
}

// Provides a vec3 in the requested direction
function sphere_vector3(theta, phi) {
    var retval = vec3.fromValues(
        Math.cos(theta) * Math.sin(phi),
        Math.cos(phi),
        Math.sin(theta) * Math.sin(phi)
    );
    return retval;
}

// Provides a vec4 that is a point on the sphere
function sphere_vector(theta, phi) {
    var retval = vec4.fromValues(
        Math.cos(theta) * Math.sin(phi),
        Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
        1.0
    );
    return retval;
}

function checkForWin() {
    if (gameScore >= 15) {
        wonGameTxt.style.display = "block";
        document.getElementById("gameOver").style.display = "block";
        document.getElementById("gameOver").innerText = "YOU WON! Player Score: ";
        playerLives = 0;
    }
}