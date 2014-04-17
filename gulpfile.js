/**
 *  gulp.js to build the library
 */
var path = require('path');
var through = require('through');
var gulp = require('gulp');
var gutil = require('gulp-util');
var File = gutil.File;
var runSequence = require('run-sequence');
var es = require('event-stream');



var tap = require('gulp-tap');
var size = require('gulp-size');
var clean = require('gulp-clean');
var serve = require('gulp-serve');
var mdown = require('gulp-markdown');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var minify = require('gulp-minify-css');
var htmlreplace = require('gulp-html-replace');
var insert = require('gulp-insert');


var paths = {
	shader: [
		"./resources/shader/*",
		"./resources/shader/filteredSplats/*", 
		"./resources/shader/weightedPoints/*", 
	],
	mjs: [
		"./libs/mjs/mjs.js"
	],
	potree: [
		"./src/License.js",
		"./src/extensions/Array.js",
		"./src/extensions/mjs.js",
		"./src/extensions/String.js",
		"./src/extensions/ArrayBuffer.js",
		"./src/extensions/Float32Array.js",
		"./src/utils/utils.js",
		"./src/KeyListener.js",
		"./src/KeyCodes.js",
		"./src/MouseListener.js",
		"./src/Mouse.js",
		"./src/ResourceManager/TextureManager.js",
		"./src/ResourceManager/MaterialManager.js",
		"./src/shader/Shader.js",
		"./src/utils/Plane.js",
		"./src/utils/Frustum.js",
		"./src/rendering/Renderer.js",
		"./src/scenegraph/AABB.js",
		"./src/scenegraph/SceneNode.js",
		"./src/scenegraph/Camera.js",
		"./src/scenegraph/Scene.js",
		"./src/scenegraph/MeshNode.js",
		"./src/scenegraph/Light.js",
		"./src/scenegraph/Sphere.js",
		"./src/objects/Mesh.js",
		"./src/navigation/CamHandler.js",
		"./src/navigation/FreeFlightCamHandler.js",
		"./src/navigation/OrbitCamHandler.js",
		"./src/navigation/EarthCamHandler.js",
		"./src/Framebuffer.js",
		"./src/FramebufferFloat32.js",
		"./src/ResourceManager/ShaderManager.js",
		"./src/utils/MeshUtils.js",
		"./src/scenegraph/PointcloudOctreeSceneNode.js",
		"./src/scenegraph/PointCloudSceneNode.js",
		"./src/objects/PointCloud.js",
		"./src/objects/PointcloudOctreeNode.js",
		"./src/objects/PointcloudOctree.js",
		"./src/materials/Material.js",
		"./src/materials/WeightedPointSizeMaterial.js",
		"./src/materials/FixedPointSizeMaterial.js",
		"./src/materials/PointCloudMaterial.js",
		"./src/materials/FlatMaterial.js",
		"./src/materials/PhongMaterial.js",
		"./src/materials/FilteredSplatsMaterial.js",
		"./src/materials/GaussFillMaterial.js",
		"./src/loader/POCLoader.js",
		"./src/loader/PointAttributes.js",
		"./src/loader/PlyLoader.js",
		"./src/utils/LRU.js",
		"./src/Potree.js",
		"./build/js/shader.js",
		"./build/js/workers.js"
	]
};

/**
 * a list of workers and their dependencies
 */
var webWorkers = {
	"PlyLoaderWorker" : {
		"path" : "./src/loader/PlyLoaderWorker.js",
		"sources" : [
			"./src/loader/PointAttributes.js",
			"./src/loader/PlyLoader.js",
			"./src/loader/PlyLoaderWorker.js"
		]
	}
};

/**
 * create one file in workers build dir for each worker and it's dependencies
 */
gulp.task('prepare_workers', function pack_sources(varname, target, sources) {
	var subtasks = [];
	for(var workerName in webWorkers){
		var worker = webWorkers[workerName];
		var subtask = gulp.src(worker.sources)
		.pipe(concat(workerName))
		.pipe(size({showFiles: true}))
		.pipe(gulp.dest('build/js/workers'))
		.pipe(size({showFiles: true}))
		subtasks.push(subtask);
	}
	return es.merge.apply(null, subtasks);
});

/**
 * merge all workers in the worker build dir into a single file
 */
gulp.task('pack_workers', function pack_sources(varname, target, sources) {
	// Build examples
	var buffer = [];
	buffer.push("Potree.webWorkerSources = {");
	var firstFile = null;
	var fileName = "workers.js";
	opt = {};
	opt.newLine = gutil.linefeed;
	
	function bufferContents(file){
		if (file.isNull()) return; // ignore
		if (!firstFile) firstFile = file;
		
		var workerName = file.relative;
		var workerPath = webWorkers[workerName].path;
		
		var str = file.contents.toString('utf8');
		str = str.replace(/\\/gm, "\\\\");
		str = str.replace(/(\r\n|\n|\r)/gm,"\\n");
		str = str.replace(/"/gm, "\\\"");
		buffer.push("\"" + workerPath + "\" : \"" + str + "\",");
	}
	
	function endStream(){
		if (buffer.length === 0) return this.emit('end');
		
		var joinedContents = buffer.join(opt.newLine);
		joinedContents = joinedContents + "\n};";
		
		var joinedPath = path.join(firstFile.base, fileName);
		
		var joinedFile = new File({
			cwd: firstFile.cwd,
			base: firstFile.base,
			path: joinedPath,
			contents: new Buffer(joinedContents)
		});
		
		this.emit('data', joinedFile);
		this.emit('end');
	}

	return gulp.src("./build/js/workers/*")
		.pipe(new function (files,t) {return through(bufferContents, endStream)})
		.pipe(size({showFiles: true}))
		.pipe(gulp.dest('build/js'));
});


