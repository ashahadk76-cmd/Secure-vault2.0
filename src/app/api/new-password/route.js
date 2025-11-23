// import securepass from "@/model/securepass";
// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import CryptoJS from "crypto-js";
// import connectDB from "@/db/connectDb";

// export async function POST(req) {
//     try {
//         await connectDB();
//         const session = await getServerSession();
//         const body = await req.json();
//         if (!session) {
//             return NextResponse.json({
//                 success: false,
//                 error: true,
//                 message: "PLEASE LOGIN TO CONTINUE"
//             })
//         }

//         const { title, username, email, password } = body;

//         if (!email || !password) {
//             return NextResponse.json({
//                 success: false,
//                 error: true,
//                 message: "EMAIL AND PASSWORD ARE REQUIRED"
//             })
//         }

//         const secretkey = process.env.NEXT_SECRET_KEY;
//         console.log("SECRET KEY", secretkey);
//         const encryptedpassword = CryptoJS.AES.encrypt(password, secretkey).toString();


//         const newPass = await securepass.create({
//             userID: session.user.email,
//             title,
//             username,
//             email,
//             password: encryptedpassword,
//         })

//         return NextResponse.json({
//             success: true,
//             error: false,
//             message: "PASSWORD SUCCESSFULLY ADDED AND YOU CAN SEE ON THE PASSWORD PAGE",
//             newPass
//         })

//     } catch (error) {
//         console.log("ERROR IN ADDING NEW PASSWORD", error);
//         // console.error(error)
//         return NextResponse.json({
//             success: false,
//             error: true,
//             message: "SOME ERROR OCCURED WHILE ADDING NEW PASSWORD"
//         })
//     }
// }



// //  GET REQUEST


// export async function GET(req) {
//     try {
//         await connectDB();
//         const session = await getServerSession();
//         if (!session || !session.user?.email) {
//             return NextResponse.json({
//                 success: false,
//                 error: "unauthorized",
//             }, { status: 401 })
//         }

//         const secretkey = process.env.NEXT_SECRET_KEY;
//         const passwords = await securepass.find({ userID: session.user.email }).sort({ createdAt: -1 }).lean();

//         const decryptedpasswords = passwords.map((item) => {
//             const bytes = CryptoJS.AES.decrypt(item.password, secretkey);
//             const decryptedpassword = bytes.toString(CryptoJS.enc.Utf8);
//             return {
//                 ...item,
//                 password: decryptedpassword
//             }
//         });
//         return NextResponse.json({
//             success: true,
//             passwords: decryptedpasswords,
//         })

//     } catch (error) {
//         console.log("ERROR IN GETTING PASSWORDS", error);
//         return NextResponse.json({
//             success: false,
//             error: true,
//         }, { status: 500 })
//     }
// }


import securepass from "@/model/securepass";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import CryptoJS from "crypto-js";
import connectDB from "@/db/connectDb";

export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession();
        const body = await req.json();
        
        if (!session) {
            return NextResponse.json({
                success: false,
                error: true,
                message: "PLEASE LOGIN TO CONTINUE"
            }, { status: 401 })
        }

        const { title, username, email, password } = body;

        if (!email || !password) {
            return NextResponse.json({
                success: false,
                error: true,
                message: "EMAIL AND PASSWORD ARE REQUIRED"
            }, { status: 400 })
        }

        const secretkey = process.env.NEXT_SECRET_KEY;
        
        // Secret key check karo
        if (!secretkey) {
            console.error("NEXT_SECRET_KEY missing in environment variables");
            return NextResponse.json({
                success: false,
                error: true,
                message: "Server configuration error"
            }, { status: 500 })
        }

        const encryptedpassword = CryptoJS.AES.encrypt(password, secretkey).toString();

        const newPass = await securepass.create({
            userID: session.user.email,
            title: title || "",
            username: username || "",
            email,
            password: encryptedpassword,
        })

        return NextResponse.json({
            success: true,
            error: false,
            message: "PASSWORD SUCCESSFULLY ADDED AND YOU CAN SEE ON THE PASSWORD PAGE",
            newPass
        }, { status: 201 })

    } catch (error) {
        console.log("ERROR IN ADDING NEW PASSWORD", error);
        return NextResponse.json({
            success: false,
            error: true,
            message: error.message || "SOME ERROR OCCURED WHILE ADDING NEW PASSWORD"
        }, { status: 500 })
    }
}

// GET REQUEST
export async function GET(req) {
    try {
        await connectDB();
        const session = await getServerSession();
        
        if (!session || !session.user?.email) {
            return NextResponse.json({
                success: false,
                error: "unauthorized",
            }, { status: 401 })
        }

        const secretkey = process.env.NEXT_SECRET_KEY;
        
        // Secret key check karo
        if (!secretkey) {
            console.error("NEXT_SECRET_KEY missing in environment variables");
            return NextResponse.json({
                success: false,
                error: true,
                message: "Server configuration error"
            }, { status: 500 })
        }

        const passwords = await securepass.find({ userID: session.user.email }).sort({ createdAt: -1 }).lean();

        // Safe decryption with error handling
        const decryptedpasswords = passwords.map((item) => {
            try {
                // Pehle check karo ki password valid encrypted string hai
                if (!item.password || typeof item.password !== 'string') {
                    console.warn(`Invalid password format for item: ${item._id}`);
                    return {
                        ...item,
                        password: "ENCRYPTION_ERROR"
                    }
                }

                const bytes = CryptoJS.AES.decrypt(item.password, secretkey);
                const decryptedpassword = bytes.toString(CryptoJS.enc.Utf8);
                
                // Check karo ki decryption successful hua ya nahi
                if (!decryptedpassword) {
                    console.warn(`Decryption failed for item: ${item._id}`);
                    return {
                        ...item,
                        password: "DECRYPTION_FAILED"
                    }
                }
                
                return {
                    ...item,
                    password: decryptedpassword
                }
            } catch (decryptError) {
                console.error(`Decryption error for item ${item._id}:`, decryptError);
                return {
                    ...item,
                    password: "DECRYPTION_ERROR"
                }
            }
        });

        return NextResponse.json({
            success: true,
            passwords: decryptedpasswords,
        })

    } catch (error) {
        console.log("ERROR IN GETTING PASSWORDS", error);
        return NextResponse.json({
            success: false,
            error: true,
            message: error.message || "Internal server error"
        }, { status: 500 })
    }
}