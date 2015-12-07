var WIDTH, HEIGHT;
var stats, info;
var scene, topCamera, fxCamera, renderer, wallMaterial, groundMaterial;
var time;
var ground;

var topView = {
	background: new THREE.Color().setRGB( 0.5, 0.5, 0.5 ),
	camera: new THREE.OrthographicCamera( -100, 100, 100, -100, 0.1, 20000 ),
	update: function( camera, width, height )
	{
		camera.left = -width / 2;
		camera.right = width / 2;
		camera.top = height / 2;
		camera.bottom = -height / 2;

		camera.updateProjectionMatrix();
	}
};

var fxView = {
	background: new THREE.Color().setRGB( 0.1, 0.1, 0.1 ),
	camera: new THREE.PerspectiveCamera( 90, 200 / 200, 0.1, 20000 ),
	update: function( camera, width, height )
	{
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}
};

function Point( _x, _y )
{
	this.x = _x;
	this.y = _y;
}
var GameState = Object.freeze( {
	Unknown            : "Unknown",
	LevelCreation      : "LevelCreation",
	LevelProcessing    : "LevelProcessing",
} );

var GameStateInfo = {};
GameStateInfo[ GameState.Unknown ] =
	"Press 'c' to enter level creation mode. Press 'q' at any moment to return to this screen.";
GameStateInfo[ GameState.LevelCreation ] =
	"Add gallery walls using left click on the left part of the screen; undo walls using 'z'. Press 'f' to close the gallery walls and finish level creation. Press 'q' to cancel level creation.";
GameStateInfo[ GameState.LevelProcessing ] =
	"TODO";

var state = GameState.Unknown;

var polygon = new Array();
var polygonMeshes;

var dcel = null;

init();
animate();

function init()
{
//	stats = new Stats();
//	stats.setMode( 0 );
//
//	stats.domElement.style.position = 'absolute';
//	stats.domElement.style.left = '10px';
//	stats.domElement.style.bottom = '10px';
//	document.body.appendChild( stats.domElement );

	info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.padding = '10px';
	info.style.width = '100%';
	info.style.textAlign = 'center';
	info.style.color = '#ffffff';
	setInfo( GameStateInfo[ state ] );

	document.body.appendChild( info );

	scene = new THREE.Scene();
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;

	renderer = new THREE.WebGLRenderer( { antialias:true } );
	renderer.setSize( WIDTH, HEIGHT );
	document.body.appendChild( renderer.domElement );

	fxView.camera.position.set( 0, 700, 300 );
	fxView.camera.lookAt( scene.position );
	fxView.update( fxView.camera, Math.floor( WIDTH / 2 ), HEIGHT );
	scene.add( fxView.camera );

	topView.camera.position.set( 0, 500, 0 );
	topView.camera.up.set( 0, 0, -1 );
	topView.camera.lookAt( scene.position );
	topView.update( topView.camera, Math.floor( WIDTH / 2 ), HEIGHT );
	scene.add( topView.camera );

	window.addEventListener( 'resize', function() {
		WIDTH = window.innerWidth;
		HEIGHT = window.innerHeight;
		renderer.setSize( WIDTH, HEIGHT );

		topView.update( topView.camera, Math.floor( WIDTH / 2 ), HEIGHT );
		fxView.update( fxView.camera, Math.floor( WIDTH / 2 ), HEIGHT );
	} );

	document.addEventListener( 'mousedown', onMouseDown, false );
	document.addEventListener( 'keydown', onKeyDown, false );

//	var light = new THREE.PointLight( 0xffffff );
//	light.position.set( 0, 200, 0 );
//	scene.add( light );

	var light = new THREE.SpotLight( 0xffffff, 2.0 );
	light.position.set( 0, 700, 300 );
	light.lookAt( scene.position );
	scene.add( light );

//	wallMaterial =
//		new THREE.MeshLambertMaterial( {
//			color: 0xffffff
//		} );
	wallMaterial =
		new THREE.MeshPhongMaterial( {
			color: 0xaaaaaa,
			specular: 0xffffff,
			shininess: 50,
		} );

	groundMaterial = shaders.floor1;

	ground = new THREE.Mesh(
		new THREE.PlaneGeometry( 2048, 2048 ),
		groundMaterial );
	ground.position.z = -512;
	ground.rotation.z = Math.PI / 4;
	ground.rotation.x = -Math.PI / 2;
//	scene.add( ground );

	polygonMeshes = new THREE.Object3D();
	scene.add( polygonMeshes );

	time = new THREE.Clock( true );
}

