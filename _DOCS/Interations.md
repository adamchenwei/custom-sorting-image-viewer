# 1 iteration

## feature - url params retaining sort filter params

/results page currently you can add various filters in "Sort Options" Modal.
I want the page be able to persist the sort filter params in url params so that when user refreshes the page or goes to another page and comes back, the sort filter params are still there. the persisted sort options including:

- startTime
- endTime
- weeks
- onlySameMonth
- aMonthBefore
- aMonthAfter

make sure they are same as the actual sorter params applied in the /api/sort endpoint

# 2 iteration

## feature - caching logic optimization
1. can you write up detailed note on top of the file to explain the caching logic step by step of current logic in /scripts/process-images-cli.ts file itself?

# 3 iteration

## feature - optimization logic optimization

according to the description in /Users/adamchenwei/www/custom-sorting-image-viewer/scripts/process-images-cli.ts
I want you to optimize the caching logic to make it more efficient and faster:
1. I want the image to optimize even further by another 50% smaller of the current optimized image size.
2. I want when an image is deleted in either /public/images or /public/images_optimized, it should be removed from the optimization record file. so next iteration it will have latest record correctly. since I can delete file in app. also since I mentioned the delete file in app, is it up to date in term of the file location? since it should be deleting the file from /public/images_optimized instead of /public/images.


# 4 iteration

## fix - "Skipping image processing: Image count (2) is unchanged and forceUpdate is false."
I see that when /public/images folder have 2 files, and /public/images_optimized have 0 file but previously images_optimized/ folder has 2 files generated but later generated files were deleted in the folder, it will skip the image processing even though generated files were deleted from /images_optimized folder. is there way to make sure /scripts/process-images-cli.ts properly checks the file count of /public/images_optimized folder against /public/images folder to make sure it is up to date?
Also, make sure when such discrepancy happens, it should update the optimization record file to remove the deleted files from /Users/adamchenwei/www/custom-sorting-image-viewer/public/optimization-record.json




# 5 interation 

## Feature - Planner

- page route /planner

## Design

### Data Source
Create a json file with array with content of object each fill with the data structure following instruction from /PROMPT-Monthly-Routine-Planning.md.
The file should be stored in /public/planner-data/
The file should have name format of "YYYY-MM.json"


It will be reading data from /public/planner-data/ folder's json file and display it.

The /planner page will be having following components:

- Top of page will have a configuration bar with following options:
    - Month Range (dropdown with list of months)
    - City (dropdown with list of cities): when a month range is selected, the city dropdown will be updated to only show cities that have data for that month range.
    - Time Range (dropdown with list of time ranges): when a month range is selected, the time range dropdown will be updated to only show time ranges that have data for that month range.

- Bottom of the configuration bar will have table that list out all the data in table format.

# 6th iteration
/planner page data detail should be more detailed improvements below:
in each month planner json file, it should contain more details for each day of the the month this planner is for. i.e. /Users/adamchenwei/www/custom-sorting-image-viewer/public/planner-data/2025-09.json it should contain all the days, not missing one.

# 7th iteration
now populate the planner data with more details for each day of the month this planner is for, make sure the data is real. and summarize me where you get those information from.

# 8th iteration
make sure each page in this page in the tab will show the page title instead of the app name


# 9th iteration
I want to host all the images in a folder that is made to open access to the web, so my app can access it via some kind of private and public key setup, so my computer that host this folder will be using a nodejs server and serve the files to the web, and only if the keys are legit then that url will be surving the file to the requesting app.

the machine will be a windows machine running windows 10 or 11 and nodejs 20.10.0

create an app in this project's /image-host folder so that, this image-host nodejs app will be having above described feature and server any files that is inside its /public folder? so let say if image123.jpg is served from my nodejs app, it will be access through [my-ip]/images/image123.jpg.

# 10th iteration
ok I think how I category the json as YYYY-MM.json format in /Users/adamchenwei/www/custom-sorting-image-viewer/public/planner-data/ is wrong. I want you reorg all my data so that :
for each of the "Date" property will become two: "startDate" and "endDate", if its one date in the Date field, startDate and endDate will be the same.
Time range should have instead of "startTime" and "endTime", if time is one value, startTime and endTime is the same. In term of all the files, consolidate all data into one file under YYYY.md

