what I am doing with personal-coacing app is to have lots files and documents that would be referenced to during each conversation with a LLM agent. take a look at my root folder and you will see a list of various files here: /Users/adamchenwei/www/personal-coaching.

The app I want to build should be able to create a list of text files that is formatted in markdown and is easy to read and I can talk to the coach and get advice by it taking into account the files and documents I have in my root folder competely.

The app general setup is already exist in root folder, and it has a Clerk auth setup, and a Supabase setup already, but I did not yet add credentials.

The app should have following additional UIs:

/chat
- this page should have a chat interface with a LLM agent, each message should taking into consideration of all relevant data in the database.

/todos
- this page should have a list of todos