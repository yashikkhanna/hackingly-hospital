import app from './app.js';
import cloudinary from "cloudinary";
import bcrypt from "bcrypt";
cloudinary.v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
});

app.listen(process.env.PORT,()=>{
    console.log("running");
})
// bcrypt.hash("12345678", 10).then(console.log);