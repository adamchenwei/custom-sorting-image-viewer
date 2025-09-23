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

