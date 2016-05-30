# PixiFlump
Pixi Flump Library compatible for pixi v3

## How to?

#### Install
	bower install pixi-flump

or use npm
	
    npm install pixi-flump

#### Setup HTML
Add this to your setup. or where ever you have your pixi and pixi-flump library.
	<script src="./bower_components/pixi.js/bin/pixi.js"></script>
	<script src="./bower_components/pixi-flump/bin/pixi-flump.js"></script>

#### Setup
	var renderer = PIXI.autoDetectRenderer(500, 500,{backgroundColor : 0x1099bb});
	document.body.appendChild(renderer.view);
	
	// create container
	var stage = new PIXI.Container();
	
	// create library
	// only describe location to directory, FlumpLibrary will find library.json and the atlas0.png in that directory.
	// see example export in ./test/assets/flump/animation-100/cube
	var library = new PIXI.FlumpLibrary('./exports/animation1');
	
	// start loading library
	library.load(function(progress){ console.log('loading', progress * 100); })
		.then(function(library){
			var movie = library.createMovie('cubeAnimation');
			
			stage.addChild(movie);
			
			// plays animation 1 time;
			movie.play(1);
			
			// plays animation 7 times
			movie.play(7);
			
			// plays animation infinite
			movie.play(-1);
			
			// plays animation defined with the label startLabelName once then plays loopLabel infinite
			movie.play(1, 'startLabelName').play(-1, 'loopLabel');
			
			// ends all running animations and starts playing animation with the label startLabelName once when the running animation is done.
			movie.end(true).play(1, 'startLabelName');
		});
		
	//see PIXI documentation how this could be done better.
	
	

See this simple example working in ./example/simple.html

# requirements
A created movie needs to have a function called onTick to see progress.

## example code

	var library = new PIXI.FlumpLibrary('./exports/animation1');
	var movie;
	
	// start loading library
	library.load(function(progress){ console.log('loading', progress * 100); })
		.then(function(library){
			movie = library.createMovie('cubeAnimation');
			movie.play(-1);
			
			// start animation
			animate();
		});
		
	var pTime = 0;
	function animate(time) {
		requestAnimationFrame(animate);
	
		if(!pTime){
			pTime = time;
		} else {
			var delta = time - pTime;
			pTime = time;
			
			movie.onTick(delta, delta);
			
			// render the container
			renderer.render(stage);
		}
	
	}