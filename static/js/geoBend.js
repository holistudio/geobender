// Variables for controlling when mesh geometry is generated and how often it is updated
let startTime = 0; // seconds from which to start recording poses and update geometry
let updateTime = 0; // stores the next time the geometry needs to be updated

// Variables for controlling where the geometry is generated in the scene and how big it is
const origin = {y: -500, z: -1000}; // local origin of the generated geometry from poses
const scale = 10; // scale up pose key points x-y coordinates in the webcam video's frame of reference

// Variables for storing the geometry to show in the scene
let poseCurvesSet =  []; // stores all poses as curves for forming the 3D mesh geometry
let formWindowComplete = false; // checks if enough poses have been detected to form the 3D mesh geometry
let curveID = 0; // tracks how many poses have been detected over the entire time

// PoseNet required variables
let video;
let poseNet;
let poses = [];

// THREEJS required variables
let mesh, geometry;
let vertices = [];
let normals = [];

function main() {

    // THREEJS RENDERER
    const canvas = document.querySelector('#c'); //make sure canvas is defined before this script
    const renderer = new THREE.WebGLRenderer({canvas}); //sets renderer's DOM element
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    renderer.setClearColor(0xFFFFFF);

    // THREEJS CAMERA
    const fov = 40;
    const aspect = 2;  // the canvas default
    const near = 1;
    const far = 10000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    
    const lookAt = [1053,800,-300]; // the XYZ coordinates of the point the camera is looking at (NOT the camera's direction vector)
    // const lookAt = [1053,-2,-660]

    const camDirVector = [0.67236, 0.694525, 0.25606]; // the direction the camera is pointing towards (camera's direction vector)
    const zoom = 0.5; // zoom factor, basically moves the camera closer if zoom value is larger
    const distance = 500 / zoom; // set the distance relative to the "default" distance of 500 units, based on the zoom value
    
    // set the camera's position based on the lookAt point, camera direction, and distance away from the lookAt point
    camera.position.set(lookAt[0]+ distance * camDirVector[0], 
        lookAt[1] + distance * camDirVector[1], 
        lookAt[2] + distance * camDirVector[2]); 

    // set the camera's lookAt point
    camera.lookAt(lookAt[0],lookAt[1],lookAt[2]);

    // THREEJS SCENE
    const scene = new THREE.Scene();

    // THREEJS LIGHTS
    {
        // white directional light
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        
        light.position.set(-1000,1000,1000);
        scene.add(light);

        // const helper = new THREE.DirectionalLightHelper( light, 5 );

        // blue point light for two-color gradient effect
        const pointLight = new THREE.PointLight(0x0000FF, 0.5, 0 );
        // pointLight.position.set( 1500, -1000, -3000 );
        pointLight.position.set(1053,1000,0);
        scene.add( pointLight );

        // const pointLightHelper = new THREE.PointLightHelper( pointLight, 5 );
        // scene.add(pointLightHelper);
    }

    // THREEJS SURFACES

    // blank geometry buffer
    geometry = new THREE.BufferGeometry();

    // mesh material
    const meshMaterial = new THREE.MeshLambertMaterial( {color: 0x32fcdb, side: THREE.DoubleSide} );

    //canvas' "external resolution" / size on the webpage is set by CSS
    //this function sets the canvas' "internal resolution"
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false); //sets size of renderer / canvas' drawingbuffer size / canvas's "internal resolution"
                                            //IMPORTANT: false tells setSize() to set the internal resolution and NOT CSS
        }
        return needResize; //used for updating other thing if canvas is resized
    }

    // This function makes the quad mesh the first time around 
    // before the preset number of poses are loaded/detected (numCurves)
    function makeQuad(p1,p2,p3,p4) {
        // create a simple square shape. We duplicate the top left and bottom right
        // vertices because each vertex needs to appear once per triangle.
        vertices.push(p1.x, p1.y, p1.z);
        vertices.push(p3.x, p3.y, p3.z);
        vertices.push(p2.x, p2.y, p2.z);
        vertices.push(p3.x, p3.y, p3.z);
        vertices.push(p1.x, p1.y, p1.z);
        vertices.push(p4.x, p4.y, p4.z);
    
        // Calculate normal vectors for each triangle vertex
        // A = [a1, a2, a3] and B = [b1, b2, b3] 
        const a1 = p2.x - p1.x;
        const a2 = p2.y - p1.y;
        const a3 = p2.z - p1.z;
    
        const b1 = p2.x - p3.x;
        const b2 = p2.y - p3.y;
        const b3 = p2.z - p3.z;
    
        const crossAB = {x:a2 * b3 - a3 * b2, y:a3 * b1 - a1 * b3, z:a1 * b2 - a2 * b1};
        
        // push normal vectors to list of normal vectors
        normals.push(crossAB.x, crossAB.y, crossAB.z);
        normals.push(crossAB.x, crossAB.y, crossAB.z);
        normals.push(crossAB.x, crossAB.y, crossAB.z);
        normals.push(crossAB.x, crossAB.y, crossAB.z);
        normals.push(crossAB.x, crossAB.y, crossAB.z);
        normals.push(crossAB.x, crossAB.y, crossAB.z);
    }
    
    // This function modifies the existing quad mesh already displayed
    // after the preset number of poses are loaded/detected (numCurves)
    function updateQuad(i,p1,p2,p3,p4) {
        const position = geometry.attributes.position;
        const dir = geometry.attributes.normal;
        // create a simple square shape. We duplicate the top left and bottom right
        // vertices because each vertex needs to appear once per triangle.
    
        position.setX(i, p1.x);
        position.setY(i, p1.y);
        position.setZ(i, p1.z);
    
        position.setX(i+1, p3.x);
        position.setY(i+1, p3.y);
        position.setZ(i+1, p3.z);
    
        position.setX(i+2, p2.x);
        position.setY(i+2, p2.y);
        position.setZ(i+2, p2.z);
    
        position.setX(i+3, p3.x);
        position.setY(i+3, p3.y);
        position.setZ(i+3, p3.z);
    
        position.setX(i+4, p1.x);
        position.setY(i+4, p1.y);
        position.setZ(i+4, p1.z);
        
        position.setX(i+5, p4.x);
        position.setY(i+5, p4.y);
        position.setZ(i+5, p4.z);
    
        // Calculate normal vectors for each triangle vertex
        // A = [a1, a2, a3] and B = [b1, b2, b3] 
        const a1 = p2.x - p1.x;
        const a2 = p2.y - p1.y;
        const a3 = p2.z - p1.z;
    
        const b1 = p2.x - p3.x;
        const b2 = p2.y - p3.y;
        const b3 = p2.z - p3.z;
    
        const crossAB = {x:a2 * b3 - a3 * b2, y:a3 * b1 - a1 * b3, z:a1 * b2 - a2 * b1};
    
        dir.setX(i, crossAB.x);
        dir.setY(i, crossAB.y);
        dir.setZ(i, crossAB.z);
    
        dir.setX(i+1, crossAB.x);
        dir.setY(i+1, crossAB.y);
        dir.setZ(i+1, crossAB.z);
    
        dir.setX(i+2, crossAB.x);
        dir.setY(i+2, crossAB.y);
        dir.setZ(i+2, crossAB.z);
    
        dir.setX(i+3, crossAB.x);
        dir.setY(i+3, crossAB.y);
        dir.setZ(i+3, crossAB.z);
    
        dir.setX(i+4, crossAB.x);
        dir.setY(i+4, crossAB.y);
        dir.setZ(i+4, crossAB.z);
    
        dir.setX(i+5, crossAB.x);
        dir.setY(i+5, crossAB.y);
        dir.setZ(i+5, crossAB.z);
    }

    // This function loads a pose detected by PoseNet
    // as curve points
    function loadPose(){
        let curve = {id:curveID, points:[]};

        let pose = poses[0].pose;

        // left hip
        curve.points.push({y:scale*(height - pose.leftHip.y) + origin.y, z:scale*pose.leftHip.x + origin.z});

        // left shoulder
        curve.points.push({y:scale*(height - pose.leftShoulder.y) + origin.y, z:scale*pose.leftShoulder.x + origin.z});

        // left elbow
        curve.points.push({y:scale*(height - pose.leftElbow.y) + origin.y, z:scale*pose.leftElbow.x + origin.z});

        // left wrist
        curve.points.push({y:scale*(height - pose.leftWrist.y) + origin.y, z:scale*pose.leftWrist.x + origin.z});

        // left ear
        curve.points.push({y:scale*(height - pose.leftEar.y) + origin.y, z:scale*pose.leftEar.x + origin.z});

        // nose
        curve.points.push({y:scale*(height - pose.nose.y) + origin.y, z:scale*pose.nose.x + origin.z});

        // right ear
        curve.points.push({y:scale*(height - pose.rightEar.y) + origin.y, z:scale*pose.rightEar.x + origin.z});

        // right wrist
        curve.points.push({y:scale*(height - pose.rightWrist.y) + origin.y, z:scale*pose.rightWrist.x + origin.z});

        // right elbow
        curve.points.push({y:scale*(height - pose.rightElbow.y) + origin.y, z:scale*pose.rightElbow.x + origin.z});

        //right shoulder
        curve.points.push({y:scale*(height - pose.rightShoulder.y) + origin.y, z:scale*pose.rightShoulder.x + origin.z});

        // right hip
        curve.points.push({y:scale*(height - pose.rightHip.y) + origin.y, z:scale*pose.rightHip.x + origin.z});

        curveID++;
        return curve;
    }

    // THREEJS Render Loop
    function render(time){
        // Calculate time that has elapsed in units of seconds
        let seconds = (time-startTime)/1000

        // At the update rate (Hz), load a new pose as a new curve
        // and pop the oldest pose/curve off/out of the the mesh
        if (Math.floor(seconds) > updateTime){
            console.log(seconds);
            updateTime += 0.5;

            if(typeof poses[0] != 'undefined'){
                // Load a pose from PoseNet as a curve
                let newCurve = loadPose();

                // Push new curve to poseCurvesSet
                poseCurvesSet.push(newCurve);

                while (poseCurvesSet.length > numCurves){

                    // Pop first rendered curve
                    poseCurvesSet.shift();

                }
            }
        }

        // check if renderer resolution needs to change based on canvas/window size
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        // update camera aspect ratio to the canvas' aspect ratio
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();

        // bool formWindowComplete is true if enough poses have been detected to form a mesh with enough curves (numCurves)

        // if not enough poses have been detected
        if(!formWindowComplete){
            // check if enough poses have been detected
            if (poseCurvesSet.length == numCurves){

                // Make quad mesh between each pose/curve in the poseCurvesSet (i.e. linear lofting of curves)
                for (let i = 0; i < poseCurvesSet.length-1; i++) {

                    const curve0 = poseCurvesSet[i];
                    const curve1 = poseCurvesSet[i+1];
                    
                    for (let j = 0; j < curve0.points.length; j++) {
                        let p1,p2,p3,p4;
                        if(j==curve0.points.length-1){
                            p1 = curve0.points[j];
                            p2 = curve1.points[j];
                            p3 = curve1.points[0];
                            p4 = curve0.points[0];
                        }
                        else{
                            p1 = curve0.points[j];
                            p2 = curve1.points[j];
                            p3 = curve1.points[j+1];
                            p4 = curve0.points[j+1];
                        }
                        makeQuad(p1,p2,p3,p4);
                    }
                }

                // itemSize = 3 because there are 3 values (components) per vertex
                geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
                geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
                
                // create the mesh with that geometry
                mesh = new THREE.Mesh( geometry, meshMaterial );

                // add mesh to scene
                scene.add(mesh);

                // set formWindowComplete to true so that none of this code runs ever again
                formWindowComplete = true;
            }
            // otherwise do nothing
        }
        else{
            // if enough poses have been detected, 
            // then the mesh is updated, not created/added to the scene

            let geoIndex=0; // index for tracking which quad on the mesh needs to be updated

            for (let i = 0; i < poseCurvesSet.length-1; i++) {
                const curve0 = poseCurvesSet[i];
                const curve1 = poseCurvesSet[i+1];

                const curve0X = curveXCoordinates[i];
                const curve1X = curveXCoordinates[i+1];

                for (let j = 0; j < curve0.points.length; j++) {
                    let p1,p2,p3,p4;
                    if(j==curve0.points.length-1){
                        p1 = curve0.points[j];
                        p2 = curve1.points[j];
                        p3 = curve1.points[0];
                        p4 = curve0.points[0];
                    }
                    else{
                        p1 = curve0.points[j];
                        p2 = curve1.points[j];
                        p3 = curve1.points[j+1];
                        p4 = curve0.points[j+1];
                    }

                    // update y- and z-coordinates based on the pose, 
                    // keep x-coordinate unchanged
                    p1 = {x: curve0X, y: p1.y, z: p1.z}; 
                    p2 = {x: curve1X, y: p2.y, z: p2.z};
                    p3 = {x: curve1X, y: p3.y, z: p3.z};
                    p4 = {x: curve0X, y: p4.y, z: p4.z};

                    updateQuad(geoIndex,p1,p2,p3,p4);

                    geoIndex = geoIndex + 6; // increment quad index by 6
                }
            }

            // tell THREEJS the geometry needs to be updated
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.normal.needsUpdate = true;
        }

        // render scene
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render); //TODO: Undedrstand why this requestAnimationFrame(render) shows up twice

    

}

// p5js setup function (runs only once)
function setup(){
    // start the webcam feed
    video = createCapture(VIDEO);

    // set video size to the width and height of the canvas
    video.size(width, height);

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video);

    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected
    poseNet.on('pose', function(results) {
        poses = results;
    });

    // Hide the video element, and just show the canvas
    // video.hide();

    // Run the main function (THREEjs code using the PoseNet detection data)
    main();
}