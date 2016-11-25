'use strict';

Physijs.scripts.worker = 'scripts/physijs_worker.js';

//VARIABLES
	//functions
	var initScene,
	render,
	createObjects,
	addObjects,
	treeCoordGenerator,
	mushroomPlacer,
	keysInterpreter,
	applyMovement,
	objectives,
	restart,
	showUI,
	windowResizer,
	decreaseTransparency,
	pointParser;
	
	//event handler functions
	var keyUp,keyDown,handleCollision;	
	
		//scene basics variables
	var scene, 
		renderer, 
		render_stats, 
		physics_stats, 
		textureLoader,
		windowHeight,
		windowWidth,
		
		//light variables
		ambientLight,
		hemiSphereLight,
		pointlightSpirit,
		pointLightSpiritBack,
		pointLightSpiritUp,
		baseAmbientLightIntensity,
		baseFogDensity,
		baseBrightnessBarLength,
		overIlluminated,
		//camera variables
		camera,
		cameraDistanceToPlayer3rdPerson,
		cameraLookAt3rdPerson,
		cameraDistanceFromPlayerYCoord,
		cameraLookAt1stPerson,
		
		//scene state variables
		isScenePaused,
		isFocused,
		
		//display effect helper variables
		surroundColor,
		groundColor,
		
		//UI variables
		uiDisplay,
		brightnessBar
		,fell; //fell determines the 'game over reason'
	
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
			spirit, spiritGeometry, spiritMaterial; //spirit/player


	//player related variables
	zeroVector= new THREE.Vector3(0,0,0);
	
	var keyboard = {};
	
	var transparency, //how transparent the player is
		transparencyDecreaseRate, //how fast the transparency decrease is
		points, //how many point the player gathered altogether
		pointsPerMushroom, //points awawrded for collecting a mushroom		
		cam3, //camera is set in third person view or first person view
		difficultyCycle500, //difficulty increase after every 500 points
		difficultyCycle1000, //difficulty increase after every 1000 points
		difficultyCycle2000, //difficulty increase after every 2000 points
		difficultyCycle4000, //difficulty increase after every 4000 points
		mushroomLightGrant; //the amount of brightness regained by collecting a mushroom

	/*holds details about height, 
	movement speed, current speed, 
	rotation speed and current rotation 
	of the player respectively*/
	var player;


