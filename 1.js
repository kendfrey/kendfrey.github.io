var gameContainer;

window.onload = function ()
{
	gameContainer = document.getElementById("gameContainer");
	gameContainer.addEventListener("click", startGame);
}

document.addEventListener("pointerlockchange", onPointerLockChange);
document.addEventListener("mozpointerlockchange", onPointerLockChange);
document.addEventListener("webkitpointerlockchange", onPointerLockChange);
document.addEventListener("mspointerlockchange", onPointerLockChange);

function startGame()
{
	var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
	console.log(pointerLockElement);
	if (pointerLockElement !== gameContainer)
	{
		gameContainer.requestPointerLock = gameContainer.requestPointerLock || gameContainer.mozRequestPointerLock || gameContainer.webkitRequestPointerLock || gameContainer.msRequestPointerLock;
		gameContainer.requestPointerLock();
	}
}

function onPointerLockChange()
{
	var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
	if (pointerLockElement === gameContainer)
	{
		init();
	}
	else
	{
		cleanup();
	}
}

var scene, hudScene, camera, hudCamera, renderer, clock, keysDown, mouseDeltaX, mouseDeltaY, timeout, animationFrame, textMaterial, textWonMaterial, textMesh, finishMesh, timeLeft, clockRunning, walkingArea, winningArea, won;

function init()
{
	scene = new THREE.Scene();
	hudScene = new THREE.Scene();
	var aspectRatio = gameContainer.offsetWidth / gameContainer.offsetHeight;
	camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.001, 1000);
	camera.rotation.order = "YXZ";
	hudCamera = new THREE.OrthographicCamera(aspectRatio * -0.5, aspectRatio * 0.5, 0.5, -0.5, -0.5, 0.5);
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(gameContainer.offsetWidth, gameContainer.offsetHeight);
	gameContainer.appendChild(renderer.domElement);

	var wallTexture = THREE.ImageUtils.loadTexture("wall.png");
	wallTexture.magFilter = THREE.NearestFilter;
	wallTexture.minFilter = THREE.NearestMipMapLinearFilter;
	wallTexture.wrapS = THREE.RepeatWrapping;
	wallTexture.wrapT = THREE.RepeatWrapping;
	var wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture });
	var floorTexture = THREE.ImageUtils.loadTexture("floor.png");
	floorTexture.magFilter = THREE.NearestFilter;
	floorTexture.minFilter = THREE.NearestMipMapLinearFilter;
	floorTexture.wrapS = THREE.RepeatWrapping;
	floorTexture.wrapT = THREE.RepeatWrapping;
	var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
	var finishTexture = THREE.ImageUtils.loadTexture("finish.png");
	finishTexture.magFilter = THREE.NearestFilter;
	finishTexture.minFilter = THREE.NearestMipMapLinearFilter;
	var finishMaterial = new THREE.MeshBasicMaterial({ map: finishTexture, transparent: true, side: THREE.DoubleSide });
	textMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
	textWonMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
	
	var geometry, mesh;
	
	geometry = new THREE.PlaneGeometry(1, 1);
	mesh = new THREE.Mesh(geometry, finishMaterial);
	mesh.position.x = 0.5;
	mesh.position.y = 0.5;
	mesh.position.z = -19;
	scene.add(mesh);
	finishMesh = mesh;
	
	geometry = new THREE.PlaneGeometry(1, 1);
	mesh = new THREE.Mesh(geometry, wallMaterial);
	mesh.position.x = 0.5;
	mesh.position.y = 0.5;
	mesh.position.z = -20;
	scene.add(mesh);
	
	geometry = new THREE.PlaneGeometry(1, 1);
	mesh = new THREE.Mesh(geometry, wallMaterial);
	mesh.position.x = 0.5;
	mesh.position.y = 0.5;
	mesh.position.z = 0;
	mesh.rotation.y = Math.PI;
	scene.add(mesh);
	
	geometry = new THREE.PlaneGeometry(20, 1);
	geometry.faceVertexUvs[0][0][2] = new THREE.Vector2(20, 1);
	geometry.faceVertexUvs[0][1][1] = new THREE.Vector2(20, 0);
	geometry.faceVertexUvs[0][1][2] = new THREE.Vector2(20, 1);
	mesh = new THREE.Mesh(geometry, wallMaterial);
	mesh.position.x = 1;
	mesh.position.y = 0.5;
	mesh.position.z = -10;
	mesh.rotation.y = Math.PI * 1.5;
	scene.add(mesh);
	
	geometry = new THREE.PlaneGeometry(20, 1);
	geometry.faceVertexUvs[0][0][2] = new THREE.Vector2(20, 1);
	geometry.faceVertexUvs[0][1][1] = new THREE.Vector2(20, 0);
	geometry.faceVertexUvs[0][1][2] = new THREE.Vector2(20, 1);
	mesh = new THREE.Mesh(geometry, wallMaterial);
	mesh.position.x = 0;
	mesh.position.y = 0.5;
	mesh.position.z = -10;
	mesh.rotation.y = Math.PI * 0.5;
	scene.add(mesh);
	
	geometry = new THREE.PlaneGeometry(1, 20);
	geometry.faceVertexUvs[0][0][0] = new THREE.Vector2(0, 20);
	geometry.faceVertexUvs[0][0][2] = new THREE.Vector2(1, 20);
	geometry.faceVertexUvs[0][1][2] = new THREE.Vector2(1, 20);
	mesh = new THREE.Mesh(geometry, floorMaterial);
	mesh.position.x = 0.5;
	mesh.position.y = 0;
	mesh.position.z = -10;
	mesh.rotation.x = Math.PI * 1.5;
	scene.add(mesh);
	
	geometry = new THREE.PlaneGeometry(1, 20);
	geometry.faceVertexUvs[0][0][0] = new THREE.Vector2(0, 20);
	geometry.faceVertexUvs[0][0][2] = new THREE.Vector2(1, 20);
	geometry.faceVertexUvs[0][1][2] = new THREE.Vector2(1, 20);
	mesh = new THREE.Mesh(geometry, floorMaterial);
	mesh.position.x = 0.5;
	mesh.position.y = 1;
	mesh.position.z = -10;
	mesh.rotation.x = Math.PI * 0.5;
	scene.add(mesh);
	
	walkingArea = [];
	
	walkingArea.push(new THREE.Box2(new THREE.Vector2(0.1, -19.9), new THREE.Vector2(0.9, -0.1)));
	
	winningArea = new THREE.Box2(new THREE.Vector2(0, -20), new THREE.Vector2(1, -19));
	
	won = false;
	
	addEventListener("keydown", onKeyDown);
	addEventListener("keyup", onKeyUp);
	addEventListener("mousemove", onMouseMove);
	
	clock = new THREE.Clock(true);
	keysDown = {};
	mouseDeltaX = 0;
	mouseDeltaY = 0;
	
	resetGame();
	displayTime();
	
	timeout = setTimeout(update, 5);
	animationFrame = requestAnimationFrame(render);
}

