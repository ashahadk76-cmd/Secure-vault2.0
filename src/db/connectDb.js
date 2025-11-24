// import mongoose from "mongoose";

// const connectDB = async ()=>{
//     try {
//         const conn = await mongoose.connect(process.env.MONGO_URI);
//     } catch (error) {
//         // console.log(error.message)
//         process.exit(1)
//     }
// }
// export default connectDB;


import mongoose from "mongoose";

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "securevault",
        });
        console.log("MongoDB connected");
    } catch (error) {
        console.error("DB CONNECTION ERROR:", error.message);
        // ❌ NEVER USE process.exit() in serverless
    }
};

export default connectDB;
