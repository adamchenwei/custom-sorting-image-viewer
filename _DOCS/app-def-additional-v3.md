# TODO
1. a mini image snapshot beside each item in the list
   1. I want to add a new functionality.
   I want to see a a mini image snapshot beside each item in the list. it should be no more than about 64px in height and width should adjust accordingly. this image should use nextjs's Image component so its optimized and load faster than the image src.
   use existing library and only if needed add new library. create new api endpoint as needed and any server services as needed. make them reusable. provide example and documentations
2. delete button
   1. https://claude.ai/chat/49a23577-92f1-4600-803b-3d87148fdd38
      1. I want to add a new functionality. a delete button on each list item. it should be align to the right of each item. it should looks like a close button symbol. use existing library to achieve it. the delete button will perform an actual delete operation on the image itself in the /public/images folder in the app. create new api endpoint as needed and any server services as needed. make them reusable. provide example and documentations
      2. the deletion only happened to the json entry. I want to also actually delete the file in the public/images folder with the file name associated

3. move button on each list item (move from /public/images to /public/images/zoomed-in) 
   1. https://claude.ai/chat/9731ef71-dbb2-4e1d-a579-01a5d5c6c1f2
      1. I want to add a new functionality. a move button on each list item. the button click will moving the image to a different directory within /public folder of the app. when click on the button, there will be a modal popup to ask user which folder under /public he want to move the image to. on the modal there will be two buttons on the bottom right. one button is submit - once user submit, a new api endpoint get called so the image will get moved to that specific folder under /public, and if the folder does not exist, the api endpoint will create it for him. 2nd button is cancel - once clicked, the modal will be closed, but it will remember the previous input path whenever the same modal get opened and triggered with any image in the list. when user press enter, the modal should submit and when press exist, the modal should close. use existing library and only if needed add new library. create new api endpoint as needed and any server services as needed. make them reusable. provide example and documentations
4. allow sorter modal to cache and preset time date
   1. https://claude.ai/chat/205d3452-df5d-4900-a41f-e41ed99ae6cd
   2. I want to add default dates for Sort Options in the modal to be today date. and start time to be now and end time to be 15 minute from now. the week will be today's week's day. the default dates only apply if there are no localstorage values already exist. help me refactor so SorterModal is in the /components folder instead of in the result page
5. new display mode allow multiple selected images overlap and need allow multiple select on the list
   1. 
