import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import {User} from "../models/userSchema.js"
import {generateToken} from "../utils/jwtToken.js";
import cloudinary from "cloudinary";
import mongoose from "mongoose"; 
export const patientRegister= catchAsyncErrors(async (req,res,next)=>{
    const {
        firstName,
        lastName,
        email,
        phone,
        password,
        gender,
        dob,
        nic,
        role,
    }=req.body;
    if(
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !password ||
        !gender ||
        !dob ||
        !nic ||
        !role 
    ){
        return next(new ErrorHandler("Please Fill Full Form!",400));
    }
    let user=await User.findOne({email});
    if(user){
        return  next(new ErrorHandler("User Already Registered!",400));
    }
    user=await User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
        gender,
        dob,
        nic,
        role,
    });
    generateToken(user,"User Registered!",200,res);
});

export const login=catchAsyncErrors( async(req,res,next)=>{
    const { email,password,role }=req.body;
    if(!email || !password ||    !role){
        return next(new ErrorHandler("Please Provide All Details!",400));
    }
    // if(password!=confirmPassword){
    //     return next(new ErrorHandler("Password And Confirm Password Do Not Match!",400))
    // }
    const user=await User.findOne({email}).select("+password");
    if(!user){
        
        console.log("Connected DB:", mongoose.connection.name);
        console.log("Email from req:", email);
        console.log("Role from req:", role);
        const user = await User.findOne({ email, role });
        console.log("User found:", user);
        return next(new ErrorHandler("Invalid password Or Email!",400));
    }
    const isPasswordMatched=await user.comparePassword(password);
    if(!isPasswordMatched){
        
        return next(new ErrorHandler("Invalid password Or Email!",400));
    }
    if(role!==user.role){
        return next(new ErrorHandler("User With This Role Not Found!",400));
    }
    generateToken(user,"User Login Successful!",200,res);
});
export const addNewAdmin=catchAsyncErrors(async (req,res,next)=>{
    const {
        firstName,
        lastName,
        email,
        phone,
        password,
        gender,
        dob,
        nic
    }=req.body;
    if(
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !password ||
        !gender ||
        !dob ||
        !nic
    ){
        return next(new ErrorHandler("Please Fill Full Form!",400));
    }
     const isRegistered= await User.findOne({email});
     if(isRegistered){
        return next(new ErrorHandler(`${isRegistered.role} With This Email Already Exist!`));
     }
     const admin= await User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
        gender,
        dob,
        nic,
        role:"Admin",
     });
     res.status(200).json({
        success:true,
        message:"New Admin Registered!",
     });
});

export const getAllDoctors= catchAsyncErrors(async(req,res,next)=>{
    const doctors=await User.find({role:"Doctor"});
    res.status(200).json({
        success:true,
        doctors
    })
})
export const getUserDetails=catchAsyncErrors(async (req,res,next)=>{
    const user= req.user;
    res.status(200).json({
        success:true,
        user,
    })
});

export const logoutAdmin=catchAsyncErrors(async (req,res,next)=>{
    res.status(200)
    .cookie("adminToken","",{
        httpOnly:true,
        expires:new Date(Date.now()),
    })
    .json({
        success:true,
        messsage:"Admin Logged Out Successfully!",
    });
});
export const logoutDoctor=catchAsyncErrors(async (req,res,next)=>{
    res.status(200)
    .cookie("doctorToken","",{
        httpOnly:true,
        expires:new Date(Date.now()),
    })
    .json({
        success:true,
        messsage:"Doctor Logged Out Successfully!",
    });
});
export const logoutPatient=catchAsyncErrors(async (req,res,next)=>{
    res.status(200)
    .cookie("patientToken","",{
        httpOnly:true,
        expires:new Date(Date.now()),
    })
    .json({
        success:true,
        messsage:"Patient Logged Out Successfully!",
    });
});

export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Doctor Avatar Required!", 400));
  }

  const { docAvatar } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(docAvatar.mimetype)) {
    return next(new ErrorHandler("File Format Not Supported!", 400));
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    doctorDepartment,
    consultationFee,
    clinicAddress,
    qualifications,
    experienceYears,
    availability
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !nic ||
    !dob ||
    !gender ||
    !password ||
    !doctorDepartment ||
    !consultationFee ||
    !clinicAddress
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler("Doctor With This Email Already Exists!", 400));
  }

  const cloudinaryResponse = await cloudinary.uploader.upload(docAvatar.tempFilePath);
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error("Cloudinary Error:", cloudinaryResponse.error || "Unknown Cloudinary error");
    return next(new ErrorHandler("Failed To Upload Doctor Avatar To Cloudinary", 500));
  }

  const doctor = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    role: "Doctor",
    doctorDepartment,
    consultationFee,
    clinicAddress,
    qualifications: Array.isArray(qualifications) ? qualifications : qualifications?.split(",").map(q => q.trim()),
    experienceYears,
    availability: availability ? JSON.parse(availability) : [],
    docAvatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });

  res.status(200).json({
    success: true,
    message: "New Doctor Registered",
    doctor,
  });
});
