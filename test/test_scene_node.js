
var eps = 0.00001;

test("node generation", function(){
	var root = new SceneNode("root");
	var child1 = new SceneNode("child1", root);
	var child2 = new SceneNode("child2", root);
	var child11 = new SceneNode("child11", child1);
	
	ok(root.name === "root", "root name must be root");
	ok(root.parent == null, "root parent must be null");
	ok(child1.parent === root, "child1 parent must be root");
	ok(child2.parent === root, "child2 parent must be root");
	ok(child11.parent === child1, "child11 parent must be child1");
});

test("local transformations", function(){
	var node = new SceneNode("node");
	ok(V3.equal(node.localPosition, [0,0,0], eps), "node.localPosition: " + node.localPosition);
	
	// translation
	node.translate(1,2,3);
	ok(V3.equal(node.localPosition, [1,2,3], eps), "node.localPosition: " + node.localPosition);
	node.translate(1,2,3);
	ok(V3.equal(node.localPosition, [2,4,6], eps), "node.localPosition: " + node.localPosition);
	
	
	// rotateX
	node.resetTransformation();
	node.translate(0,0,-1);
	node.rotateX(Math.PI/2);
	ok(V3.equal(node.localPosition, [0,1,0], eps), "node.localPosition: " + node.localPosition);
	
	// rotateY
	node.resetTransformation();
	node.translate(1,0,0);
	node.rotateY(Math.PI/2);
	ok(V3.equal(node.localPosition, [0,0,-1], eps), "node.localPosition: " + node.localPosition);
	
	// rotateZ
	node.resetTransformation();
	node.translate(0,1,0);
	node.rotateZ(Math.PI/2);
	ok(V3.equal(node.localPosition, [1,0,0], eps), "node.localPosition: " + node.localPosition);
	
	// combined transformation
	node.resetTransformation();
	node.translate(0,0,-1);		
	ok(V3.equal(node.localPosition, [0,0,-1], eps), "node.localPosition: " + node.localPosition);
	node.rotateY(Math.PI/2);	
	ok(V3.equal(node.localPosition, [-1,0,0], eps), "node.localPosition: " + node.localPosition);
	node.rotateX(Math.PI/2);	
	ok(V3.equal(node.localPosition, [-1,0,0], eps), "node.localPosition: " + node.localPosition);
	node.rotateY(Math.PI/2);	
	ok(V3.equal(node.localPosition, [0,0,1], eps), "node.localPosition: " + node.localPosition);
	node.rotateX(Math.PI/2);	
	ok(V3.equal(node.localPosition, [0,-1,0], eps), "node.localPosition: " + node.localPosition);
	node.rotateZ(Math.PI/2);	
	ok(V3.equal(node.localPosition, [-1,0,0], eps), "node.localPosition: " + node.localPosition);
});

test("global transformations", function(){
	var world = new SceneNode("world");
	var palm = new SceneNode("palm", world);
	var coconut = new SceneNode("coconut", palm)
	
	palm.translate(10, 100, 30);
	ok(V3.equal(palm.globalPosition, [10, 100, 30], eps));
	ok(V3.equal(coconut.globalPosition, [10, 100, 30], eps));
	
	coconut.translate(1, -5, 1);
	ok(V3.equal(palm.globalPosition, [10, 100, 30], eps));
	ok(V3.equal(coconut.globalPosition, [11, 95, 31], eps));
	
});


test("euler rotations", function(){
	var cam = new SceneNode("cam");
	ok(V3.equalScalar(cam.getYaw(), 0, eps), "yaw: " + cam.getYaw());
	ok(V3.equalScalar(cam.getPitch(), 0, eps), "pitch: " + cam.getPitch());
	
	// repeatedly call yaw(1) and check if getYaw() returns the correct value
	for(var i = 0; i < 10; i++){
		cam.yaw(1);
		ok(V3.equalScalar(cam.getYaw(), (i+1) % (2*Math.PI), eps), "yaw: " + cam.getYaw());
		ok(V3.equalScalar(cam.getPitch(), 0, eps), "pitch: " + cam.getPitch());
	}
	
	// test pitch
	cam.resetTransformation();
	cam.pitch(1);
	ok(V3.equalScalar(cam.getPitch(), 1, eps), "pitch: " + cam.getPitch());
	
	// doing a pitch with value 1 two times will result in a pitch of PI -2
	// this is because the camera now points back instead of forwards.
	// this means, that yaw also changes to PI
	// 		y
	//      |
	//      |
	// ------------- -z
	//     /|
	//    / |
	//   
	cam.pitch(1);
	ok(V3.equalScalar(cam.getPitch(), Math.PI - 2, eps), "pitch: " + cam.getPitch());
	ok(V3.equalScalar(cam.getYaw(), Math.PI, eps), "pitch: " + cam.getPitch());
});

test("setPOV", function(){
	var cam = new SceneNode("cam");
	cam.setPOV(1,2,3, Math.PI/2, 0.2);
	var pov = cam.getPOV();
	ok(V3.equalScalar(pov.yaw, Math.PI/2, eps), "");
	ok(V3.equalScalar(pov.pitch, 0.2, eps), "pitch: " + cam.getPitch());
	ok(V3.equal(pov.pos, [1,2,3], eps), "");
	
	cam.setPOV(0,0,0, 0.3, -0.1);
	pov = cam.getPOV();
	ok(V3.equalScalar(pov.yaw, 0.3, eps), "");
	ok(V3.equalScalar(pov.pitch, -0.1, eps), "pitch: " + cam.getPitch());
	ok(V3.equal(pov.pos, [0,0,0], eps), "");
	
});









