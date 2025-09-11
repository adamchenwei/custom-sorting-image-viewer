I see /public/images and /public/imsages_optimized, and optimized images are generated when I run `npm run process-images` so I want the process to be super optimized by adding couple more steps into the optimizations:

as you can see there are already existing files with same file name but different file extensions after optimization, so I want whenever a file is optimized, add this key value pair into file name to be cached in a file inside public/optimization-record.json, it has an object of  key value pairs as {
[key:file name]: {value: originalFileSize:  number (in kbs), optimizedFileSize: number (in kbs), originalFileExtension: string, optimizedFileExtension:string,}
}, i.e.

{
// this is demo object shows the original file of 20240921_140314925.jepg optimized into 20240921_140314925.webp
 20240921_140314925: {
...,
originalFileExtension: 'jpeg',
optimizedFileExtension: 'webp',
...
}
}

since the existing files are optimized but missing these records, generate them now, and later on, additional values will be just added to the existing records at the end of the processing. processing will be skipped for the existing files by checking the file name as key in public/optimization-record.json file and this file object will be loaded before processing starts.  processing will also be skipped if the count of optimized files are the same as the count of original files the elligable to be optimized.


also, lets say, when I deleted some of the original images, then the key with that specific file name will never getting looked at anymore inside /Users/adamchenwei/www/custom-sorting-image-viewer/public/optimization-record.json, I want when image processing, add algorithm so that if any keys never been looked at throughout the optimization process, let user knows but output a list of those image names in the console. but do not delete it. however, add a script and a comand of `npm run image:clean-up-optimization-cache` so when I run this command, it will purge all these file object key value pairs from the /Users/adamchenwei/www/custom-sorting-image-viewer/public/optimization-record.json file.