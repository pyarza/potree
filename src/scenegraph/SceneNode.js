
/**
 * @class
 */
function SceneNode(name, parent) {
	if (arguments[0] === inheriting) return;
	this._scene = null;
	this.name = name;
	this.parent = parent;
	this.children = new Object();
	this.aabb = null;
	this._visible = true;
	this._globalPosition = V3.$(0,0,0);

	// age in s
	this.age = 0;

	this._transform = M4x4.I;
	if (this.parent != null) {
		this.parent.addChild(this);
		this.scene = parent.scene;
	}
	
	this.tmpMatrix1 = M4x4.$();
	this.tmpMatrix2 = M4x4.$();
	this.tmpMatrix3 = M4x4.$();
}

Object.defineProperty(SceneNode.prototype, 'visible', {
	set: function(visible){
		this._visible = visible;
	},
	
	get: function(){
		return this._visible;
	}
});

Object.defineProperty(SceneNode.prototype, 'scene', {
	set: function(scene){
		this._scene = scene;
	},
	
	get: function(){
		return this._scene;
	}
});

Object.defineProperty(SceneNode.prototype, "transform", {
	get: function(){
		return this._transform;
	},
	set: function(transform){
		this._transform = transform;
	}
});

Object.defineProperty(SceneNode.prototype, 'localTransformation', {
	get: function(){
		return this._transform;
	}
});

Object.defineProperty(SceneNode.prototype, 'globalTransformation', {
	get: function(){
//		var cur = this;
//		var globalTransform = cur._transform;
//		var globalTransform = M4x4.clone(cur._transform);
//		while (cur.parent !== null) {
//			cur = cur.parent;
//			globalTransform = M4x4.mul(cur._transform, globalTransform);
//		}
//		return globalTransform;
	
		var cur = this;
		var globalTransform = this.tmpMatrix1;
		var tmpTransform = this.tmpMatrix2;
		M4x4.copy(cur._transform, globalTransform);
		while(cur.parent != null){
			cur = cur.parent;
			M4x4.mul(cur._transform, globalTransform, tmpTransform);
			var tmp = globalTransform;
			globalTransform = tmpTransform;
			tmpTransform = tmp;
		}
		return globalTransform;
	}
});

Object.defineProperty(SceneNode.prototype, 'localPosition', {
	set: function(value){
		var oldPos = this.localPosition;
		this.translate(-oldPos.x, -oldPos.y, -oldPos.z);
		this.translate(value.x, value.y, value.z);
	},
	get: function(){
		return V3.transform(V3.$(0, 0, 0), this._transform);
	}
});

Object.defineProperty(SceneNode.prototype, 'globalPosition', {
	set: function(value){
		var oldPos = this.localPosition;
		var oldGlobalPos = this.globalPosition;
		var diff = V3.sub(value, oldGlobalPos);
		this.translate(diff.x, diff.y, diff.z);
	},
	get: function(){
		V3.transform(V3.$(0, 0, 0), this.globalTransformation, this._globalPosition);
		return this._globalPosition;
	}
});

Object.defineProperty(SceneNode.prototype, 'descendants', {
	get: function(){
		var descendants = new Array();
		var stack = new Array();
		stack.push(this);
		while(stack.length !== 0){
			var node = stack.pop();
			descendants.push(node);
			for(var key in node.children) {
				stack.push(node.children[key]);
			}
		}
		
		return descendants;
	}
});

SceneNode.prototype.getLocalDirection = function(){
	var pos1 = V3.transform(V3.$(0, 0, 0), this._transform);
	var pos2 = V3.transform(V3.$(0, 0, -1), this._transform);
	
	var dir = V3.normalize(V3.sub(pos2, pos1));
	return dir;
};

SceneNode.prototype.getGlobalDirection = function(){
	var transform = this.globalTransformation;
	var pos1 = V3.transform(V3.$(0, 0, 0), transform);
	var pos2 = V3.transform(V3.$(0, 0, -1), transform);
	
	var dir = V3.normalize(V3.sub(pos2, pos1));
	return dir;
};

SceneNode.prototype.getUpVector = function() {
	var pos = V3.transform(V3.$(0, 0, 0), this._transform);
	var absUp = V3.transform(V3.$(0, 1, 0), this._transform);
	var up = V3.sub(absUp, pos);

	return up;
};