function update()
{
	timeout = setTimeout(update, 5);
	var delta = clock.getDelta();
	var movement = new THREE.Vector2(0, 0);
	if (keysDown["87"]) // W
	{
		movement.add(polarToVector2(1, camera.rotation.y + Math.PI));
	}
	if (keysDown["83"]) // S
	{
		movement.add(polarToVector2(1, camera.rotation.y));
	}
	if (keysDown["65"]) // A
	{
		movement.add(polarToVector2(1, camera.rotation.y + Math.PI * 1.5));
	}
	if (keysDown["68"]) // D
	{
		movement.add(polarToVector2(1, camera.rotation.y + Math.PI * 0.5));
	}
	if (movement.length() > 0)
	{
		movement.setLength(delta * 1.8);
		moveCamera(movement);
		if (!won)
		{
			clockRunning = true;
		}
	}
	camera.rotation.x -= mouseDeltaY * 0.002;
	camera.rotation.y -= mouseDeltaX * 0.002;
	camera.rotation.x = THREE.Math.clamp(camera.rotation.x, Math.PI * -0.5, Math.PI * 0.5);
	
	if (camera.rotation.x === Math.PI * 0.5)
	{
		winningArea = new THREE.Box2(new THREE.Vector2(0, -20), new THREE.Vector2(1, -18));
		finishMesh.position.z = -18;
	}
	
	mouseDeltaX = 0;
	mouseDeltaY = 0;
	
	if (clockRunning)
	{
		timeLeft -= delta;
		if (timeLeft < 0)
		{
			resetGame();
		}
		displayTime();
		if (won)
		{
			clockRunning = false;
		}
	}
}

function render()
{
	animationFrame = requestAnimationFrame(render);
	renderer.render(scene, camera);
	renderer.autoClearColor = false;
	renderer.render(hudScene, hudCamera);
	renderer.autoClearColor = true;
}

function cleanup()
{
	clearTimeout(timeout);
	cancelAnimationFrame(animationFrame);
	
	removeEventListener("keydown", onKeyDown);
	removeEventListener("keyup", onKeyUp);
	removeEventListener("mousemove", onMouseMove);
	
	gameContainer.removeChild(renderer.domElement);
}

function resetGame()
{
	timeLeft = 10;
	camera.position.x = 0.5;
	camera.position.y = 0.5;
	camera.position.z = -0.5;
	camera.rotation.set(0, 0, 0);
	clockRunning = false;
	for (var key in keysDown)
	{
		keysDown[key] = false;
	}
}

function displayTime()
{
	hudScene.remove(textMesh);
	var timeDisplay = timeLeft.toFixed(2);
	while (timeDisplay.length < 5)
	{
		timeDisplay = "0" + timeDisplay;
	}
	var geometry = new THREE.TextGeometry(timeDisplay, { font: "scoreboard", size: 0.1, height: 0.01 });
	var material = won ? textWonMaterial : textMaterial;
	textMesh = new THREE.Mesh(geometry, material);
	geometry.computeBoundingBox();
	textMesh.position.x = geometry.boundingBox.max.x * -0.5;
	textMesh.position.y = 0.3;
	hudScene.add(textMesh);
}

function moveCamera(amount)
{
	var position = amount.clone();
	position.x += camera.position.x;
	position.y += camera.position.z;
	
	var closestDistance = Infinity;
	var closestBox;
	for (var i = 0; i < walkingArea.length && closestDistance > 0; i++)
	{
		var box = walkingArea[i];
		var distance = box.distanceToPoint(position);
		if (distance < closestDistance)
		{
			closestDistance = distance;
			closestBox = box;
		}
	}
	if (closestDistance > 0)
	{
		closestBox.clampPoint(position, position);
	}
	
	if (winningArea.containsPoint(position))
	{
		won = true;
	}
	
	camera.position.x = position.x;
	camera.position.z = position.y;
}

function polarToVector2(r, phi)
{
	var x = r * Math.sin(phi);
	var y = r * Math.cos(phi);
	return new THREE.Vector2(x, y);
}

function onKeyDown(event)
{
	if (!(event.keyCode in keysDown))
	{
		keysDown[event.keyCode] = true;
	}
}

function onKeyUp(event)
{
	delete keysDown[event.keyCode];
}

function onMouseMove(event)
{
	var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || event.msMovementX || 0;
	var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || event.msMovementY || 0;
	mouseDeltaX += movementX;
	mouseDeltaY += movementY;
}