I want you help me build a nextjs app v14 purpose I have a large collection of images in multiple folders within a single parent folder. I want the app be able to do the following:

1. the app has access to a folder inside the root /public folder which contain large amount of image files.
2. every time when app is ran `npm run dev` or got build for production release, it will create a large json object inside a data.json file in /public folder. each object in the json is representing an image file. note that in nextjs /public is accessible in the app via "/" instead of via "/public"
   1. the image file name can be in several different formats, however all of them contain date time:
      1. they have several different formats:
               1. Screenshot_YYYYMMDD_HHMMSS.jpg
               2. YYYYMMDD_HHMMSSMSMSMS.jpeg
               3. Screenshot_YYYYMMDD-HHMMSS_*.jpg
   2. process all the images, and put in data.json, the data.json will have following format:
    ```js
      [
        {
          fileName: <string>,
          fileFormat: <string>,
          yyyy: number,
          mm: number,
          dd: number,
          hh: number,
          mm: number,
          ss: number,
          assetPath: <string>, // this path will point to the reference where the file is located in considering that all images will be included in /public folder in the project root folder. i.e. if an image named s_123.jpg is in /public/abc folder, the assetPath will be "/abc/s_123.jpg"
          fileDescription: <string>, // usually empty
          meta: {
            value: <string>,
            type: <string>,
          }
        }
      ]
    ```
3. the app will have an API route /api/images
   1. the route will output the data.json file as result when get called.
4. the app will have an API route /api/sort
   1.  sort spec UI options will be used to display only sorted image items in the imageList that match the options and output the new list as result.
5. the app will have multiple way to display the image files as a gallery UI that has a sorter modal (hidden and open with a "sort" button) in route "/results"
   1. the page when loaded will call /api/images to populate imagesList
   2. Gallery Spec for the imagesList
      1. It will have right 50% of the preview section show the actual image to fix the image with original ratio into 50% of the screen width and 100% screen height, but prioritize width.
      2. in the left 50% will be the list of filtered images got passed into the gallery so user can click on them and items in imagesList. when clicked on, the image item has assetPath, it will be use to display in the preview section using the assetPath value for the Image component for nextjs.
      3. user can navigate up and down the files list by keyboard arrow up and down as well as when list get long and exceed screen height, it will be able to scroll.
      4. when a file name is longer than the 50% of the layout, it will be wrapped as needed.
   3. sorter spec
      1. the sorter spec UI will open when a button call "sort" is clicked on
      2. the sorter spec UI will have a close button when clicked on, the modal it will be hidden
      3. the sort spec UI will have couple options as buttons
         1. date range selectors
            1. start date
            2. end date
         2. time picker
            1. start time
            2. end time
      4. the options will be passed into /api/image as a post call and included in the body of the call
         1. the options will be used to filter and sort image item by fileName, yyyy, mm, dd, hh, mm, ss