Also make sure the /planner page work with this new Date fromat. It may need refactor its config bar to incorporate this new date and time format.

Make sure add the similar url param functionality to /planner page as /results page.


# 11th Iteration
For /planner page, I want to add additional fields to each entry so they can be filtered differently:

add these new fields below:
- schoolDays: {
  duringBreaks: boolean,
  duringSchoolDays: boolean,
  schoolCountyName: string,
},
- everyHourOfDay: {
  // use 24 hours military time format
  0: boolean,
  1: boolean,
  2: boolean,
  3: boolean,
  4: boolean,
  5: boolean,
  6: boolean,
  7: boolean,
  8: boolean,
  9: boolean,
  10: boolean,
  11: boolean,
  12: boolean,
  13: boolean,
  14: boolean,
  15: boolean,
  16: boolean,
  17: boolean,
  18: boolean,
  19: boolean,
  20: boolean,
  21: boolean,
  22: boolean,
  23: boolean,
}

- everyWeek: {
  monday: boolean,
  tuesday: boolean,
  wednesday: boolean,
  thursday: boolean,
  friday: boolean,
  saturday: boolean,
  sunday: boolean,
},

All these fields are optional, and can be empty object {} but when multiple of them present, it should be able to filter out the data correctly by combining them all together.


# 12th iteration

I want to add a new prop for each entries of /Users/adamchenwei/www/custom-sorting-image-viewer/public/planner-data files. The new prop is "isPrivateRoute" boolean. If it is true, it means the entry is private and in the table for /planner, that row's border will be highlighted in red.
make sure add a filter for that as well after "School Schedule" filter for /planner page.


# 13 iteration

For /planner page, I want to add additional fields to each entry so they can be filtered differently:

add these new fields below:
- everyMonth: {
  1: boolean,
  2: boolean,
  3: boolean,
  4: boolean,
  5: boolean,
  6: boolean,
  7: boolean,
  8: boolean,
  9: boolean,
  10: boolean,
  11: boolean,
  12: boolean,
}
  
after that, can you help me evaluate data in /Users/adamchenwei/www/custom-sorting-image-viewer/public/planner-data files and see if there are duplicate ones that can be sorted into one entry with every week, every day, and every month is now made available? one example I can see is DuBois Park.

refactor file name from /Users/adamchenwei/www/custom-sorting-image-viewer/public/planner-data/2025.json to /Users/adamchenwei/www/custom-sorting-image-viewer/public/planner-data/surges-2025.json, also for 2026. make sure app /planner page can handle this change.

# 14 iteration
Hour of Day filter should be removed but instead a filter base on startTime
endTime should be added. and any hour of day related data should be removed from the app

# 99 iteration DO NOT DO, DO NOT DO, DO NOT DO, DO NOT DO IT YET ! (NOTE, I think it maybe better to seperate school and holiday into different data proper and filters...)



since mentioning holiday, I should for each entry in planner-data files for each year's surge json file, add a new prop called "schoolAndHoliday", it should have same data structure describing school and holiday in the /public/planner-data/holiday-and-school-days-2025.json file, they should should match with the name of the holiday in the /public/planner-data/holiday-and-school-days-2025.json file which will be used to evaluate the banners.


generate /public/planner-data/holiday-and-school-days-2025.json and /public/planner-data/holiday-and-school-days-2026.json files according to available data on the internet for 2025 and 2026 for area of Palm Beach Gardens and Jupiter FL. structure those data according to county name and date range properties which should have same approach and naming format like surges-2025.json and surges-2026.json files.

Add a special banner on top of the table for /planner page by evaluating 3 days to today's date against any holiday and school schedule. If that day is a holiday or school schedule, the banner should be displayed about the name of the holiday or school schedule. The banner should have a close button that will close the banner and not show again for 24 hours. and banner will continue to display for the next 3 days until the condition is no longer met. each condition should have its owne banner, i.e. school days, summer break, etc for its own, but holiday should be its own banner, and they will stack against each other.









