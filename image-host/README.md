# Image Host Server

This is a simple Node.js server to host and serve images from the `public` folder. Access to the images is protected by an API key.

## Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment Variables:**

    Create a `.env` file in the `image-host` directory and add the following:

    ```
    API_KEY=your-secret-api-key
    PORT=3000
    ```

    Replace `your-secret-api-key` with a secure, randomly generated key.

3.  **Add Images:**

    Place the images you want to serve into the `public` directory.

## Running the Server

To start the server, run:

```bash
npm start
```

The server will start on the port specified in your `.env` file (default is 3000).

## Usage

To access an image, make a GET request to the following URL:

`http://[your-ip]:[PORT]/images/[image-name]`

You must include the API key in the `x-api-key` header of your request.

**Example using curl:**

```bash
curl -H "x-api-key: your-secret-api-key" http://localhost:3000/images/my-image.jpg
```
