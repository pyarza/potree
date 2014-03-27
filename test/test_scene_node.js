
var eps = 0.00001;

test("node generation", function(){
	var root = new SceneNode("root");
	var child1 = new SceneNode("child1", root);
	var child2 = new SceneNode("child2", root);
	var child11 = new SceneNode("child11", child1);
	
	ok(root.name == "root", "root name must be root");
	ok(root.parent == null, "root parent must be null");
	ok(child1.parent == root, "child1 parent must be root");
	ok(child2.parent == root, "child2 parent must be root");
	ok(child11.parent == child1, "child11 parent must be child1");
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
	node.transform = M4x4.I;
	node.translate(0,0,-1);
	node.rotateX(Math.PI/2);
	ok(V3.equal(node.localPosition, [0,1,0], eps), "node.localPosition: " + node.localPosition);
	
	// rotateY
	node.transform = M4x4.I;
	node.translate(1,0,0);
	node.rotateY(Math.PI/2);
	ok(V3.equal(node.localPosition, [0,0,-1], eps), "node.localPosition: " + node.localPosition);
	
	// rotateZ
	node.transform = M4x4.I;
	node.translate(0,1,0);
	node.rotateZ(Math.PI/2);
	ok(V3.equal(node.localPosition, [-1,0,0], eps), "node.localPosition: " + node.localPosition);
});

test("global transformations", function(){

});