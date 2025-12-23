I am brain storming new approach to make this app more scalable, so here is the problem:

I have multiple android devices. each device will taking screenshots and store such in a specific folder in the device. I want to create an app that can continuously optimize the new image then upload it to a server which will host the image, which in turn will feed these images to a app which will be deployed to the web. the access to the image should be protected by some kind of private and public key so its server to server communication and only mentioned servers can access those images.

/Users/adamchenwei/www/custom-sorting-image-viewer is the app will be reading the images, however, currently its reading from public folder in the same app, later on I want it to load from the server encrypted instead, basically a huge refactor.

The server hosting both will be an amazing server, either EC2 or other services provided by aws. the images in total will likely be 3gb and more than 100000 images and more. so estimate the cost to access them as well when my app is loading. let say, each load will access about 10 images a time. the app will be opened about 50 times a day to read images.

Tell me what is the best approach to do this and in detail. generate a report and store in _docs/aws_images_host_approach_analysis.md