/***
Nice, long descriptions can be written this way
***/
initScene=function() {
	
	windowHeight=window.innerHeight-2;
	windowWidth=window.innerWidth-2;
	
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(windowWidth,windowHeight);
	
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
		scene.simulate( undefined,1 );
		physics_stats.update();
		}
	);
	
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
				rotationSpeed: Math.PI*0.008, rotation:0.0,
				sight:20
		};
			//brightness bar initialization
		baseBrightnessBarLength=80;
		uiDisplay = document.getElementById("brightnessBar");
		uiDisplay.style.width=baseBrightnessBarLength+"vw";
		uiDisplay = document.getElementById("brightnessText");
		uiDisplay.style.width=baseBrightnessBarLength+"vw";
		
		camera = new THREE.PerspectiveCamera(45, windowWidth/windowHeight , 1, 1200);
		cameraDistanceToPlayer3rdPerson=8;
		cameraLookAt3rdPerson=4;
		cameraDistanceFromPlayerYCoord=3;
		cameraLookAt1stPerson=8;
		
		scene.add(camera);
		
		//colours
		groundColor=0x30113a; //colour of groundMaterial and hemiSphereLight's ground property
		surroundColor=0x3a1b2c;
		
		//scene lights
		baseAmbientLightIntensity=0.5;
		baseFogDensity=0.05;
		
		hemiSphereLight= new THREE.HemisphereLight(0x000000,groundColor, 0.08);
		scene.add(hemiSphereLight);
		
		ambientLight = new THREE.AmbientLight(0xfffbea, baseAmbientLightIntensity);//4d004d
		scene.add(ambientLight);
		
		scene.fog=new THREE.FogExp2(surroundColor,baseFogDensity);

		//mushroomPlacer support variables
		treeTrunkBottom=0.75;
		mushroomTreeDistance=0.5;
		
		//treeCoordGenerator support variables
		randomGeneratorStatic=(mapSize/2)-treeTrunkBottom-mushroomTreeDistance;
		randomGeneratorDynamic=randomGeneratorStatic*2;
	
	textureLoader = new THREE.TextureLoader();
			//geometry and material definitions
				//sky
				skyDomeGeometry = new THREE.SphereGeometry(512, 16, 16, 0, Math.PI*2, 0, Math.PI*0.5),
				
				skyDomeMaterial= Physijs.createMaterial(
					new THREE.MeshLambertMaterial({ color:surroundColor,side: THREE.BackSide, fog: true}),
					1.0, // max friction
					0.0 // no restitution
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
				1.0, // max friction
				0.0 // no restitution
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
						1.0, //max friction
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
			
				//the player character
			spiritGeometry = new THREE.CylinderGeometry(0.5, 0.5, player.height,32,32);
			
			spiritMaterial = Physijs.createMaterial(
					new THREE.MeshPhongMaterial(
					{color:0xfeffe0,
					transparent:true,
					opacity:1.0,
					shininess:100
					}),
					0.5, //friction
					1.0 //restitution
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
		gameOver.position.set(0,-5,0);
		gameOver.name='gameOver';
		scene.add( gameOver );
	
	//create the objects (trees,mushrooms,player character)
	createObjects();
	
	//add the objects to the scene
	addObjects();	
	
	isScenePaused=false;
	isFocused=false;
	
	objectives(); //set game objectives
	
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
		//spirit.setCcdSweptSphereRadius(1);
		spirit.addEventListener('collision',handleCollision);
		spirit.name='spirit';
		
		//adds lighting to the spirit
		pointlightSpirit=new THREE.PointLight(0xffcccc, transparency, player.sight,2);
		
		pointlightSpirit.position.set(0, player.height/2, 0);
		pointlightSpirit.castShadow=true;
		pointlightSpirit.shadow.camera.near = 1;
		pointlightSpirit.shadow.camera.far = player.sight;
		pointlightSpirit.shadow.bias = 0.5;
		
		spirit.add(pointlightSpirit);
			
			//lit's the spirits from above
			pointLightSpiritUp=new THREE.PointLight(0xffdddd, transparency,2,1);
			
			pointLightSpiritUp.position.set(0,player.height+0.5,0);
			
			pointLightSpiritUp.shadow.camera.near = 1;
			pointLightSpiritUp.shadow.camera.far = player.sight;
			pointLightSpiritUp.shadow.bias = 0.01;		
			
			spirit.add(pointLightSpiritUp);
			
			
			//lit's the spirits back
			pointLightSpiritBack=new THREE.PointLight(0xffdddd, transparency,5,2);
			
			pointLightSpiritBack.shadow.camera.near = 1;
			pointLightSpiritBack.shadow.camera.far = player.sight;
			pointLightSpiritBack.shadow.bias = 0.01;		
			
			spirit.add(pointLightSpiritBack);
		
		
		//create the trees
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
				
			branches.position.set (0,6.5,0);
				
			tree.add(branches);
				
			tree.receiveShadow = true;
			tree.castShadow = true;
				
			tree.name='tree'+i;
			treesArray[i]=tree;
		}

		//create the mushrooms
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
					0
				);
					//cap above trunk
				mushroomCap.position.set (0,0.25,0);
					
					//combine cap, with trunk
				mushroom.add(mushroomCap);
					
				mushroom.receiveShadow = true;
				mushroom.castShadow = true;
					
				mushroom.name='mushroom'+i;
				
				mushroomsArray[i]=mushroom;//store the mushrooms in the mushroom array
		}					
	}
	
		//definition: addObjects
	addObjects=function(){
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
	
	//definition:objectives
	objectives=function(){
		//set/reset objective values
		numMushrooms=10;
		transparency=1;
		difficultyCycle500=1;
		difficultyCycle1000=1;
		difficultyCycle2000=1;
		difficultyCycle4000=1;
		mushroomLightGrant=0.08;
		transparencyDecreaseRate=1;
		points=0;
		pointsPerMushroom=100;
		overIlluminated=25;
		brightnessBar = document.getElementById("brightnessBar");
		pointsDisplay = document.getElementById("pointsDisplay");
		pointsDisplay.textContent=pointParser();
	}
	
//RENDERER

render = function() {
	if(isFocused && !isScenePaused){
		requestAnimationFrame( render );
				
		keysInterpreter();//interprets user input
	
	//effect updates
		//update the transparency of the player character
		spirit.material.opacity = transparency;
		
		//update the pointlights' intesity
		pointlightSpirit.intensity=
		pointLightSpiritBack.intensity=
		pointLightSpiritUp.intensity=transparency;
		
		//update the fog and ambient light intensity
		ambientLight.intensity=baseAmbientLightIntensity*transparency; 
		scene.fog.density=baseFogDensity*(1-(transparency-1));
			
			//decreaseTransparency
			transparency-=0.00025*transparencyDecreaseRate;
				
			//update the brightness bar
			brightnessBar.style.width=(baseBrightnessBarLength*transparency)+"vw";
				
			//game over if the player disappears
			if(transparency <= 0){
				fell=false;
				restart();
			}
	}	
	
	applyMovement();//move the player character and the camera
	
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
		//if the scene is on register keycode
	if(!isScenePaused){
		keyboard[event.keyCode] = true;
	}
	else if (uiDisplay.style.visibility == 'visible' &&
			event.keyCode != 67 &&
			event.keyCode != 37 &&
			event.keyCode != 38 &&
			event.keyCode != 39 &&
			event.keyCode != 40
			) {//at game start, on non-control keypress removes the UI
		uiDisplay.style.visibility='hidden';
		//reset objectives + transparency decrease
		objectives();
		isScenePaused=false;
		scene.simulate();
		requestAnimationFrame( render );
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

//definition:restart
restart=function(){
	//pause scene
	isScenePaused=true;
	scene.remove(spirit);
	keyboard={}; //flush keyboard buffer
	//remove mushrooms
	for(var i=0;i<numMushrooms;i++){
		scene.remove(mushroomsArray[i]);
	}
	//remove trees
	for(var i=0;i<numTrees;i++){
		scene.remove(treesArray[i]);
	}
	
	addObjects();//add scene elements(trees,mushrooms,player)
	
	//how the game ended
	if(fell){
		points/=5; //punishment for falling
		showUI('startOverFall');
	}else{
		showUI('startOverFadeOut');
	}
}

//definition: handleCollision
handleCollision=function(collided_with){
	
	//the game ended reset the scene 
	if(collided_with.name.includes("gameOver")){
		fell=true;
		restart();
	}
	
	//collected a mushroom
	if(collided_with.name.includes("mushroom")){
			
		for(var i=0;i<numMushrooms;i++){
			scene.remove(mushroomsArray[i]);
		}
		
		//difficulty 'module'
				//after every 500 points 
			if(points/500 >= difficultyCycle500){
					//mushrooms worth more
				pointsPerMushroom+=25;
					//step into next cycle
				difficultyCycle500++;
			}
			
			//after every 1000 points there are less mushrooms
			if(points/1000 >= difficultyCycle1000){
				if(numMushrooms!=1) numMushrooms-=1;
				difficultyCycle1000++;
			}
			
			//after every 2000 points transparency decreases faster
			if(points/2000 >= difficultyCycle2000){
				transparencyDecreaseRate+=0.2;
				difficultyCycle2000++;
			}
			
			//after every 4000 points mushrooms give back less brightness
			if(points/4000 >= difficultyCycle4000){
				mushroomLightGrant-=0.02;
				difficultyCycle4000++;
			}
		
		//modify points
		points+=pointsPerMushroom;
		
		//set new transparency
		transparency += mushroomLightGrant;
		
		//reward overIllumination and reset transparency to 1
		if (transparency > 1.0) {
			transparency = 1.0;
			points+=overIlluminated;
		}
	
		pointsDisplay.textContent=pointParser();
		
		mushroomPlacer(treesArray,numTrees,numMushrooms);
		
	}
};

//definition: pointParser
pointParser= function(){
	
	var pointString;
	
	//puts the points to the necessary format
	if(points===0) pointString="00000";
	else if(points<1000)pointString="00"+(points).toString();
	else if(points<10000)pointString="0"+(points).toString();
	else pointString=(points).toString();
	
	return pointString;
}

//definition: showUI  showUI('start');
showUI = function(action) { 
	isScenePaused = true;
	uiDisplay = document.getElementById("uiTextMain");
	if (action == 'start') {		
			//display main info
		uiDisplay.textContent ="The Glooming Forest";
			//display additional info
		uiDisplay = document.getElementById("uiTextInfo");
		uiDisplay.textContent="Press any non-control key to start the game";
		
			//display even more info
		uiDisplay = document.getElementById("uiTextInfo2");
		uiDisplay.textContent="Controls: Move - up/down arrow, look around - left/right arrow, change camera - c";
		
	} else if (action == 'startOverFall') {
			//display main info
		uiDisplay.textContent ="You fell into the abyss - GAME OVER";
		
			//display additional info
		uiDisplay = document.getElementById("uiTextInfo");
		uiDisplay.textContent="Your score is "+points+" points.";
		
			//display even more info
		uiDisplay = document.getElementById("uiTextInfo2");
		uiDisplay.textContent="Press any non-control key to restart";
		
	} else if (action == 'startOverFadeOut') {
			//display main info
		uiDisplay.textContent ="You completely fade away - GAME OVER";
		
			//display additional info
		uiDisplay = document.getElementById("uiTextInfo");
		uiDisplay.textContent="Your score is "+points+" points.";
		
			//display even more info
		uiDisplay = document.getElementById("uiTextInfo2");
		uiDisplay.textContent="";uiDisplay.textContent="Press any non-control key to restart";
	}
	
	uiDisplay = document.getElementById("uiDiv");
	uiDisplay.style.visibility='visible';
};

//on window resize
//source: http://learningthreejs.com/data/THREEx/docs/THREEx.WindowResize.html
window.addEventListener('resize', function(){
		windowHeight=window.innerHeight;
		windowWidth=window.innerWidth;
		
		//resize the gameCanvas
		renderer.setSize(windowWidth,windowHeight);
		//update the camera
		camera.aspect= windowWidth/windowHeight;
		camera.updateProjectionMatrix();
}, false);

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

	//stop character moving and do not decrease opacity 
	//if the user leaves the browser tab
window.addEventListener('blur',function(){
		
	//opacity
	isFocused=false;
	
	//stop rotation
	keyboard[37]=false;
	keyboard[39]=false;
		
	//stop movement
	keyboard[38]=false;
	keyboard[40]=false;
});


window.addEventListener('focus',function(){
	//only set opacity if the UI isn't visible
		isFocused=true;		
});

	//initializes the whole scene
window.onload = function(){
		initScene();
		showUI('start');
}