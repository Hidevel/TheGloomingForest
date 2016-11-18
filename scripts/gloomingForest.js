'use strict';

Physijs.scripts.worker = 'scripts/physijs_worker.js';

//VARIABLES
	//functions
	var initScene, render, addObjects, 
	treeCoordGenerator, mushroomPlacer,
	keysInterpreter, applyMovement;
	
	//event handler functions
	var keyUp,keyDown,handleCollision;	
	
	//scene basics variables
	var scene, renderer, render_stats, physics_stats, textureLoader, 
		ambientLight, pointlight, camera, cameraDistanceToPlayer;
	
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
			mushroomsArray;
		
		//gometry, material and mesh variables
		var ground, groundGeometry, groundMaterial, //ground
			tree, trunkGeometry, trunkMaterial, //tree
			branches, branchGeometry, branchMaterial, //tree
			mushroom, mushroomTrunkGeometry, mushroomTrunkMaterial,//mushroom
			mushroomCap, mushroomCapGeometry, mushroomcapMaterial, //mushroomCap
			spirit, spiritGeometry, spiritMaterial; //spirit/player


	//player related variables
	var keyboard = {};

	var cam3; //camera is set in third person view or first person view

	/*holds details about height, 
	movement speed, current speed, 
	rotation speed and current rotation 
	of the player respectively*/
	var player = {height: 2.0, 
					movementSpeed: 30.0, movement:0.0, 
					rotationSpeed: Math.PI*0.005, rotation:0.0
	};


/***
Nice, long descriptions can be written this way
***/
initScene=function() {
	
	renderer = new THREE.WebGLRenderer({ antialias: false });
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

	scene = new Physijs.Scene;
	scene.setGravity(new THREE.Vector3( 0, -100, 0 ));
	scene.addEventListener(
		'update',
		function() {
		scene.simulate( undefined, 1 );
		physics_stats.update();
		}
	);	
	
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
	cameraDistanceToPlayer=5;
	scene.add(camera);
	
	
		//used global variables defined
		
		mapSize = 100;//size of the map
		
		numTrees = 100; //number of trees on the map
		numMushrooms = 10; //number of mushrooms on the map
		treesArray=new Array(numTrees);
		mushroomsArray=new Array(numMushrooms);
		//player related variables
		
		cam3 = true; //camera is set in third person view
		
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
			trunkGeometry=new THREE.CylinderGeometry(0.75, treeTrunkBottom, 6);
			
			trunkMaterial = Physijs.createMaterial(
					new THREE.MeshPhongMaterial(
					{color:0x60351c}),
					1.0, //friction
					0.3 //restitution
			);
			
			branchGeometry=new THREE.SphereGeometry(4);
			
			branchMaterial = Physijs.createMaterial(
						new THREE.MeshPhongMaterial(
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
			
			spiritGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2);
			
			spiritMaterial = Physijs.createMaterial(
					new THREE.MeshPhongMaterial(
					{ color:0x33ff66}),
					0.3, //friction
					1.0 //restitution
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
	
	
	
	ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
	scene.add(ambientLight);
	
	pointlight = new THREE.PointLight(0xffffff, 1.0);
	//PointLight( color, intensity, distance, decay )
	pointlight.position.set(0, 20, 0);
	pointlight.castShadow = true;
	//maximum draw distance for the shadows to something reasonable
	pointlight.shadow.camera.near = 0.1;
	pointlight.shadow.camera.far = 50;
	scene.add(pointlight);
	
	addObjects();	
	
	scene.simulate();
	requestAnimationFrame(render);
	
}
	
	//definition: addObject
	addObjects=function(){
		
		//create the player, the spirit
		spirit = new Physijs.CylinderMesh(
			spiritGeometry,
			spiritMaterial,
			1
		);		
		
		spirit.setAngularFactor(new THREE.Vector3(0, 0, 0));
		spirit.position.y += 2.0;
		spirit.receiveShadow = true; //meshes - object both receive
		spirit.castShadow = true; // and cast shadows
		//spirit.setCcdMotionThreshold(1);
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
		
		
		scene.add(spirit);			
		
		//place trees and mushrooms on the map
		for (var i = 0; i < numTrees; i++) {
			
			randomTreeCoordinates[0][i]=treeCoordGenerator(randomTreeCoordinates[0]);		
			randomTreeCoordinates[1][i]=treeCoordGenerator(randomTreeCoordinates[1]);
			
			//NO TREE APPEARING ON 0, 0, 0 where the spirit is
			if (Math.abs(randomTreeCoordinates[0][i]) < 2.0) randomTreeCoordinates[0][i] += 4.0;
			if (Math.abs(randomTreeCoordinates[1][i]) < 2.0) randomTreeCoordinates[1][i] += 4.0;
			
			tree = new Physijs.CylinderMesh(
				trunkGeometry,
				trunkMaterial,
				0
			);
			
			tree.position.set (randomTreeCoordinates[0][i],
								3,
								randomTreeCoordinates[1][i]
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
			scene.add(tree);
		}

		//place a mushroom near trees
		mushroomPlacer(treesArray,numTrees,numMushrooms);
			
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
		
		//places numOfMushrooms mushrooms near randomly chosen trees
		mushroomPlacer=function (treeArray,treeArrayLength,numOfMushrooms){
			
			var chosenTree,alreadyUsedTrees=new Array(numOfMushrooms);
			
			for(var i=0;i<numOfMushrooms;i++){
				
				//select a tree from the treeArray
				do{
					chosenTree=treeArray[Math.floor(Math.random() * treeArrayLength)];
					
				}while(alreadyUsedTrees.includes(chosenTree));
				
				alreadyUsedTrees[i]=(chosenTree); //add the chosen tree to the used ones
				
				
					//create mushroom trunk
				mushroom = new Physijs.CylinderMesh(
					mushroomTrunkGeometry,
					mushroomTrunkMaterial,
					0
				);
					
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
		}
		if (keyboard[40]){ // down arrow key
			player.movement=-player.movementSpeed;
		}
			//no movementKey pressed
		if(!keyboard[38] && !keyboard[40]){
			player.movement=0.0;
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
		
		spirit.setAngularFactor(new THREE.Vector3(0,0,0)); //prevent the player character from spinning
		
			//follow the players movement form 3rd or first person
		if(cam3){
			camera.position.set(
				spirit.position.x - (Math.sin(player.rotation)*cameraDistanceToPlayer),
				player.height + 1,
				spirit.position.z - (Math.cos(player.rotation)*cameraDistanceToPlayer)
			);
		}
		else{
			camera.position.set(spirit.position.x,
								player.height,
								spirit.position.z);
		}
			
			//look where the player looks
		camera.lookAt(
		new THREE.Vector3(
			spirit.position.x + Math.sin(player.rotation)*cameraDistanceToPlayer,
			player.height,
			spirit.position.z + Math.cos(player.rotation)*cameraDistanceToPlayer
			)
		);
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
	
	if(collided_with.name.includes("mushroom")){
		for(var i=0;i<numMushrooms;i++){
			scene.remove(mushroomsArray[i]);
		}
		mushroomPlacer(treesArray,numTrees,numMushrooms);
	}
};

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

window.onload = initScene;