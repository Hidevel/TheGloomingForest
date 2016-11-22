'use strict';

Physijs.scripts.worker = 'scripts/physijs_worker.js';

//VARIABLES
	//functions
	var initScene, render, addObjects, 
	treeCoordGenerator, mushroomPlacer,
	keysInterpreter, applyMovement, 
	startNewGame, restart, rearrangeObjects;
	
	//event handler functions
	var keyUp,keyDown,handleCollision;	
	
	//scene basics variables
	var scene, renderer, render_stats, physics_stats, textureLoader, 
		ambientLight, 
		pointlightSpiritUp, 
		pointlightSpiritDown,
		pointlightSpiritFront,
		pointlightSpiritBack,
		pointlightSpiritLeft,
		pointlightSpiritRight,
		camera, 
		cameraDistanceToPlayer3rdPerson,
		cameraLookAt3rdPerson,
		cameraDistanceFromPlayerYCoord,
		cameraLookAt1stPerson;
	
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
			chosenTree,
			alreadyUsedTrees;
		
		//geometry, material and mesh variables
		var ground, groundGeometry, groundMaterial, //ground
			tree, trunkGeometry, trunkMaterial, //tree
			branches, branchGeometry, branchMaterial, //tree
			mushroom, mushroomTrunkGeometry, mushroomTrunkMaterial,//mushroom
			mushroomCap, mushroomCapGeometry, mushroomcapMaterial, //mushroomCap
			spirit, spiritGeometry, spiritMaterial; //spirit/player
		
	//player related variables
	var keyboard = {};
	
	var brightness, lightIntensity, lightDistance;
	
	var cam3; //camera is set in third person view or first person view

	var transparency;
	
	/*holds details about height, 
	movement speed, current speed, 
	rotation speed and current rotation 
	of the player respectively*/
	var player;
	var noSpinning;


/***
Nice, long descriptions can be written this way
***/
initScene=function() {
	
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	
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
		scene.simulate( undefined, 2 );
		physics_stats.update();
		}
	);	
	
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
	cameraDistanceToPlayer3rdPerson=10;
	cameraLookAt3rdPerson=4;
	cameraDistanceFromPlayerYCoord=4;
	cameraLookAt1stPerson=5;
	scene.add(camera);
	
	
		//used global variables defined
		
		mapSize = 100;//size of the map
		
		numTrees = 200; //number of trees on the map
		numMushrooms = 10; //number of mushrooms on the map
		treesArray=new Array(numTrees);
		mushroomsArray=new Array(numMushrooms);
		//player related variables
		noSpinning = new THREE.Vector3(0,0,0)
		chosenTree,alreadyUsedTrees=new Array(numMushrooms);
		
		cam3 = true; //camera is set in third person view
		
		transparency = 1;
		
		player = {height: 2.0, 
				movementSpeed: 10.0, movement:0.0, 
				rotationSpeed: Math.PI*0.008, rotation:0.0
		};
		
		//array of used coordinates
		randomTreeCoordinates = new Array(2);//we will store x and y coordiantes
			for(var i = 0; i < 2; i++){
				randomTreeCoordinates[i] = new Array(numTrees); //coordinates for every object
		}
				
		//mushroomPlacer support variables
		treeTrunkBottom=1;
		mushroomTreeDistance=1;
	
		//treeCoordGenerator support variables
		randomGeneratorStatic=(mapSize/2)-treeTrunkBottom-mushroomTreeDistance;
		randomGeneratorDynamic=randomGeneratorStatic*2;
	
	textureLoader = new THREE.TextureLoader();
			//geometry and material definitions
				//ground
			groundGeometry = new THREE.BoxGeometry(mapSize, 0, mapSize);
			
			groundMaterial = Physijs.createMaterial(
				new THREE.MeshLambertMaterial({ color:0xffffff }),
				0.8, // high friction
				0.3 // low restitution
			);
				
				//tree
			trunkGeometry=new THREE.CylinderGeometry(treeTrunkBottom - treeTrunkBottom/4, treeTrunkBottom, 6);
			
			trunkMaterial = Physijs.createMaterial(
					new THREE.MeshLambertMaterial(
					{color:0x60351c}),
					1.0, //friction
					0.3 //restitution
			);
			
			branchGeometry=new THREE.SphereGeometry(4);
			
			branchMaterial = Physijs.createMaterial(
						new THREE.MeshLambertMaterial(
						{color:0x1c601e}),
						1.0, //friction
						0.3 //restitution
			);
			
				//mushroom
			mushroomTrunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5);
			
			mushroomTrunkMaterial = Physijs.createMaterial(
						new THREE.MeshPhongMaterial(
						{color:0xfff6e2}),
						0.1, //friction
						0.8 //restitution
			); 
			
			mushroomCapGeometry= new THREE.SphereGeometry(0.5,10,10,0,Math.PI*2,0,Math.PI/2);
			
			mushroomcapMaterial = Physijs.createMaterial(
						new THREE.MeshPhongMaterial(
						{color:0xf9e2ff}),
						0.1, //friction
						0.8 //restitution
			);
			
			spiritGeometry = new THREE.CylinderGeometry(0.5, 0.5, player.height,32,32);
			
			spiritMaterial = Physijs.createMaterial(
					new THREE.MeshPhongMaterial(
					{ color:0x33ff66,
					specular:0xf4b642,
					transparent: true,
					opacity:1,
					shininess:100					
					}),
					0.5, //friction
					0.0 //restitution
			);
	
	// Ground
		ground = new Physijs.BoxMesh(
			groundGeometry,
			groundMaterial,
			0 // mass
		);
		ground.receiveShadow = true;
		ground.name='ground';
		scene.add( ground );
	
	ambientLight = new THREE.HemisphereLight(0x053327, 0x287260,0.2);
	scene.add(ambientLight);
	addObjects();	
	startNewGame();
}

