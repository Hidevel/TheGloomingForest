'use strict';


Physijs.scripts.worker = 'scripts/physijs_worker.js';

//VARIABLES
	//functions
	var initScene, render, addObjects, 
	coordGenerator, keysInterpreter,
	applyMovement;
	
	//event handler functions
	var keyUp,keyDown,handleCollision;	
	
	//scene basics variables
	var scene, renderer, render_stats, physics_stats, textureLoader, 
		ambientLight, pointlight, camera, cameraDistanceToPlayer;
	
		//object variables
		var mapSize = 100;//size of the map
	
		var numObject = 100; //how many trees and mushrooms will be there together
		
			//array of already occupied coordinates
		var randomCoordinates=new Array(2);//we will store x and y coordiantes
			for(var i=0;i<numObject;i++){
				randomCoordinates[i]=new Array(numObject); //coordinates for every object
		}
		
		//gometry, material and mesh variables
		var ground, groundGeometry, groundMaterial, //ground
			tree, trunkGeometry, trunkMaterial, //tree
			branches, branchGeometry, branchMaterial, //tree
			mushroom, mushroomTrunkGeometry, mushroomTrunkMaterial, //mushroom
			mushroomCap, mushroomCapGeometry, mushroomcapMaterial, //mushroomCap
			spirit, spiritGeometry, spiritMaterial; //spirit/player
			
			/***
			dfhifhdhjldkfhldsfjsdlkfksdl
			***/
			
			//geometry and material definitions
				//ground
			groundGeometry = new THREE.BoxGeometry(mapSize, 0, mapSize);
			
			groundMaterial = Physijs.createMaterial(
				new THREE.MeshLambertMaterial({ color:0xffffff }),
				.0, // high friction
				.0 // low restitution
			);
				
				//tree
			trunkGeometry=new THREE.CylinderGeometry(2, 2, 6);
			
			trunkMaterial = Physijs.createMaterial(
					new THREE.MeshPhongMaterial(
					{color:0x60351c}),
					1.0, //friction
					.0 //restitution
			);
			
			branchGeometry=new THREE.SphereGeometry(4);
			
			branchMaterial = Physijs.createMaterial(
						new THREE.MeshPhongMaterial(
						{color:0x1c601e}),
						1.0, //friction
						.0 //restitution
			);
			
				//mushroom
			mushroomTrunkGeometry = new THREE.CylinderGeometry(0.2, 0.22, 0.5);
			
			mushroomTrunkMaterial = Physijs.createMaterial(
						new THREE.MeshPhongMaterial(
						{color:0xfff6e2}),
						1.0, //friction
						1.0 //restitution
			); 
			
			mushroomCapGeometry= new THREE.SphereGeometry(0.5,8,6,0,Math.PI*2,0,Math.PI/2);
			
			mushroomcapMaterial = Physijs.createMaterial(
						new THREE.MeshPhongMaterial(
						{color:0xf9e2ff}),
						1.0, //friction
						1.0 //restitution
			);
			
			spiritGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2);
			
			spiritMaterial = Physijs.createMaterial(
					new THREE.MeshPhongMaterial(
					{ color:0x33ff66}),
					.0, //friction
					.0 //restitution
			);

var objects = [];

var keyboard = {};

var cam3 = true; //camera is set in third person view

var player = {height: 2.0, 
				movementSpeed: 5.0, movement:0.0, 
				rotationSpeed: Math.PI*0.01, rotation:0.0
};
//holds details about height, move speed of player


initScene=function() {
	
	renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setSize(window.innerWidth, window.innerHeight);
	
	//enable shadows
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.shadowMapSoft = true;
	
	document.getElementById( 'viewport' ).appendChild(renderer.domElement);
	
	render_stats = new Stats();
	document.getElementById( 'viewport' ).appendChild( render_stats.domElement );
	
	physics_stats = new Stats();
	document.getElementById( 'viewport' ).appendChild( physics_stats.domElement );

	scene = new Physijs.Scene({fixedTimeStep: 1 / 60 });
	scene.setGravity(new THREE.Vector3( 0, -30, 0 ));
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
	
	
	textureLoader = new THREE.TextureLoader();
	
	// Ground
		ground = new Physijs.BoxMesh(
			groundGeometry,
			groundMaterial,
			0 // mass
		);
		ground.receiveShadow = true;
		scene.add( ground );
	
	
	
	ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
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
	
	requestAnimationFrame(render);
	scene.simulate();
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
		spirit.position.y += 1.0;
		spirit.receiveShadow = true; //meshes - object both receive
		spirit.castShadow = true; // and cast shadows
		spirit.setCcdMotionThreshold(1);
		spirit.addEventListener( 'collision', handleCollision);
		scene.add(spirit);
		
		
		//place trees and mushrooms on the map
		for (var i = 0; i < numObject; i++) {
			
			randomCoordinates[0][i]=coordGenerator(mapSize,randomCoordinates[0]);		
			randomCoordinates[1][i]=coordGenerator(mapSize,randomCoordinates[1]);
			
			//NO TREE APPEARING ON 0, 0, 0 where the spirit is
			if (Math.abs(randomCoordinates[0][i]) < 2.0) randomCoordinates[0][i] += 4.0;
			if (Math.abs(randomCoordinates[1][i]) < 2.0) randomCoordinates[1][i] += 4.0;
			
			
			//mushrooms from trunk and cap near the trees
				//place a mushroom instead of every 10th tree
			if(i%10===0){ 
				mushroom = new Physijs.CylinderMesh(
				mushroomTrunkGeometry,
				mushroomTrunkMaterial,
				0
				);
				mushroom.position.set (randomCoordinates[0][i],
				0.25,
				randomCoordinates[1][i]);
				
				mushroomCap = new Physijs.ConeMesh(
				mushroomCapGeometry, 
				mushroomcapMaterial,
				1000
				);
				mushroomCap.position.set (0,
				0.25,
				0);
				
				mushroom.add(mushroomCap);
				mushroom.receiveShadow = true;
				mushroom.castShadow = true;	
				
				scene.add(mushroom);				
			}
			else{
				tree = new Physijs.CylinderMesh(
				trunkGeometry,
				trunkMaterial,
				0
				);
				tree.position.set (randomCoordinates[0][i],
				3,
				randomCoordinates[1][i]);
				
				branches = new Physijs.SphereMesh(
				branchGeometry, 
				branchMaterial,
				0
				);
				branches.position.set (0,
				6,
				0);
				
				
				tree.add(branches);
				
				tree.receiveShadow = true;
				tree.castShadow = true;
				scene.add(tree);
			}
			
		}	
	}
		
		//generataes a random coordinate
		coordGenerator = function (mapSize,storedCoordiantes){
			var newCoordinate=Math.floor(49 - 98 * Math.random());
				
			if(storedCoordiantes.includes(newCoordinate)){
				newCoordinate+=1;
			}
			
			return newCoordinate;
		};

//RENDERER

render = function() {
		requestAnimationFrame( render );
		
		/*spirit.__dirtyPosition = true;
		spirit.__dirtyRotation = true;
		spirit.setLinearVelocity(new THREE.Vector3(0, 0, 0));
		spirit.setAngularVelocity(new THREE.Vector3(0, 0, 0));*/
		keysInterpreter();
		
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
		
		spirit.setAngularVelocity(new THREE.Vector3(0,0,0)); //prevent the player character from spinning
		
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

handleCollision=function( collided_with, linearVelocity, angularVelocity ){
	console.log("collided!");
};

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

window.onload = initScene;