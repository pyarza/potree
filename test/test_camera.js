
var eps = 0.00001;

test("centering", function(){
	var root = new SceneNode("root");
	var node = new SceneNode("node", node);
	var cam = new Camera("cam");
	var aabb = new AABB();
	
	cam.farClipPlane = 5;
	
	aabb.setDimensionByMinMax([-1, -1, -1], [1,1,1]);
	node.aabb = aabb;
	cam.zoomTo(node);
	ok(V3.equal(cam.globalPosition, [0,0,2.732], eps), "cam.globalPosition: " + cam.globalPosition);
});
