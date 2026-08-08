import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    googleId: { type: String, unique: true}, // Remove required: true since local signup users won't have it
    email: {type: String, required : true, unique: true},
    password: {type: String}, // Remove required: true since Google OAuth users won't have a password
    name: {type:String},
    avatar: {type:String}
}) 

export default mongoose.model('User', userSchema)
