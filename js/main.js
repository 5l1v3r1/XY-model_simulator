var width, height;
var renderer;

//utils
// mod
function mod(i, j) {
    return (i % j) < 0 ? (i % j) + 0 + (j < 0 ? -j : j) : (i % j + 0);
}

//Index
function Index(numW, numH){
	this._numW = numW;
	this._numH = numH;
	this.all_elem = numW*numH;
}
Index.prototype = {
	conv: function(w, h){
		w = mod(w, this._numW);
		h = mod(h, this._numH);
		return this._numW*h+w;
	}
};

//mersennetwister
var mt = new MersenneTwister();


// init three.js
function initThree(){
	width		= document.getElementById('canvas-frame').clientWidth;
	height	= document.getElementById('canvas-frame').clientHeight;
	renderer	= new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(width, height);
	document.getElementById('canvas-frame').appendChild(renderer.domElement);
	renderer.setClearColor(0xFFFFFF, 1.0);
}

var camera;
function initCamera(){
	camera	= new THREE.PerspectiveCamera(45, width/height, 1, 10000);

	camera.position.x = 0;
	camera.position.y = 0;
	camera.position.z = 1100;

	camera.up.x			= 0;
	camera.up.y			= 1;
	camera.up.z			= 0;

	camera.lookAt({x:0, y:0, z:0});
}

var scene;
function initScene(){
	scene		= new THREE.Scene();
}

var light;
function initLight(){
	light		= new THREE.DirectionalLight(0xFF0000, 1.0, 0);
	light.position.set(100, 100, 200);
	scene.add(light);
}


// arrow class
function Arrows(col, row, J){
	this._col		= col;
	this._row		= row;
	this._idx		= new Index(col, row);
	this._arrow		= new Array(col*row);
	this._theta		= new Array(col*row);
	this._div		= 30; //division
	this._J			= J;  //interaction
}

Arrows.prototype = {
	initialize: function(scene){
		for (var c = 0; c < this._col; ++c){
			for (var r = 0; r < this._row; ++r){
				var from			= new THREE.Vector3(0, 0, 0);
				var to			= new THREE.Vector3(10, 0, 0);
				var direction	= to.clone().sub(from);
				var length		= direction.length();
				headLength		= 15;
				headWidth		= 10;
				this._arrow[this._idx.conv(c, r)] = new THREE.ArrowHelper(direction.normalize(), from, length, 0xff0000, headLength, headWidth);
				scene.add(this._arrow[this._idx.conv(c, r)]);
				this._arrow[this._idx.conv(c, r)].position.set(20*(r-0.5*(this._row-1)), 20*(c-0.5*(this._col-1)), 0);
				//set spin
				this._theta[this._idx.conv(c, r)] = mt.nextInt(0, this._div);
				this._arrow[this._idx.conv(c, r)].rotation.set(0, 0, 2*Math.PI*this._theta[this._idx.conv(c, r)]/this._div);
			}
		}
	},
	MCstep: function(invtemp){
		//select spin
		var sel_c = mt.nextInt(0, this._col);
		var sel_r = mt.nextInt(0, this._row);

		var tempTheta = this._theta[this._idx.conv(sel_c, sel_r)];

		var prevE = -this._J*(Math.cos(2*Math.PI*(tempTheta-this._theta[this._idx.conv(sel_c, sel_r-1)])/this._div))
					   -this._J*(Math.cos(2*Math.PI*(tempTheta-this._theta[this._idx.conv(sel_c, sel_r+1)])/this._div))
					   -this._J*(Math.cos(2*Math.PI*(tempTheta-this._theta[this._idx.conv(sel_c-1, sel_r)])/this._div))
					   -this._J*(Math.cos(2*Math.PI*(tempTheta-this._theta[this._idx.conv(sel_c+1, sel_r)])/this._div));

		tempTheta = (mt.next() < 0.5) ? mod(tempTheta+1, this._div) : mod(tempTheta-1, this._div);

		var newE	 = -this._J*(Math.cos(2*Math.PI*(tempTheta-this._theta[this._idx.conv(sel_c, sel_r-1)])/this._div))
					   -this._J*(Math.cos(2*Math.PI*(tempTheta-this._theta[this._idx.conv(sel_c, sel_r+1)])/this._div))
					   -this._J*(Math.cos(2*Math.PI*(tempTheta-this._theta[this._idx.conv(sel_c-1, sel_r)])/this._div))
					   -this._J*(Math.cos(2*Math.PI*(tempTheta-this._theta[this._idx.conv(sel_c+1, sel_r)])/this._div));

		var dE = newE - prevE;

		//metropolis
		if (dE < 0 || mt.next() < Math.exp(-invtemp*dE)){
			this._theta[this._idx.conv(sel_c, sel_r)] = tempTheta;
			this._arrow[this._idx.conv(sel_c, sel_r)].rotation.set(0, 0, 2*Math.PI*this._theta[this._idx.conv(sel_c, sel_r)]/this._div);
		}
	}
};

var arrows;
function initObject(){
	arrows = new Arrows(40, 40, 1.0);
	//col = 40, row = 40, J = 1.0
	arrows.initialize(scene);

	var invtemp = 5;
	var interval = 10;

	//MCstep
	var timeoutCallBack = function(){
		for(var i=0; i<10000; ++i){
			arrows.MCstep(invtemp);
		}
		setTimeout(timeoutCallBack, interval);
	}

	setTimeout(timeoutCallBack, interval);
}

function loop(){
	window.requestAnimationFrame(loop);
	renderer.clear();
	renderer.render(scene, camera);
}

function threeStart(){
	initThree();
	initCamera();
	initScene();
	initLight();
	initObject();

	loop();
}
