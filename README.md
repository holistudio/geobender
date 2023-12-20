# geobender
 bend geometry with your body!

 ## How this works

 1. Webcam turns on (with your permission)
 2. PoseNet detects your body parts in the webcam video feed over t = 15 seconds (numPoses / updateRate)
 3. THREEjs code generates a tunnel-like quad mesh that captures the shape of your pose now and how it changed over previous time steps within the last t = 15 seconds (i.e., sliding window of the past 15 seconds)