SceneNode.prototype.getSideVector = function() {
	var pos = V3.transform(V3.$(0, 0, 0), this._transform);
	var absSide = V3.transform(V3.$(1, 0, 0), this._transform);
	var side = V3.sub(absSide, pos);

	return side;
};

SceneNode.prototype.getViewVector = function() {
	var pos = V3.transform(V3.$(0, 0, 0), this._transform);
	var absView = V3.transform(V3.$(1, 0, 0), this._transform);
	var view = V3.sub(absView, pos);

	return view;
};


SceneNode.prototype.addTime = function(time) {
	this.age += time;

	for ( var childname in this.children) {
		this.children[childname].addTime(time);
	}
};

SceneNode.prototype.setParent = function(parent) {
	if(this.parent != null){
		delete this.parent.children[this.name];
	}
	this.parent = parent;
	if(parent != null){
		parent.children[this.name] = this;
		this.scene = parent.scene;
	}
};

SceneNode.prototype.addChild = function(child) {
	if (child.parent != null) {
		delete child.parent.children[child.name];
	}

	child.parent = this;
	child.scene = this.scene;
	this.children[child.name] = child;
};


/**
 * Liefert das Inverse der lokalen Transformationsmatrix unter der Annahme, dass
 * es sich um eine Matrix handelt, die nach Rückverschiebung zum Ursprung
 * orthogonal ist.
 * 
 * @returns
 */
SceneNode.prototype.getInverseLocalTransformation = function() {
	var pos = this.localPosition;
	var toOrigin = M4x4.translate3(-pos[0], -pos[1], -pos[2], M4x4.I);
	var atOrigin = M4x4.mul(toOrigin, this._transform);
	var inverseOrthonormal = M4x4.inverseOrthonormal(atOrigin);

	return M4x4.mul(inverseOrthonormal, toOrigin);
};

/**
 * Liefert das Inverse der globalen Transformationsmatrix unter der Annahme,
 * dass es sich um eine Matrix handelt, die nach Rückverschiebung zum Ursprung
 * orthogonal ist.
 * 
 * @returns
 */
SceneNode.prototype.getInverseGlobalTransformation = function() {
//	var pos = this.globalPosition;
//	var toOrigin = M4x4.translate3(-pos[0], -pos[1], -pos[2], M4x4.I);
//	var atOrigin = M4x4.mul(toOrigin, this.globalTransformation);
//	var inverseOrthonormal = M4x4.inverseOrthonormal(atOrigin);
//
//	return M4x4.mul(inverseOrthonormal, toOrigin);
	
	var pos = this.globalPosition;
	M4x4.translate3(-pos[0], -pos[1], -pos[2], M4x4.I, this.tmpMatrix1);
	var toOrigin = this.tmpMatrix1;
	M4x4.mul(toOrigin, this.globalTransformation, this.tmpMatrix2);
	M4x4.inverseOrthonormal(this.tmpMatrix2, this.tmpMatrix3);
	M4x4.mul(this.tmpMatrix3, toOrigin, this.tmpMatrix2);
	
	return this.tmpMatrix2;
};

SceneNode.prototype.translate = function(x, y, z) {
//	this._transform =  M4x4.translate3(x,y,z, this._transform);
	this._transform = M4x4.mul(M4x4.makeTranslate3(x,y,z), this._transform);
};

SceneNode.prototype.rotate = function(angle, axis) {
	this._transform = M4x4.mul(M4x4.rotate(angle, axis, M4x4.I), this._transform);
};

SceneNode.prototype.rotateX = function(angle) {
	this._transform = M4x4.mul(M4x4.rotate(angle, V3.$(1, 0, 0), M4x4.I), this._transform);
};

SceneNode.prototype.rotateY = function(angle) {
	this._transform = M4x4.mul(M4x4.rotate(angle, V3.$(0, 1, 0), M4x4.I), this._transform);
};

SceneNode.prototype.rotateZ = function(angle) {
	this._transform = M4x4.mul(M4x4.rotate(angle, V3.$(0, 0, -1), M4x4.I), this._transform);
};

SceneNode.prototype.resetTransformation = function(){
	this.transform = M4x4.I;
}

SceneNode.prototype.yaw = SceneNode.prototype.rotateY;
SceneNode.prototype.pitch = SceneNode.prototype.rotateX;
SceneNode.prototype.roll = SceneNode.prototype.rotateZ;
   