//definition: startNewGame
startNewGame = function(){
	rearrangeObjects();
	scene.simulate();
	requestAnimationFrame(render);
	
};
	
	//definition: addObjects
	addObjects=function(){
		
		//create the player, the spirit
		spirit = new Physijs.CylinderMesh(
			spiritGeometry,
			spiritMaterial,
			1
		);		
		
		spirit.receiveShadow = true; //meshes - object both receive
		spirit.castShadow = true; // and cast shadows
		spirit.setCcdMotionThreshold(1);
		spirit.setCcdSweptSphereRadius(1);
		spirit.addEventListener('ready',function(){
		spirit.addEventListener('collision',handleCollision);
		});	
		
		//don't delete/activate this thank you :)
		/*var constraint = new Physijs.PointConstraint(
			spirit, // First object to be constrained
			new THREE.Vector3( 0, 10, 0 ) // point in the scene to apply the constraint
		);
		scene.addConstraint( constraint );*/
		
		//adds lighting to the spirit
		/*
		intensity && distance <- at brightness
		0.2 && 5 <- at min brightness
		0.4 && 25 <- at max brightness
		scales:
			- intensity: 0.2 0.25 0.3 0.35 0.4
			- distance: 5 10 15 20 25
		*/
		pointlightSpiritUp		= 	new THREE.PointLight(0xeeeeff, 0.4, 22,1);
		pointlightSpiritDown	= 	new THREE.PointLight(0xeeeeff, 0.4, 28,1);
		pointlightSpiritFront	= 	new THREE.PointLight(0xeeeeff, 0.4, 25,1);
		pointlightSpiritBack	= 	new THREE.PointLight(0xeeeeff, 0.4, 25,1);
		pointlightSpiritLeft	= 	new THREE.PointLight(0xeeeeff, 0.4, 25,1);
		pointlightSpiritRight	= 	new THREE.PointLight(0xeeeeff, 0.4, 25,1); //PointLight( color, intensity, distance, decay )
		
		pointlightSpiritUp.position.set(0, player.height+2, 0);
		pointlightSpiritDown.position.set(0, player.height/20, 0);
		pointlightSpiritFront.position.set(0, player.height/2, 3);
		pointlightSpiritBack.position.set(0, player.height/2, -3);
		pointlightSpiritLeft.position.set(-3, player.height/2, 0);
		pointlightSpiritRight.position.set(3, player.height/2, 0);
	
		spirit.add(pointlightSpiritUp);
		spirit.add(pointlightSpiritDown);
		spirit.add(pointlightSpiritFront);
		spirit.add(pointlightSpiritBack);
		spirit.add(pointlightSpiritLeft);
		spirit.add(pointlightSpiritRight);
					
		
		//place trees and mushrooms on the map
		for (var i = 0; i < numTrees; i++) {
			
			tree = new Physijs.CylinderMesh(
				trunkGeometry,
				trunkMaterial,
				0
			);
			
			tree.position.set (i/10 - mapSize/2,
								3,
								i/10 - mapSize/2
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
		
		//create mushrooms
		for(var i=0;i<numMushrooms;i++){
			//create mushroom trunk
			mushroom = new Physijs.CylinderMesh(
				mushroomTrunkGeometry,
				mushroomTrunkMaterial,
				0
			);
			
			mushroom.position.set (i/6 - mapSize/2,
								0.125,
								i/6 - mapSize/2
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
	};
	
	//definition: rearrangeObjects
	rearrangeObjects = function() {
		spirit.setAngularFactor(noSpinning);
		spirit.position.set(0, player.height/2 + 0.1, 0);
		scene.add(spirit);
		
		//place trees and mushrooms on the map
		for (var i = 0; i < numTrees; i++) {
			
			randomTreeCoordinates[0][i]=treeCoordGenerator(randomTreeCoordinates[0]);		
			randomTreeCoordinates[1][i]=treeCoordGenerator(randomTreeCoordinates[1]);
			
			//NO TREE APPEARING ON 0, 0, 0 where the spirit is
			if (Math.abs(randomTreeCoordinates[0][i]) < 2.0) randomTreeCoordinates[0][i] += 4.0;
			if (Math.abs(randomTreeCoordinates[1][i]) < 2.0) randomTreeCoordinates[1][i] += 4.0;
			
			treesArray[i].position.set (randomTreeCoordinates[0][i],
								3,
								randomTreeCoordinates[1][i]
			);
			scene.add(treesArray[i]);
			
		}
		//place a mushroom near trees
		mushroomPlacer(treesArray,numTrees,numMushrooms);
	};
		
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
		
		//places numOfMushrooms mushrooms near randomly chosen trees
		mushroomPlacer=function (treeArray,treeArrayLength,numOfMushrooms){
			
			for(var i=0;i<numOfMushrooms;i++){
				scene.remove(mushroomsArray[i]);
				//select a tree from the treeArray
				do{
					chosenTree=treeArray[Math.floor(Math.random() * treeArrayLength)];
					
				}while(alreadyUsedTrees.includes(chosenTree));
				
				alreadyUsedTrees[i]=(chosenTree); //add the chosen tree to the used ones
					
					//variety of mushrooms placements through the number of the current mushroom
					//place the mushrooms near the trees
				var mushroomDirection=i % 4;
				if(mushroomDirection === 0){//place the mushroom north-east from tree
					mushroomsArray[i].position.set (
						chosenTree.position.x+treeTrunkBottom+mushroomTreeDistance,
						0.25,
						chosenTree.position.z+treeTrunkBottom+mushroomTreeDistance
					);
				}else if(mushroomDirection === 1){//place the mushroom north-west from tree
					mushroomsArray[i].position.set (
						chosenTree.position.x-treeTrunkBottom-mushroomTreeDistance,
						0.25,
						chosenTree.position.z+treeTrunkBottom+mushroomTreeDistance
					);
				}else if(mushroomDirection === 2){//place the mushroom south-east from tree
					mushroomsArray[i].position.set (
						chosenTree.position.x+treeTrunkBottom+mushroomTreeDistance,
						0.25,
						chosenTree.position.z-treeTrunkBottom-mushroomTreeDistance
					);
				}else if(mushroomDirection === 3){//place the mushroom south-west from tree
					mushroomsArray[i].position.set (
						chosenTree.position.x-treeTrunkBottom-mushroomTreeDistance,
						0.25,
						chosenTree.position.z-treeTrunkBottom-mushroomTreeDistance
					);
				}
				scene.add(mushroom);
				
			}
		}

//RENDERER

render = function() {
		requestAnimationFrame( render );
				
		keysInterpreter();//interprets user input
		applyMovement();
			
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
			if (Math.abs(spirit.position.x) >= Math.abs(mapSize/2 + 0.5) 
				|| Math.abs(spirit.position.z) >= Math.abs(mapSize/2 + 0.5) ){		
				restart();
			}
		}
		if (keyboard[40]){ // down arrow key
			player.movement=-player.movementSpeed;
			if (Math.abs(spirit.position.x) >= Math.abs(mapSize/2 + 0.5) 
				|| Math.abs(spirit.position.z) >= Math.abs(mapSize/2 + 0.5) ){
				restart();
			}
		}
			//no movementKey pressed
		if(!keyboard[38] && !keyboard[40]){
			player.movement=0.0;
		}
		transparency -= 0.001;
		if (transparency <= 0.0) restart();
		else spirit.material.opacity = transparency;
	}
	
	restart = function(){
		//fade out
		transparency = 1;
		spiritMaterial.opacity = transparency;
		for (var j = 0; j < numTrees; j++) {
			scene.remove(treesArray[j]);
		}
		scene.remove(spirit);
		startNewGame();
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
		
		spirit.setAngularFactor(noSpinning); //prevent the player character from spinning
		
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
				1,
				spirit.position.z + Math.cos(player.rotation)*cameraLookAt1stPerson
				)
			);
		}
	}
		
//EVENT HANDLER FUNCTIONS

keyDown=function(event){
	keyboard[event.keyCode] = true;
}
keyUp=function(event){
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

handleCollision=function(collided_with){
	console.log(collided_with.name);
	if(collided_with.name.includes("mushroom")){
		transparency += 0.02;
		if (transparency > 1.0) transparency = 1.0;
		spirit.material.opacity = transparency;
		mushroomPlacer(treesArray,numTrees,numMushrooms);
	}
};

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

window.onload = initScene;
