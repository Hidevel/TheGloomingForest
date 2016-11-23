'use strict';

Physijs.scripts.worker = 'scripts/physijs_worker.js';

//VARIABLES
	//functions
	var initScene, render, createObjects, addObjects, 
	restart, showCanvas,
	treeCoordGenerator, mushroomPlacer,
	keysInterpreter, applyMovement;
	
	//event handler functions
	var keyUp,keyDown,handleCollision;	
	
	//scene basics variables
	var scene, renderer, render_stats, physics_stats, textureLoader, 
		ambientLight,
		hemiSphereLight,
		pointlightSpirit,
		pointLightSpiritBack,
		pointLightSpiritUp,
		camera,
		cameraDistanceToPlayer3rdPerson,
		cameraLookAt3rdPerson,
		cameraDistanceFromPlayerYCoord,
		cameraLookAt1stPerson,
		isScenePaused,
		surroundColor,
		groundColor;
	
		//size variables
		var mapSize;//size of the map
	
		var numTrees,numMushrooms; //how many trees/mushrooms will be there together
		
		//procedural generation  variables
		var randomTreeCoordinates, 
			treeTrunkBottom, 
			mushroomTreeDistance,
			randomGeneratorStatic,
			randomGeneratorDynamic,
			treesArray, 
			mushroomsArray,
			zeroVector;
		
		//gometry, material and mesh variables
		var skyDome,skyDomeGeometry,skyDomeMaterial,//sky
			ground, groundGeometry, groundMaterial, //ground
			gameOver,gameOverGeometry, gameOverMaterial,
			tree, trunkGeometry, trunkMaterial, //tree
			branches, branchGeometry, branchMaterial, //tree
			mushroom, mushroomTrunkGeometry, mushroomTrunkMaterial,//mushroom
			mushroomCap, mushroomCapGeometry, mushroomcapMaterial, //mushroomCap
			spirit, spiritGeometry, spiritMaterial, //spirit/player
			canvas1, canvas2, ctx2, firstTime; //start new game, game over

	//player related variables
	zeroVector= new THREE.Vector3(0,0,0);
	
	var keyboard = {};
	
	var transparency;
	
	var cam3; //camera is set in third person view or first person view

	/*holds details about height, 
	movement speed, current speed, 
	rotation speed and current rotation 
	of the player respectively*/
	var player;


