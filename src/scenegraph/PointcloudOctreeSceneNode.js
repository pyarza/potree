

/**
 * 
 * @param name
 * @param mno
 * @param parent
 * @class
 * @augments SceneNode
 */
function PointcloudOctreeSceneNode(mno, parent){
	SceneNode.call(this, name, parent);
	this.mno = mno;
	
}

PointcloudOctreeSceneNode.prototype = new SceneNode(inheriting);
PointcloudOctreeSceneNode.base = SceneNode.prototype;

PointcloudOctreeSceneNode.prototype.render = function(renderer) {

	if(this.mno == null){
		return;
	}
	if(!this.visible){
		return;
	}

	this.mno.render(this, renderer);
};

PointcloudOctreeSceneNode.prototype.addTime = function addTime(time){
	this.age += time;
	
	this.mno.addTime(time);
};

Object.defineProperty(PointcloudOctreeSceneNode.prototype, "minDepth", {
	get: function(){
		return this.mno.minDepth;
	},
	set: function(value){
		this.mno.minDepth = value;
	}
});

Object.defineProperty(PointcloudOctreeSceneNode.prototype, "aabb", {
	get: function(){ 
		var aabb = this.mno.rootNode.aabb;
		aabb.setTransform(this.globalTransformation);
		return aabb;
	}
});