/**
 * modified gulp-replace
 * This task combines all shaders and saves them into shader.js
 * 
 */
pack_shader = function() {
	// Build examples
	var buffer = [];
	buffer.push("Potree.shaderSources = {");
	var firstFile = null;
	var fileName = "shader.js";
	opt = {};
	opt.newLine = gutil.linefeed;
	
	function bufferContents(file){
		if (file.isNull()) return; // ignore
		if (!firstFile) firstFile = file;
		
		var str = file.contents.toString('utf8');
		str = str.replace(/(\r\n|\n|\r)/gm,"\\n");
		buffer.push("\"" + file.relative.replace(/\\/gm, "/") + "\" : \"" + str + "\",");
	}
	
	function endStream(){
		if (buffer.length === 0) return this.emit('end');
		
		var joinedContents = buffer.join(opt.newLine);
		joinedContents = joinedContents + "\n};";
		
		var joinedPath = path.join(firstFile.base, fileName);
		
		var joinedFile = new File({
			cwd: firstFile.cwd,
			base: firstFile.base,
			path: joinedPath,
			contents: new Buffer(joinedContents)
		});
		
		this.emit('data', joinedFile);
		this.emit('end');
	}
	
	return gulp.src("./resources/shader/**/*")
		.pipe(new function (files,t) {return through(bufferContents, endStream)})
		.pipe(size({showFiles: true}))
		.pipe(gulp.dest('build/js'));
};

gulp.task('pack_shader', pack_shader);

gulp.task('scripts_mjs', function(){
	return gulp.src(paths.mjs)
			.pipe(concat('mjs.js'))
			.pipe(size({showFiles: true}))
			.pipe(gulp.dest('build/js'))
			.pipe(rename({suffix: '.min'}))
			.pipe(uglify({preserveComments: 'some', compress: false}))
			.pipe(size({showFiles: true}))
			.pipe(gulp.dest('build/js'));
})

gulp.task('scripts_potree', function() {
	return gulp.src(paths.potree)
		.pipe(concat('potree.js'))
		.pipe(insert.append('\nPotree.singleSource = true;'))
		.pipe(size({showFiles: true}))
		.pipe(gulp.dest('build/js'))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify({preserveComments: 'some'}))
		.pipe(size({showFiles: true}))
		.pipe(gulp.dest('build/js'));
});

gulp.task('scripts', function(callback){
	runSequence('pack_shader', 'prepare_workers', 'pack_workers', 'scripts_mjs', 'scripts_potree', callback);
})

gulp.task('styles', function() {
	// Copy all Stylesheets into build directory
	return gulp.src('./resources/css/*.css')
		.pipe(concat('potree.css'))
		.pipe(gulp.dest('build/css'))
		.pipe(rename({suffix: '.min'}))
		.pipe(minify())
		.pipe(gulp.dest('build/css'));
});

gulp.task('docs', function() {
	// Build documentation
	gulp.src('./docs/*.md')
		.pipe(mdown())
		.pipe(gulp.dest('build/docs'));

	gulp.src('./docs/images/*')
		.pipe(gulp.dest('build/docs/images'));
	return;
});

gulp.task('examples', function() {
	// Build examples
	var list = [];
	gulp.src('./examples/*.html')
		.pipe(tap(function (file,t) {
			var name = path.basename(file.path);
			var item = '<a href="' + name + '">' + name + '</a>';
			list.push('<li>' + item + '</li>');
		}))
		.pipe(gulp.dest('build'))
		.on('end', function () {
			gulp.src('./examples/index.tpl')
				.pipe(htmlreplace('toc', list.join(''), '<ul>%s</ul>'))
				.pipe(rename({extname: '.html'}))
				.pipe(gulp.dest('build'))
		});

	// Copy resources
	gulp.src('./resources/**/*')
		.pipe(gulp.dest('build'));
	return;
});

gulp.task('test', function() {
	// Test Javascript source files
	gulp.src(paths.mjs)
		.pipe(jshint())
		.pipe(jshint.reporter('default'));

	gulp.src(paths.potree)
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
	return;
});

gulp.task('clean', function() {
	// Clean the following directories
	return gulp.src(['build'], { read: false })
		.pipe(clean());
});

gulp.task('watch', function () {
	// Watch the following files for changes
	gulp.watch(paths.mjs, ['debug']);
	gulp.watch(paths.potree, ['debug']);
});

// Simple webserver
gulp.task('serve', serve({
	root: ['public', __dirname],
	port: 3000
}));

// called when you run `gulp` from cli
gulp.task('build', [/*'examples',*/ 'scripts', 'styles', 'docs']);
//gulp.task('debug', ['build', 'watch', 'serve'], function () {
//	gutil.log('Webserver started:', gutil.colors.cyan('http://localhost:3000'));
//});