/***
Nice, long descriptions can be written this way
***/
initScene=function() {
	
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth-10, window.innerHeight-10);
	
	//enable shadows
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.shadowMapSoft = true;
	
	document.getElementById( 'viewport' ).appendChild(renderer.domElement);
	
	render_stats = new Stats();
		render_stats.domElement.style.position = 'absolute';
		render_stats.domElement.style.top = '0px';
		render_stats.domElement.style.zIndex = 100;
	document.getElementById( 'viewport' ).appendChild( render_stats.domElement );
	
	physics_stats = new Stats();
		physics_stats.domElement.style.position = 'absolute';
		physics_stats.domElement.style.top = '50px';
		physics_stats.domElement.style.zIndex = 100;
	document.getElementById( 'viewport' ).appendChild( physics_stats.domElement );

	scene = new Physijs.Scene({fixedTimeStep:1/60});
	scene.setGravity(new THREE.Vector3( 0, -100, 0 ));
	scene.addEventListener(
		'update',
		function() {
		scene.simulate( undefined,2 );
		physics_stats.update();
		}
	);
	
		canvas1 = renderer.domElement;
		canvas2 = document.getElementById("canvas");
		canvas2.width = window.innerWidth - 10;
		canvas2.height = window.innerHeight-10;
		ctx2 = canvas2.getContext("2d");
		firstTime = 1;
		
		//used global variables defined
		
		mapSize = 100;//size of the map
		
		numTrees = 100; //number of trees on the map
		numMushrooms = 10; //number of mushrooms on the map
		treesArray=new Array(numTrees);
		mushroomsArray=new Array(numMushrooms);
		//player related variables
		
		cam3 = true; //camera is set in third person view
		transparency=1;
		player = {height: 2.0, 
				movementSpeed: 10.0, movement:0.0, 
				rotationSpeed: Math.PI*0.008, rotation:0.0,
				sight:20
		};		
		
		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1200);
		cameraDistanceToPlayer3rdPerson=8;
		cameraLookAt3rdPerson=4;
		cameraDistanceFromPlayerYCoord=3;
		cameraLookAt1stPerson=8;
		
		scene.add(camera);
		
		//colours
		groundColor=0x30113a; //colour of groundMaterial and hemiSphereLight's ground property
		surroundColor=0x3a1b2c;
		
		//scene lights
		hemiSphereLight= new THREE.HemisphereLight(0x000000,groundColor, 0.08);
		scene.add(hemiSphereLight);
		
		ambientLight = new THREE.AmbientLight(0xfffbea, 0.4);//4d004d
		scene.add(ambientLight);
		
		scene.fog=new THREE.FogExp2(surroundColor,0.06);

		//mushroomPlacer support variables
		treeTrunkBottom=1;
		mushroomTreeDistance=1;
		
		//treeCoordGenerator support variables
		randomGeneratorStatic=(mapSize/2)-treeTrunkBottom-mushroomTreeDistance;
		randomGeneratorDynamic=randomGeneratorStatic*2;
	
	textureLoader = new THREE.TextureLoader();
			//geometry and material definitions
				//sky
				skyDomeGeometry = new THREE.SphereGeometry(512, 16, 16, 0, Math.PI*2, 0, Math.PI*0.5),
				
				skyDomeMaterial= Physijs.createMaterial(
					new THREE.MeshLambertMaterial({ color:surroundColor,side: THREE.BackSide, fog: true}),
					1.0, // high friction
					0.0 // low restitution
				);
				
				//ground
			groundGeometry = new THREE.BoxGeometry(mapSize, 0, mapSize);
			
			groundMaterial = Physijs.createMaterial(
				new THREE.MeshLambertMaterial({ color:groundColor}),
				0.8, // high friction
				0.3 // low restitution
			);
			
				//gameOver
			gameOverGeometry= new THREE.BoxGeometry(512, 0, 512);
			
			gameOverMaterial= Physijs.createMaterial(
				new THREE.MeshLambertMaterial({ color:surroundColor }),
				1.0, // high friction
				0.0 // low restitution
			);
				//tree
			trunkGeometry=new THREE.CylinderGeometry(0.75, treeTrunkBottom, 6,10,10);
			
			trunkMaterial = Physijs.createMaterial(
					new THREE.MeshLambertMaterial(
					{color:0x2e213f}),
					1.0, //friction
					0.3 //restitution
			);
			
			branchGeometry=new THREE.SphereGeometry(4,16,16);
			
			branchMaterial = Physijs.createMaterial(
						new THREE.MeshPhongMaterial(
						{color:0xf4edff,
						shininess:100}),
						1.0, //friction
						0.3 //restitution
			);
			
				//mushroom
			mushroomTrunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5);
			
			mushroomTrunkMaterial = Physijs.createMaterial(
						new THREE.MeshPhongMaterial(
						{color:0xffd6fa}),
						0.1, //friction
						0.8 //restitution
			); 
			
			mushroomCapGeometry= new THREE.SphereGeometry(0.5,10,10,0,Math.PI*2,0,Math.PI/2);
			
			mushroomcapMaterial = Physijs.createMaterial(
						new THREE.MeshPhongMaterial(
						{color:0x5e0404,
						shininess:10}),
						0.1, //friction
						0.8 //restitution
			);
			
			spiritGeometry = new THREE.CylinderGeometry(0.5, 0.5, player.height,32,32);
			
			spiritMaterial = Physijs.createMaterial(
					new THREE.MeshPhongMaterial(
					{color:0xfeffe0,
					transparent:true,
					opacity:1.0,
					shininess:100
					}),
					0.5, //friction
					0.0 //restitution
			);
	//skyDome - represents the sky
	skyDome = new THREE.Mesh(
		skyDomeGeometry,
		skyDomeMaterial,
		0
    );
    skyDome.position.y = -256;
    scene.add(skyDome);
			
	
	// Ground
		ground = new Physijs.BoxMesh(
			groundGeometry,
			groundMaterial,
			0 // mass
		);
		ground.receiveShadow = true;
		ground.name='ground';
		scene.add( ground );
	
	//the game over platform (if the player collides with this the game ends)
	gameOver = new Physijs.BoxMesh(
			gameOverGeometry,
			gameOverMaterial,
			0 // mass
		);
		gameOver.position.set(0,-4,0);
		gameOver.name='gameOver';
		scene.add( gameOver );
	
	//create the objects (trees,mushrooms,player character)
	createObjects();
	
	//add the objects to the scene
	isScenePaused = false;
	addObjects();	
	scene.simulate();
	requestAnimationFrame(render);
	
}
	
	//definition: addObject
	createObjects=function(){
		
		//create the player, the spirit
		spirit = new Physijs.CylinderMesh(
			spiritGeometry,
			spiritMaterial,
			1
		);		
		
		spirit.receiveShadow = true; //meshes - object both receive
		spirit.castShadow = false; // and cast shadows
		spirit.setCcdMotionThreshold(1);
		spirit.setCcdSweptSphereRadius(1);
		spirit.addEventListener('ready',function(){
			spirit.addEventListener('collision',handleCollision);
		});	
		spirit.name='spirit';
		
		//adds lighting to the spirit
		/*
		intensity && distance <- at brightness
		0.2 && 5 <- at min brightness
		0.4 && 25 <- at max brightness
		scales:
			- intensity: 0.2 0.25 0.3 0.35 0.4
			- distance: 5 10 15 20 25
		*/
		pointlightSpirit=new THREE.PointLight(0xffcccc, 1, player.sight,2);
		
		pointlightSpirit.position.set(0, player.height/2, 0);
		
		pointlightSpirit.castShadow=true;
		pointlightSpirit.shadow.camera.near = 1;
		pointlightSpirit.shadow.camera.far = player.sight;
		pointlightSpirit.shadow.bias = 0.01;
		
		spirit.add(pointlightSpirit);
			
			//lit's the spirits from above
			pointLightSpiritUp=new THREE.PointLight(0xffdddd, 1,2,1);
			
			pointLightSpiritUp.position.set(0,player.height+0.5,0);
			
			pointLightSpiritUp.shadow.camera.near = 1;
			pointLightSpiritUp.shadow.camera.far = player.sight;
			pointLightSpiritUp.shadow.bias = 0.01;		
			
			spirit.add(pointLightSpiritUp);
			
			
			//lit's the spirits back
			pointLightSpiritBack=new THREE.PointLight(0xffdddd, 1,5,2);
			
			pointLightSpiritBack.shadow.camera.near = 1;
			pointLightSpiritBack.shadow.camera.far = player.sight;
			pointLightSpiritBack.shadow.bias = 0.01;		
			
			spirit.add(pointLightSpiritBack);
		
		
		//place trees and mushrooms on the map
		for (var i = 0; i < numTrees; i++) {
			
			tree = new Physijs.CylinderMesh(
				trunkGeometry,
				trunkMaterial,
				0
			);
				
			branches = new Physijs.SphereMesh(
				branchGeometry, 
				branchMaterial,
				0
			);
				
			branches.position.set (0,6,0);
				
			tree.add(branches);
				
			tree.receiveShadow = true;
			tree.castShadow = true;
				
			tree.name='tree'+i;
			treesArray[i]=tree;
		}

		
		for(var i=0;i<numMushrooms;i++){				
					//create mushroom trunk
				mushroom = new Physijs.CylinderMesh(
					mushroomTrunkGeometry,
					mushroomTrunkMaterial,
					0
				);
					
					//create mushroom cap
				mushroomCap = new Physijs.ConeMesh(
					mushroomCapGeometry, 
					mushroomcapMaterial,
					1
				);
					//cap above trunk
				mushroomCap.position.set (0,0.25,0);
					
					//combine cap, with trunk
				mushroom.add(mushroomCap);
					
				mushroom.receiveShadow = true;
				mushroom.castShadow = true;
					
				mushroom.name='mushroom'+i;
				mushroom.touchEffect=""; //what happens when the player touches the mushroom
				
				mushroomsArray[i]=mushroom;//store the mushrooms in the mushroom array
		}					
	}
	
		//definition: addObjects
	addObjects=function(){
		isScenePaused = true;
		spirit.position.set(0,2,0);
		scene.add(spirit);
		
		
		//array of used coordinates
		var randomTreeCoordinates = new Array(2);//we will store x and y coordiantes
			for(var i = 0; i < 2; i++){
				randomTreeCoordinates[i] = new Array(numTrees); //coordinates for every object
		}
		//add trees to the scene
		for (var i = 0; i < numTrees; i++) {
		
			tree=treesArray[i];
			
			randomTreeCoordinates[0][i]=treeCoordGenerator(randomTreeCoordinates[0]);		
			randomTreeCoordinates[1][i]=treeCoordGenerator(randomTreeCoordinates[1]);
			
			//NO TREE APPEARING ON 0, 0, 0 where the spirit is
			if (Math.abs(randomTreeCoordinates[0][i]) < 2.0) randomTreeCoordinates[0][i] += 4.0;
			if (Math.abs(randomTreeCoordinates[1][i]) < 2.0) randomTreeCoordinates[1][i] += 4.0;
			
			tree.position.set (randomTreeCoordinates[0][i],
						3,
						randomTreeCoordinates[1][i]
			);
			
			scene.add(tree);
		}
		
		
		//place mushrooms near trees
		mushroomPlacer(treesArray,numTrees,numMushrooms);
		
		isScenePaused = true;
		if (firstTime == 1) {
			showCanvas('start');
			firstTime = 0;
		} else {
			showCanvas('startOver');
		}
	}
		
		//generataes a random coordinate
		treeCoordGenerator = function (storedCoordiantes){
			
			var newCoordinate = Math.floor(
			randomGeneratorStatic - randomGeneratorDynamic * Math.random()
			);
			
			var alreadyExists=false;
			for(var i=0;i<numTrees;i++){
				if(storedCoordiantes[i] === newCoordinate){
					alreadyExists=true;
					break;
				}
			}
			
			if(alreadyExists){
				if(Math.floor(Math.random())){
					newCoordinate+=Math.floor(Math.random()+1);
				}else{
					newCoordinate-=Math.floor(Math.random()+1);
				}
			}	
			
			return newCoordinate;
		};
		
		//places numOfMushrooms mushrooms near randomly chosen trees and add mushrooms to the scene
		mushroomPlacer=function (treeArray,treeArrayLength,numOfMushrooms){
			
			var chosenTree,alreadyUsedTrees=new Array(numMushrooms);
		
			for(var i=0;i<numMushrooms;i++){
			
				//select a tree from the treeArray
				do{
					chosenTree=treesArray[Math.floor(Math.random() * numTrees)];
					
				}while(alreadyUsedTrees.includes(chosenTree));
				
				alreadyUsedTrees[i]=chosenTree; //add the chosen tree to the used ones
			
			
				mushroom=mushroomsArray[i];
			
				//variety of mushrooms placements through the number of the current mushroom
					//place the mushrooms near the trees
				var mushroomDirection=i % 4;
				if(mushroomDirection === 0){//place the mushroom north-east from tree
					mushroom.position.set (
						chosenTree.position.x+treeTrunkBottom+mushroomTreeDistance,
						0.25,
						chosenTree.position.z+treeTrunkBottom+mushroomTreeDistance
					);
				}else if(mushroomDirection === 1){//place the mushroom north-west from tree
					mushroom.position.set (
						chosenTree.position.x-treeTrunkBottom-mushroomTreeDistance,
						0.25,
						chosenTree.position.z+treeTrunkBottom+mushroomTreeDistance
					);
				}else if(mushroomDirection === 2){//place the mushroom south-east from tree
					mushroom.position.set (
						chosenTree.position.x+treeTrunkBottom+mushroomTreeDistance,
						0.25,
						chosenTree.position.z-treeTrunkBottom-mushroomTreeDistance
					);
				}else if(mushroomDirection === 3){//place the mushroom south-west from tree
					mushroom.position.set (
						chosenTree.position.x-treeTrunkBottom-mushroomTreeDistance,
						0.25,
						chosenTree.position.z-treeTrunkBottom-mushroomTreeDistance
					);
				}
				
				scene.add(mushroom);
			}
		};
	
	
