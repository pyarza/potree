

/**
 * 
 * @param camera
 * @augments CamHandler
 * @author Markus Schuetz
 */
function EarthCamHandler(camera){
	this.camera = camera;
	
	this.velocity = [0,0,0];
	this.targetVelocity = [0,0,0];
	this.targetVelocityMultiplicator = 20.0;
	this.moveSpeed = 0.5;
	this.zoomSpeed = 0.2;
	this.rotateSpeed = 0.2;
	this.pivot = V3.$(0,0,0);
	this.fetchingWorldPos = false;
	this.transformAtNavigationStart = null;
	this.originNavigationStart = null;
}

EarthCamHandler.prototype = new CamHandler();

EarthCamHandler.prototype.addTime = function(time){
	this.update(time);
};

EarthCamHandler.prototype.update = function(time){
	// up/down/left/right movement
	this.velocity[0] = 0.2 *this.velocity[0] + 0.8 * this.targetVelocity[0] * this.targetVelocityMultiplicator;
	this.velocity[1] = 0.2 *this.velocity[1] + 0.8 * this.targetVelocity[1] * this.targetVelocityMultiplicator;
	this.velocity[2] = 0.2 *this.velocity[2] + 0.8 * this.targetVelocity[2] * this.targetVelocityMultiplicator;
	
	// limit movement to xz plane and make sure, speed is independent from view direction
	var d = V3.rTransform(this.velocity, this.camera.transform);
	var v = V3.length(d);
	if(v > 0.01){
		d[1] = 0;
		d = V3.normalize(d);
	}
	
	d = V3.scale(d, this.moveSpeed*time*v);
	this.camera.translate(d[0], 0, d[2]);
};

EarthCamHandler.prototype.invokeKeyDown = function(event){
	// start up/down/left/right movement
	if(event.which === KeyCodes.DOWN_ARROW || event.which == KeyCodes.S ){
		this.targetVelocity[2] = 1 * this.moveSpeed;
	}else if(event.which === KeyCodes.UP_ARROW  || event.which == KeyCodes.W){
		this.targetVelocity[2] = -1 * this.moveSpeed;
	}else if(event.which === KeyCodes.RIGHT_ARROW  || event.which == KeyCodes.D){
		this.targetVelocity[0] = 1 * this.moveSpeed;
	}else if(event.which === KeyCodes.LEFT_ARROW  || event.which == KeyCodes.A){
		this.targetVelocity[0] = -1 * this.moveSpeed;
	}
	
	
};

EarthCamHandler.prototype.invokeKeyUp = function(event){
	// cancel up/down/left/right movement
	if(event.which === KeyCodes.DOWN_ARROW  || event.which == KeyCodes.S){
		this.targetVelocity[2] = 0;
	}else if(event.which === KeyCodes.UP_ARROW  || event.which == KeyCodes.W){
		this.targetVelocity[2] = 0;
	}else if(event.which === KeyCodes.RIGHT_ARROW  || event.which == KeyCodes.D){
		this.targetVelocity[0] = 0;
	}else if(event.which === KeyCodes.LEFT_ARROW  || event.which == KeyCodes.A){
		this.targetVelocity[0] = 0;
	}
	
};

EarthCamHandler.prototype.invokeKeyPress = function(event){
	if(event.which == KeyCodes.M){
		this.logView();
	}
};
EarthCamHandler.prototype.invokeMouseDown = function(event){};
EarthCamHandler.prototype.invokeMouseUp = function(event){};
EarthCamHandler.prototype.invokeMouseMove = function(event, diffX, diffY){};

EarthCamHandler.prototype.invokeMouseDrag = function(event, pressedKeys, diffX, diffY){
	// don't do anything while point picking is in progress
	if(this.fetchingWorldPos){
		return;
	}
	
	if(pressedKeys.length == 1 && event.shiftKey && pressedKeys.contains(Mouse.left)){
		// rotation around pivot
		var amount = -this.rotateSpeed*timeSinceLastFrame;
		this.camera.rotateAroundPivot(amount*diffX, amount*diffY, this.pivot);
	}else if(pressedKeys.length == 1 && pressedKeys.contains(Mouse.left)){
		// translation
		var plane = new Plane(-this.pivot.y, [0,1,0]);
		var dir = this.clickToCamDirection(event);
		var I = plane.intersection(this.originAtNavigationStart,dir);
		var translation = V3.sub(this.originAtNavigationStart, I);
		var newCamPos = V3.add(this.pivot, translation);
		var diff = V3.sub(newCamPos, this.originAtNavigationStart);
		var mt = M4x4.makeTranslate3(diff.x, diff.y, diff.z);
		this.camera.transform = M4x4.mul(mt, this.transformAtNavigationStart);
	}
};


EarthCamHandler.prototype.fetchingPosition = false;
EarthCamHandler.prototype.invokeMouseDown = function(event){
	// do nothing if mouse is not in canvas
	if(event.target != Potree.canvas || !mouseIsInCanvas(event)){
		return;
	}
	event.preventDefault();
	
	this.transformAtNavigationStart = this.camera.transform;
	this.originAtNavigationStart = V3.transform([0,0,0], this.transformAtNavigationStart);
	
	// calculate world position at click location
	var handler = this;
	var callback = function(worldPos){
		handler.pivot = worldPos;
		handler.fetchingWorldPos = false;
	};
	var arg = {
		"x" 		: event.layerX,
		"y" 		: Potree.canvas.height - event.layerY,
		"width"		: 32,
		"height"	: 32,
		"callback"	: callback
	}
	this.fetchingWorldPos = true;
	renderer.worldPosAt(arg);
	
	return mouseIsInCanvas(event);
}


EarthCamHandler.prototype.invokeMouseWheel = function(delta, event){
	if(mouseIsInCanvas(event)){
		event.preventDefault();
	}else{
		return;
	}
	
	dir = this.clickToCamDirection(event);
	var v = V3.scale(dir, delta*timeSinceLastFrame*this.zoomSpeed);
	var mt = M4x4.makeTranslate3(v.x, v.y, v.z);
	this.camera.transform = M4x4.mul(mt, this.camera.transform);
};


EarthCamHandler.prototype.clickToCamDirection = function(event){
	var nx = event.layerX / Potree.canvas.width;
	var ny = (Potree.canvas.height - event.layerY) / Potree.canvas.height;
	var dir = this.camera.getDirection(nx, ny);
	
	return dir;
}

EarthCamHandler.prototype.logView = function(){
	console.log("== VIEW ==");
	console.log(this);
	console.log(this.camera);
	
	console.log("===========");
}