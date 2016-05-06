var width = 800;
var height = 600;

var names = [
	'SupermanSuduction1',
	'SupermanSuduction2',
	'SupermanSuduction3',
	'SupermanDie',
	'SupermanWalk',
	'SupermanSuductionWin',
	'SupermanSuductionLose'
];

var renderer = PIXI.autoDetectRenderer(width, height,{backgroundColor : 0x1099bb});
document.body.appendChild(renderer.view);

// create the root of the scene graph
var stage = new PIXI.Container();

var fl = new PIXI.FlumpLibrary('../test/assets/flump/animation-100/character');


fl.load().then(function(library){

	for(var i = 0; i < 200; i++)
	{
		var name = names[Math.floor(Math.random()*names.length)];
		var movie = fl.createMovie(name);
		// console.log(name);
		
		// var movie = fl.createMovie('cubeAnimation');
		movie.position.set(Math.random() * width|0, Math.random() * height|0);
		movie.play(-1)
		stage.addChild(movie);
	}

	var pTime = 0;
	// start animating
	animate();
	function animate(time) {
		requestAnimationFrame(animate);

		if(!pTime){
			pTime = time;
		} else {
			var delta = time - pTime;
			pTime = time;
			

			for(var i = 0; i < stage.children.length; i++)
			{
				stage.children[i].onTick(delta, delta);
			}
			// render the container
			renderer.render(stage);
		}

	}


}).catch(function(err){console.log(err)});

