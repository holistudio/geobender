let startTime = 0;
let secondCounter = 0;

let mesh, geometry;
let vertices = [];
let normals = [];


const numCurves = 30;
const curveSpacing = 30
let curveXCoordinates = [];
for (let i = 0; i < numCurves; i++) {
    curveXCoordinates.push(curveSpacing*i-50);
}

const origin = {y: -500, z: -1000}; //-10
const scale = 10;
let formWindowPoints =  [];
let curveKey = 0;
let formWindowComplete = false;

let video;
let poseNet;
let poses = [];



function main() {
    //RENDERER
    const canvas = document.querySelector('#c'); //make sure canvas is defined before this script
    const renderer = new THREE.WebGLRenderer({canvas}); //sets renderer's DOM element
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    renderer.setClearColor(0xFFFFFF);

    //CAMERA
    const fov = 40;
    const aspect = 2;  // the canvas default
    const near = 1;
    const far = 10000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // const lookAt = [1053,-2,-660]
    const lookAt = [1053,800,-300]
    const lookUnitVector = [0.67236, 0.694525, 0.25606]
    const zoom = 0.5
    const distance = 500 / zoom
    
    // camera.position.set(3965, 3006, 449); 
    camera.position.set(lookAt[0]+ distance * lookUnitVector[0], 
        lookAt[1] + distance * lookUnitVector[1], 
        lookAt[2] + distance * lookUnitVector[2]); 
    // camera.position.set(3808, 3007, 548);
    // camera.lookAt(zoom * lookUnitVector[0], zoom * lookUnitVector[1], zoom * lookUnitVector[2]);
    camera.lookAt(lookAt[0],lookAt[1],lookAt[2]);
    
    //SCENE
    const scene = new THREE.Scene();

    //LIGHTS
    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        
        light.position.set(-1000,1000,1000);
        scene.add(light);

        const helper = new THREE.DirectionalLightHelper( light, 5 );

        const pointLight = new THREE.PointLight(0x0000FF, 0.5, 0 );
        // pointLight.position.set( 1500, -1000, -3000 );
        pointLight.position.set(1053,1000,0);
        scene.add( pointLight );

        // const pointLightHelper = new THREE.PointLightHelper( pointLight, 5 );
        // scene.add(pointLightHelper);
    }

    //SURFACES
    geometry = new THREE.BufferGeometry();
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
        
        normals.push(crossAB.x, crossAB.y, crossAB.z);
        normals.push(crossAB.x, crossAB.y, crossAB.z);
        normals.push(crossAB.x, crossAB.y, crossAB.z);
        normals.push(crossAB.x, crossAB.y, crossAB.z);
        normals.push(crossAB.x, crossAB.y, crossAB.z);
        normals.push(crossAB.x, crossAB.y, crossAB.z);
    }
    
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

    function loadPose(){
        let curve = {id:curveKey, points:[]};

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

        curveKey++;
        return curve;
    }

    function render(time){
        // Calculate number of seconds that have elapsed
        let seconds = (time-startTime)/1000

        // Print seconds every 1 second
        if (Math.floor(seconds) > secondCounter){
            console.log(seconds);
            secondCounter+= 0.5;

            if(typeof poses[0] != 'undefined'){
                // Load a pose from PoseNet as a curve
                let newCurve = loadPose();

                // Push new curve to formWindowPoints
                formWindowPoints.push(newCurve);

                while (formWindowPoints.length > numCurves){

                    // Pop first rendered curve
                    formWindowPoints.shift();

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

        if(!formWindowComplete){
            if (formWindowPoints.length == numCurves){
                for (let i = 0; i < formWindowPoints.length-1; i++) {
                    const curve0 = formWindowPoints[i];
                    const curve1 = formWindowPoints[i+1];
                    
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
                
                mesh = new THREE.Mesh( geometry, meshMaterial );
                scene.add(mesh);
    
                formWindowComplete = true;
            }
        }
        else{
            let geoIndex=0;
            for (let i = 0; i < formWindowPoints.length-1; i++) {
                const curve0 = formWindowPoints[i];
                const curve1 = formWindowPoints[i+1];

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

                    p1 = {x: curve0X, y: p1.y, z: p1.z};
                    p2 = {x: curve1X, y: p2.y, z: p2.z};
                    p3 = {x: curve1X, y: p3.y, z: p3.z};
                    p4 = {x: curve0X, y: p4.y, z: p4.z};

                    updateQuad(geoIndex,p1,p2,p3,p4);
                    geoIndex = geoIndex + 6;
                }
            }
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.normal.needsUpdate = true;
        }
        renderer.render(scene, camera);
        
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    

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
    video.hide();

    // Run the main function (THREEjs code using the poseNet detection data)
    main();
}