Object.defineProperty(SceneNode.prototype, "yaw",{
	set: function(value){
		var yaw = this.getYaw();
		this.rotateY(value-yaw);
	},
	get: function(){
		return this.getYaw();
	}
});

Object.defineProperty(SceneNode.prototype, "pitch",{
	set: function(value){
		var pitch = this.getPitch();
		this.rotateX(value-pitch);
	},
	get: function(){
		return this.getPitch();
	}
});

/**
 * rotation around arbitrary vector
 */
SceneNode.prototype.rotate = function(angle, vector){
	this._transform = M4x4.mul(M4x4.rotate(angle, vector, M4x4.I), this._transform);
};

SceneNode.prototype.rotateAroundPivot = function(x, y, pivot){
	this.translate(-pivot.x, -pivot.y, -pivot.z);
	this.rotateY(x);
	this.rotate(y, this.getSideVector());
	this.translate(pivot.x, pivot.y, pivot.z);
};

SceneNode.prototype.scale = function(x, y, z) {
	this._transform = M4x4.scale3(x, y, z, this._transform);
};

/**
 * get the angle of the direction on the xz plane
 * This can be != 0, even if no yaw operation has been done. 
 * This is because if you do a pitch, you might end up looking in the other direction.
 * If this happens, the yaw increases by 180° (PI radians)
 * 
 */
SceneNode.prototype.getYaw = function(){
	var dir = this.getLocalDirection();
	dir[1] = 0;
	dir = V3.normalize(dir);
	var yaw = Math.atan2(-dir.z,dir.x) - Math.PI/2
	if(yaw < 0){
		yaw = 2*Math.PI + yaw;
	}
	return yaw;
};

/**
 * get the angle of the nodes up or down direction.
 * If do too much pitch operations, you'll end up looking in the other direction.
 * In this case, the actual pitch value becomes PI - pitch.
 * For example, calling pitch(2) will result in getPitch() = PI - 2 = 1.1415
 * 
 */
SceneNode.prototype.getPitch = function(){
	var dir = this.getLocalDirection();
	var yaw = this.getYaw();
	
	// remove yaw part
	var remYaw = M4x4.makeRotate(-yaw, [0,1,0]);
	dir = V3.transform(dir, remYaw);
	var pitch = Math.atan2(dir.y, -dir.z);
	
	return pitch;
};

Object.defineProperty(SceneNode.prototype, "pointOfView", {
	set: function(value){
		this.resetTransformation();
		this.pitch += value.pitch;
		this.yaw += value.yaw;
		this.localPosition = value.pos;
		console.log(this.yaw);
	},
	get: function(){
		var pov = {
			pos: this.localPosition,
			yaw: this.yaw,
			pitch: this.pitch
		}
	
		return pov;
	}
});



SceneNode.prototype.lookAt = function(target){
	//TODO check for correctness
	//TODO probably will not work if this sceneNodes parent transformation is !== Identity
	//TODO up-vector is always 0/1/0. check for linear independance
	
	var nPos = this.globalPosition;
	
	var dz = V3.direction(nPos, target);
	var dy = V3.$(0,1,0);
	var dx = V3.cross(dy, dz);
	dy = V3.cross(dz, dx);
	
	dx = V3.neg(dx);
	dy = V3.neg(dy);
	dz = V3.neg(dz);
	
	var lookAt = M4x4.$(
			dx.x, dx.y, dx.z, 0,
			dy.x, dy.y, dy.z, 0,
			dz.x, dz.y, dz.z, 0,
			0,	0,	0,	1);
	var translate = M4x4.makeTranslate3(nPos.x, nPos.y, nPos.z);
	
	this.transform = M4x4.mul(translate, lookAt);
};

SceneNode.prototype.render = function(camera) {
	// in unterklassen überschreiben

//	if(this.visible){
//		for ( var childname in this.children) {
//			this.children[childname].render(camera);
//		}
//	}

};

SceneNode.prototype.toString = function() {
	return this.asTreeString(0);
};

SceneNode.prototype.asTreeString = function(level) {
	var msg = " ".repeat(level * 3) + this.name + "\t" + this.globalPosition + "\n";
	for ( var child in this.children) {
		msg += this.children[child].asTreeString(level + 1);
	}

	return msg;
};
