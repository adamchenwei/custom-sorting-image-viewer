# inspiration prompt
# rename group of images

These are exercise demo images. please create a data set for each image. each list item should have below format:

{
exerciseName,
exerciseInstruction,
imageName (with extension i.e. .jpg, but do not use original name, rather, rename each image according to their exercise name, but in a kabab-case format
exerciseCategory, (the category of exercise in regarding its focusing muscle or body group, i.e. back, knee, shoulder, etc)
}







# app building prompt

I use nextjs v14. I want to create an endpoint and a service, make sure abstract them, so i can take the service and use it outside of nextjs.


ui page /bulk-rename-image BEG
page content:

Page Title: Bulk Rename Images

A text area to define the AI instruction (aiInstructionText) on how to rename the images:

A file drop zone to upload images:
  - accept all image formats
  - display previews of the images selected
  - do not actually upload the image but only show preview so user knows what images are getting uploaded
A Submit button
  -  when submitted:
    - show loading state while processing
    - show loading state while uploading
    - show error state if upload fails
    - show success state if upload is successful
    - it will call /api/bulk-rename-image endpoint and pass the images and aiInstructionText for anaylsis
  - when completed:
  - show list of uploaded images as a summary when finished upload and AI renaming
  - the ai renamed images wil be stored in the public/images/renamed/chat-id folder 
  - the ai renamed images will be listed in the summary
  - the summary will be displayed in a table with columns:
    - original filename
    - new filename
    - status

ui page /bulk-rename-image END


end point /api/bulk-rename-image BEG
input
  - images: array of image file objects
  - aiInstructionText: string

output
  - generate a chatId according to the general context of aiInstructionText and append the now timestamp at the end to make sure such chatId when name as a folder, the name is unique
  - status: string
  - summary: array of objects with original filename, new filename, and status
  - chatId: string
  - perform generation of new images in the public/images/renamed/{chatId} folder

end point /api/bulk-rename-image END
