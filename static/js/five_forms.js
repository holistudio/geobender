let form0;
let form1;

let form0CurvePoints;
let f1;
let form1CurvePoints;
let f2;
let formCurvePoints;

let timeFraction;
let startTime = 0;
const animationLoopTime = 5;
let reverse = false;
let secondCounter = 0

let printOnce = true;
let p = 0;

let mesh, geometry;
let vertices = [];
let normals = [];

function loadPoints(table){
    let formPoints =  [];
    let curveKey = -1;
    let xCoord = -1;

    //store table/CSV to 2D array or something
    //each row

    //multiples of 68
    for(let i = 0; i<table.getRowCount(); i++){
        let row = table.getRow(i);
        
        //if xCoord changed, add a new curveKey and empty array of points
        if(xCoord != row.get(0))
        {
            // console.log(i)
            curveKey = curveKey+1;
            let curve = {id:curveKey,points:[]};
            xCoord = row.get(0);
            formPoints.push(curve);
        }

        //append latest point to formPoints at the latest curveKey
        formPoints[curveKey].points.push({x:1*row.get(0),y:1*row.get(2),z:-1*row.get(1)});

    }
    return formPoints;
}

function preload(){
    //load points from CSV files
    form0 = loadTable('static/forms/form_0.csv');
    form1 = loadTable('static/forms/form_1.csv');
}

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
    const zoom = 1.5
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
        pointLight.position.set( 1500, 1000, -3000 );
        
        scene.add( pointLight );

        const pointLightHelper = new THREE.PointLightHelper( pointLight, 5 );
        // scene.add(pointLightHelper);
    }
    
    //POINTS
    function makeSphere(position) {
        const radius = 4;
        const widthSegments = 12;
        const heightSegments = 8;
        const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        const color = 0x49ef4;
        const material = new THREE.MeshPhongMaterial({color});

        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        sphere.position.x = position.x;
        sphere.position.y = position.y;
        sphere.position.z = position.z;

        return sphere;
    }

    //SURFACES
    geometry = new THREE.BufferGeometry();
    const meshMaterial = new THREE.MeshLambertMaterial( {color: 0x32fcdb, side: THREE.DoubleSide} );

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

    let formWindowPoints =  [];
    for (let i = 0; i < 5; i++) {
        formWindowPoints.push(formCurvePoints[i]);
    }
    
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
    
    //RENDER LOOP    
    function render(time) {
        // Calculate number of seconds that have elapsed
        let seconds = (time-startTime)/1000

        // Print seconds and timeFraction every 1 second
        if (Math.floor(seconds) > secondCounter){
            console.log(seconds);
            console.log(timeFraction);
            secondCounter++;
        }

        // Determine direction of an animationLoop based on reverse boolean
        if(reverse){
            timeFraction = (animationLoopTime-seconds)/animationLoopTime;
        }
        else{
            timeFraction = seconds/animationLoopTime;
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
        

        let geoIndex=0;
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

                updateQuad(geoIndex,p1,p2,p3,p4);
                geoIndex = geoIndex + 6;
            }
        }

        // If seconds have passed animationLoopTime
        if(seconds > animationLoopTime){
            console.log('reverse!');

            // Reverse direction of animation
            reverse = !reverse;

            // Reset timer starting point
            startTime = time;
            secondCounter = 0;
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.normal.needsUpdate = true;

        renderer.render(scene, camera);
        
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function setup(){
    form0CurvePoints = loadPoints(form1);
    formCurvePoints = JSON.parse(JSON.stringify(form0CurvePoints));
    console.log(formCurvePoints.length);
    main();
}


