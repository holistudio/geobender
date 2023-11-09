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
    
    camera.position.set(3965, 3006, 449);
    // camera.position.set(3808, 3007, 548);
    camera.lookAt(1053,-2,-660);
    

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
        const pointLightHelper = new THREE.PointLightHelper( pointLight, 5 );
        scene.add( pointLight );
        // scene.add( pointLightHelper );
    }
    

    //SURFACES
    geometry = new THREE.BufferGeometry();
    const meshMaterial = new THREE.MeshLambertMaterial( {color: 0x32fcdb, side: THREE.DoubleSide} );

    
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
        
        // Determe direction of an animationLoop based on reverse boolean
        if(reverse){
            timeFraction = (animationLoopTime-seconds)/animationLoopTime;
        }
        else{
            timeFraction = (seconds)/animationLoopTime;
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

        renderer.render(scene, camera);
        
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function setup(){
    form0CurvePoints = loadPoints(form1);
    formCurvePoints = JSON.parse(JSON.stringify(form0CurvePoints));
    // console.log(formCurvePoints.length);
    main();
}