//RENDERER

render = function() {
		requestAnimationFrame( render );
				
		keysInterpreter();//interprets user input
		applyMovement();
			
		spirit.material.opacity = transparency;			
		renderer.render( scene, camera );
		render_stats.update();
};
		

	keysInterpreter =function() {
		
			//modify the players rotation
		if (keyboard[37]) { //left arrow key 
			player.rotation+=player.rotationSpeed;
		}
		if (keyboard[39]) { //right arrow key			
			player.rotation-=player.rotationSpeed;
		}		
			
			//movement
		if (keyboard[38]){ // up arrow key	
			player.movement=player.movementSpeed;
		}
		if (keyboard[40]){ // down arrow key
			player.movement=-player.movementSpeed;
		}
			//no movementKey pressed
		if(!keyboard[38] && !keyboard[40]){
			player.movement=0.0;
		}
		transparency -= 0.001;
		if (transparency <= 0.0) {
			restart();
		}
	}
	
	applyMovement=function(){
			
			//move the player character
		spirit.setLinearVelocity(
			new THREE.Vector3(
				Math.sin(player.rotation)* player.movement,
				0,
				Math.cos(player.rotation)* player.movement
				)
			);
		
		spirit.setAngularFactor(zeroVector); //prevent the player character from spinning
		
		//back light of the spirit
			pointLightSpiritBack.position.set( - (Math.sin(player.rotation)*3),
				player.height/2,
				 - (Math.cos(player.rotation)*3)
			);
		
		
			//follow the players movement form 3rd or first person
		if(cam3){
			camera.position.set(
				spirit.position.x - (Math.sin(player.rotation)*cameraDistanceToPlayer3rdPerson),
				player.height + cameraDistanceFromPlayerYCoord,
				spirit.position.z - (Math.cos(player.rotation)*cameraDistanceToPlayer3rdPerson)
			);
			
			//look where the player looks in 3rd person
			camera.lookAt(
			new THREE.Vector3(
				spirit.position.x + Math.sin(player.rotation)*cameraLookAt3rdPerson,
				player.height,
				spirit.position.z + Math.cos(player.rotation)*cameraLookAt3rdPerson
				)
			);
			
		}
		else{
			camera.position.set(spirit.position.x,
								player.height-(player.height/20),
								spirit.position.z);
			//look where the player looks
			camera.lookAt(
			new THREE.Vector3(
				spirit.position.x + Math.sin(player.rotation)*cameraLookAt1stPerson,
				0,
				spirit.position.z + Math.cos(player.rotation)*cameraLookAt1stPerson
				)
			);
		}
			
			
	}
		
