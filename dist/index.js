import express from "express";
const app = express();
const port = 8080; // Define the port number
// Set the server to listen on the specified port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