function animate()
{
	//stats.begin();

	var left = 0;
	var bottom = 0;
	var width = Math.floor( WIDTH / 2 );
	var height = HEIGHT;

	renderer.setViewport( left, bottom, width, height );
	renderer.setScissor( left, bottom, width, height );
	renderer.enableScissorTest( true );
	renderer.setClearColor( topView.background );

//	ground.visible = false;
	renderer.render( scene, topView.camera );

	left = width;
	width = WIDTH - width;

	renderer.setViewport( left, bottom, width, height );
	renderer.setScissor( left, bottom, width, height );
	renderer.enableScissorTest( true );
	renderer.setClearColor( fxView.background );

//	ground.visible = true;
//	groundMaterial.uniforms.fIntensity.value = 0.5 * Math.pow( Math.sin( time.getElapsedTime() + Math.PI ), 2 ) + 0.25;
	renderer.render( scene, fxView.camera );

	requestAnimationFrame( animate );

	//stats.end();
}

function createWall( start, end )
{
	var HEIGHT = 100;

	var diff = end.clone().sub( start );
	var center = end.clone().add( start ).multiplyScalar( 0.5 );
	var length = diff.length();

	var wall = new THREE.Mesh(
		new THREE.BoxGeometry( length, HEIGHT, 10 ),
		wallMaterial );
	wall.rotation.set( 0, -Math.atan2( diff.y, diff.x ), 0 );
	wall.position.set( center.x, HEIGHT / 2, center.y );

	return wall;
}

function createPillar( pos )
{
	var HEIGHT = 110;

	var pillar = new THREE.Mesh(
		new THREE.CylinderGeometry( 10, 10, HEIGHT, 16, 1 ),
		wallMaterial );
	pillar.position.set( pos.x, HEIGHT / 2, pos.y );

	return pillar;
}

function onMouseDown( event )
{
	event.preventDefault();
	var vector = new THREE.Vector2(
		( event.clientX / WIDTH ) * 2 - 1,
		( event.clientY / HEIGHT ) * 2 - 1 );

	if( state == GameState.LevelCreation )
	{
		if( vector.x >= 0.0 )
		{
			return;
		}
		else
		{
			vector.x = vector.x * 2 + 1;
		}

		vector.x *= WIDTH / 4;
		vector.y *= HEIGHT / 2;

		polygon.push( vector );

		if( polygon.length > 1 )
		{
			polygonMeshes.add(
				createWall( polygon[ polygon.length - 2 ], vector ) );

			// TODO: REMOVE
			//polygonMeshes.add( createPillar( vector.clone().add( polygon[ polygon.length - 2 ] ).multiplyScalar( 0.5 ).add( lineNormal( polygon[ polygon.length - 2 ], vector ).multiplyScalar( 10 ) ) ) );
		}

		polygonMeshes.add( createPillar( vector ) );
	}
}

function undoWall()
{
	if( state != GameState.LevelCreation )
	{
		return;
	}

	if( polygon.length > 1 )
	{
		polygon.length -= 1;
		polygonMeshes.remove(
			polygonMeshes.children[ polygonMeshes.children.length - 1 ] );
		polygonMeshes.remove(
			polygonMeshes.children[ polygonMeshes.children.length - 1 ] );
	}
	else if( polygon.length == 1 )
	{
		polygon.length -= 1;
		polygonMeshes.remove(
			polygonMeshes.children[ polygonMeshes.children.length - 1 ] );
	}
}

function onKeyDown( event )
{
	event = event || window.event;

	switch( String.fromCharCode( event.keyCode ) )
	{
		case 'C':
			changeState( GameState.LevelCreation );
			break;
		case 'F':
			changeState( GameState.LevelProcessing );
			break;
		case 'Z':
			undoWall();
			break;
		case 'Q':
			changeState( GameState.Unknown );
			break;
	}
}

function setInfo( str )
{
	info.innerHTML = str;
}

function restart()
{
	polygon.length = 0;
	scene.remove( polygonMeshes );
	polygonMeshes = new THREE.Object3D();
	scene.add( polygonMeshes );
}

function changeState( s )
{
	if( s == state )
	{
		return;
	}
	else if( s == GameState.Unknown )
	{
		restart();
	}
	else
	{
		switch( state )
		{
			case GameState.Unknown:
				if( s != GameState.LevelCreation )
				{
					return;
				}
				break;
			case GameState.LevelCreation:
				if( s == GameState.LevelProcessing && polygon.length >= 2 )
				{
					processLevel();
				}
				else
				{
					return;
				}
				break;
			case GameState.LevelProcessing:
				return; //TODO
				break;
		}
	}

	state = s;
	setInfo( GameStateInfo[ state ] );
}

function processLevel()
{
	polygonMeshes.add(
		createWall( polygon[ polygon.length - 1 ], polygon[ 0 ] ) );

	dcel = simplePolygonFromVectorList( polygon );

	if( dcel == null )
	{
		alert( "Error: Failed to create DCEL structure." );
	}

	// TODO: remove after testing
//	var num = 0;
//	var iter = dcel.next;
//	while( iter != dcel )
//	{
//		var pillar = createPillar( iter.origin.pos );
//		pillar.position.y = 130;
//		scene.add( pillar );
//
//		iter = iter.next;
//		++num;
//	}
//	alert( num );
	// END TODO
}