//EVENT HANDLER FUNCTIONS

keyDown=function(event){
	
	if(!isScenePaused){
		keyboard[event.keyCode] = true;
	} 
	else if (isScenePaused) {
		if (canvas2.style.visibility == 'visible') {
		canvas2.style.visibility='hidden';
		isScenePaused=false; 
		}
	}
}
keyUp=function(event){
	if(!isScenePaused){
		keyboard[event.keyCode] = false;
		
		// C key
		if (event.keyCode === 67) {
			if (cam3) {
				cam3 = false;
			}
			else{
				cam3 = true;
			}
		}
	}
}

restart = function(){
	isScenePaused = true;
	scene.remove(spirit);
	transparency = 1;
	keyboard={}
	for(var i=0;i<numMushrooms;i++){
		scene.remove(mushroomsArray[i]);
	}
	for(var i=0;i<numTrees;i++){
		scene.remove(treesArray[i]);
	}
	addObjects();
};

handleCollision=function(collided_with){
	
	if(collided_with.name.includes("gameOver")){
		restart();
	}
	
	if(collided_with.name.includes("mushroom")){
		for(var i=0;i<numMushrooms;i++){
			scene.remove(mushroomsArray[i]);
		}
		mushroomPlacer(treesArray,numTrees,numMushrooms);
		
		transparency += 0.1;
		if (transparency > 1.0) transparency = 1.0;
	}
};

showCanvas = function(action) { 
	isScenePaused = true;
	ctx2.clearRect(0, 0, canvas.width, canvas.height);
	ctx2.fillStyle = "rgba(0, 0, 0, 0.5)";
	ctx2.fillRect(0,0,canvas2.width,canvas2.height);
	ctx2.fillStyle = "#FFFFFF";
	ctx2.font = "30px Georgia";
	if (action == 'start') {
		ctx2.fillText("Press any key to start the game", canvas2.width/2 - 200, canvas2.height/2);
	} else if (action == 'startOver') {
		ctx2.fillText("GAME OVER", canvas2.width/2 - 100, canvas2.height/2 - 40);
		ctx2.fillText("Press any key to restart", canvas2.width/2 - 150, canvas2.height/2 + 30);
	}
	canvas2.style.visibility='visible';
};

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

	//stop character moving if the user leaves the browser tab
window.addEventListener('blur',function(){
		//stop rotation
		keyboard[37]=false;
		keyboard[39]=false;
		
		//stop movement
		keyboard[38]=false;
		keyboard[40]=false;
})

	//initializes the whole scene
window.onload = initScene;
