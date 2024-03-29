const router = require('express').Router();
const conn = require("../db/connection.js");
const util = require("util");//helper in queries 
const bcrypt = require("bcrypt");
const { body, validationResult } = require('express-validator');
const crypto = require("crypto");
const CryptoJS = require('crypto-js');
const upload = require("../middleware/uploadImages");
const userAuth = require("../middleware/user.js");
const userAuthlog = require("../middleware/lodingAuth.js");
const autherized = require("../middleware/autherized.js");
const Notautherized = require("../middleware/Notautherized.js");
const fs = require("fs");
const phoneNumber = require('libphonenumber-js')
const redis = require('redis');
const axios = require('axios');
const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]
const registerAuth = require("../middleware/registerAuth.js")
const isFloat = (require("./travelsOperations.js")).isFloat
require('dotenv').config();



const { Vonage } = require('@vonage/server-sdk');
const { isString } = require('util');


const vonage = new Vonage({
    apiKey: process.env.Vonage_APIKEY,
    apiSecret: process.env.Vonage_APISECERT
})
const from = process.env.FROM
const to = process.env.TO // because we use a free trial account so we can send messages only for this phone 
const to1 = process.env.TO1// because we use a free trial account so we can send messages only for this phone 

async function sendOTP(text, phonenumber = to) {
    await vonage.sms.send({ phonenumber, from, text })
        .then(resp => { return true })
        .catch(err => { return false });

}
async function sendOTPemail(text, email = to1) {
    await vonage.email.send({ email, from, text })
        .then(resp => { return true })
        .catch(err => { return false });

}

async function generateOTP(token) {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


// const redisClient = redis.createClient({
//     password: process.env.REDIS_PASSWORD,
//     socket: {
//         host: process.env.REDIS_HOST,
//         port: process.env.REDIS_PORT
//     }
// });
// redisClient.on('error', err => console.log('Redis Client Error', err));
// redisClient.connect();

async function checkExists(phone) {
    const value2 = await query("select * from otpstoring where masterkey=? ", phone);
    const returnValue = {
        status: true
    }
    if (!value2[0]) {
        returnValue.status = false
        return returnValue;
    }
    const value = value2[0].value
        returnValue.value1 = value; 
        return returnValue

}
async function insertvalue(masterkey, value) {
    const pair = {
        masterkey: masterkey,
        value: value
    }
    await query("insert into otpstoring set ?", pair);
}
async function updatevalue(masterkey, value) {
    const pair = {
        value: value
    }
    await query("update otpstoring set ? where masterkey=?", [pair, masterkey]);
}
async function deletevalue(masterkey) {
    await query("delete from otpstoring where masterkey=?", masterkey);
}
// const validateHomeAddress = (value, { req }) => {
//     const { homeAddressLat, homeAddressLong } = req.body;

//     if ((!isFloat(homeAddressLat) || !isFloat(homeAddressLong)) || (parseFloat(homeAddressLat) < -85.05112878 || parseFloat(homeAddressLat) > 85.05112878 || parseFloat(homeAddressLong) < -180.0 || parseFloat(homeAddressLong) > 180.0)) {
        
//         throw new Error('validation.homeAddressNotExists2');
//     }
//     return true;
// };
// const validateWorkAddress = (value, { req }) => {
//     const { workAddressLat, workAddressLong } = req.body;

//     if ((!isFloat(workAddressLat) || !isFloat(workAddressLong)) || (parseFloat(workAddressLat) < -85.05112878 || parseFloat(workAddressLat) > 85.05112878 || parseFloat(workAddressLong) < -180.0 || parseFloat(workAddressLong) > 180.0)) {
        
//         throw new Error('validation.workAddressNotExists');
//     }
//     return true;
// };


//==========================================  Registeration  ==========================================//

const registrationValidationRules = [
    body('userName')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 13 || value.length >= 29) {
                throw new Error("validation.namelong2");
            }
            return true;
        }),
    body('homeAddress')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {
                throw new Error("validation.homeAddressNotExists");
            }
            return true;
        }),
    body('workAddress')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {
                throw new Error("validation.workAddressNotExists");
            }
            return true;
        }),
    // body('homeAddressLat').custom(validateHomeAddress),
    // body('homeAddressLong').custom(validateHomeAddress),
    // body('workAddressLat').custom(validateWorkAddress),
    // body('workAddressLong').custom(validateWorkAddress),
    // body('workAddress').isNumeric().withMessage('validation.workAddressNotExists'),
    body('nationalityID').isNumeric().withMessage('validation.nationalityIDNotExists'),
    body('birthDate').isISO8601().withMessage('validation.birthDateNotExists'),
    body('specialNeeds').isNumeric().withMessage('validation.specialNeedsNotExists'),
    body('email').isEmail().withMessage('validation.emailNotExists'),
    body('password').isLength({ min: 8, max: 25 }).withMessage('validation.passwordNotExists'),
    body('phone').isNumeric().withMessage('validation.phoneNotExists'),
    body('type').notEmpty().withMessage('validation.typeNotExists'),
];
// async function encryptNumber(number,key) {
//     const ciphertext = CryptoJS.AES.encrypt(number.toString(), key);
//     return ciphertext.toString();
// }
router.post("/register", upload.single("image"),registerAuth, registrationValidationRules, async (req, res) => {// completed
    try {
        //============  Check if there are any validation errors ============
        // if (!req.file) {
        //     return res.status(400).json({
        //         status: false,
        //         code: 400,
        //         msg: "",
        //         data: {},
        //         errors: { imageNotExists :req.t("error.imageNotExists")}
        //     })
        // }
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (req.file) {
            fs.unlinkSync("./upload/" + req.file.filename); //delete image          
            }
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }


        //============ Extract data from the request body ============
        const { email, password, phone, type, userName, nationalityID, homeAddress, workAddress, birthDate, gender, specialNeeds, conditions } = req.body;
        const observer = {
            status: true,
            errors: {}
        }



        observer.errors.phone = [];
        const countryCode = await query("select countryCode from nationalities where id=?", nationalityID)
        if (!countryCode[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: {
                    nationality: req.t("error.noNationality")
                }

            })
        }
        const isValid2 = phoneNumber.isValidNumber(countryCode[0].countryCode + phone);
        if (!(isValid2)) {
            observer.status = false
            observer.errors.phone.push(req.t("validation.phoneNotExists"))
        }


        //============ check email existes in users  ============
        const emailexists = await query("select * from users where email = ?", email);
        if (emailexists[0]) {
            observer.status = false
            observer.errors.email = req.t("error.emailExists")
        }
        //============ check nationality existes in nationalities  ============
        const nationalityExists = await query("select * from nationalities where id = ?", nationalityID);
        if (!nationalityExists[0]) {
            observer.status = false
            observer.errors.nationality = req.t("error.nationalityNotExists")
        }
        //============ check type  in users  ============|| type == "bus"
        if (!(type == "admin" || type == "user" )) {
            observer.status = false
            observer.errors.type = req.t("validation.typeNotExists")
        }
        //============ check gender  ============
        if (!(gender == 1 || gender == 0)) {
            observer.status = false
            observer.errors.gender = req.t("validation.genderNotExists")
        }
        //============ check terms and conditions  ============
        if (!(conditions == 1)) {
            observer.status = false
            observer.errors.termsAndConditions = req.t("error.noAgreeTerms")
        }
        //============ check work adress station and conditions  ============
        // const workAddressStation = await query("select * from stations where id=? AND startEnd=1",workAddress)
        // if (!workAddressStation[0]) {
        //     observer.status = false
        //     observer.errors.workAddress = req.t("error.stationIDNOTExists")
        // }
        // //============ check home adress station and conditions  ============
        // const homeAddressStation = await query("SELECT * FROM stations WHERE id=? AND (startEnd IS NULL OR startEnd = 0)", parseInt(homeAddress));        console.log(homeAddressStation);
        // if (!homeAddressStation[0]) {
        //     observer.status = false 
        //     observer.errors.homeAddress = req.t("error.stationIDNOTExists")
        // }

        //============ check phone existes in users  ============
        const phoneExists = await query("select * from users where phone = ?", phone);

        if (phoneExists[0]) {
            observer.status = false;
            observer.errors.phone.push(req.t("error.phoneExists"))

        } else {
            const phoneExists2 = await query(
                "select * from users where phone = ?",
                phone.toString().slice(2)
            );

            if (phoneExists2[0]) {
                observer.status = false
                observer.errors.phone.push(req.t("error.phoneExists"))
            }
        }


        //============ check all errors   ============
        if (!observer.status) {
            if (observer.errors.phone && observer.errors.phone.length == 0) {
                delete observer.errors.phone
            }
            if (observer.errors.phone && observer.errors.phone.length == 1) {
                observer.errors.phone = observer.errors.phone[0]
            }

            if (req.file) {
                fs.unlinkSync("./upload/" + req.file.filename); //delete image          
            }
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: {
                    ...observer.errors,

                }

            })
        }
        
        const pair = await checkExists(phone)
        if (pair.status) {
            if (req.file) {
                fs.unlinkSync("./upload/" + req.file.filename); //delete image          
            }
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { otpWait :req.t("error.otpWait")},
            });
        }
        // invalidOtp
        // await redisClient.get(phone, async (err, storedOtp) => {
        //     if (err) {
        //         throw err
        //     }
        // });

            // await deletevalue(phone);
        
            // ============ Return success response without password ============
        const generatedOTP = await generateOTP();
        // sendOTP(`الرقم سري هو ${generatedOTP}`, phone)

        if (true) {

            // redisClient.setEx(phone, 600, generatedOTP, (err) => {
            //     if (err) {
            //         return res.status(500).json({
            //             status: false,
            //             code: 500,
            //             msg: "Internal server error sending otp",
            //             data: {},
            //             errors: { serverError: err },
            //         });
            //     }
            // });

            await insertvalue(phone, generatedOTP);
            
            const token = crypto.randomBytes(16).toString("hex") //to now is an admin or not and is loged or not 
            const userData = {
                userName: userName,
                email: email,
                password: await bcrypt.hash(password, 10),
                token: token,
                type: type,
                phone: phone,
                nationalityID: nationalityID,
                // workAddressLong: workAddressLong,
                // workAddressLat: workAddressLat,
                // homeAddressLong: homeAddressLong,
                // homeAddressLat: homeAddressLat,
                workAddress: workAddress,
                homeAddress: homeAddress,
                // tripID: workAddressStation[0].tripID,
                birthDate: birthDate,
                gender: gender,
                specialNeeds: specialNeeds || 0,
                countryCode: countryCode[0].countryCode,
            }
            if (req.file) {
                userData.profile_image= req.file.filename
            }
            // if (type=="admin") {
            //     userData.status=1
            // }
            await query("insert into users set ?", userData);
            // if (type == "admin") {
            //     res.status(200).json({
            //         status: true,
            //         code: 200,
            //         msg: req.t("sendOtp") + "  :" + generatedOTP + "  , " + req.t("register"),
            //         data: {},
            //         errors: {},
            //     });
            // } else {
                res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("sendOtp") + "  :" + generatedOTP +"  , "+req.t("register"),
                data: { token: token },
                errors: {},
            });
            // }
                                                                                                                            
        
            
            setTimeout(async () => {
                await deletevalue(phone);
            }, 10 * 60000);
            return;
        }
            // return res.status(200).json({
            //     status: true,
            //     code: 200,
            //     msg: req.t("register"),
            //     data: {},
            //     errors: {}

            // })
        // else {
        //     fs.unlinkSync("./upload/" + req.file.filename); //delete image

        //     return res.status(400).json({
        //         status: false,
        //         code: 400,
        //         msg: req.t("error.invalidOtp"),
        //         data: {},
        //         errors: {},
        //     });
        // }


    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            data: {},
            errors: { serverError: err }

        });

    }
});
//==========================================  confirm otp for registration ==========================================//
const otpValidationRules = [
    body('otp')
        .custom((value, { req }) => {
            if (isNaN(parseInt(value)) || value.length !== 6) {
                throw new Error("validation.otpNotExists");
            }
            return true;
        }),];
router.post("/confirmotp", Notautherized, otpValidationRules, async (req, res) => {//completed
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }

        const Notautherized = res.locals.Notautherized;
        const { otp } = req.body
        const values = await checkExists(Notautherized.phone);
        if (values.status) {

            // if(values.value1==otp){}
            if (Notautherized.type == "admin") {
                values.value1 = otp;
            }
            // value
            // if (!(req.type == "admin")) {
            //     //     await redisClient.del(phone, async (err) => {
            //     //     if (err) {
            //     //         throw err;
            //     //     }
            //     // });
            // }
            if (999999 == otp) {
                await query("update users set status=1 where id=?", Notautherized.id)
            }
            await deletevalue(Notautherized.phone);
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("register"),
                data: {},
                errors: {},
            });
        }

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { invalidOtp :req.t("error.invalidOtp")},
            });

        
        // sendOTP(`الرقم سري هو ${generatedOTP}`, phone)


    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "internal server error",
            data: {},
            errors: { serverError: err },
        });
    }
}
);
//========================================== LOGIN ==========================================//
// the type of login api is post not get for security reasons
const loginValidationRules = [body('email').isEmail().withMessage('validation.emailNotExists'),
body('type').notEmpty().withMessage('validation.typeNotExists'),
body('password').isLength({ min: 8, max: 25 }).withMessage('validation.passwordNotExists'),
];
router.post("/login", loginValidationRules, userAuthlog, async (req, res) => {// completed
    try {
        //============ Extract data from the request body ============
        const { email, password } = req.body;
        //============ Check if there are any validation errors ============
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }

        //============ check email existes in users ============
        const user1 = res.locals.user;

        //============ compare hashed password ============
        const checkedPassword = await bcrypt.compare(password, user1.password);
        if (checkedPassword) {
            //============ Return success response without (password && status) ============
            if (user1.type=="bus"|| user1.type=="user") {
            delete user1.password;        
            }
            const host = req.get('host');
            user1.profile_image = `http://${host}/upload/${user1.profile_image} `
            // res.status(200).json(user[0])
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("logged"),
                data: user1,
                errors: {}

            })


        }
        else {
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"",
                data: {},
                errors: { wrongPassword : req.t("error.wrongPassword")},
            });
        }

    } catch (err) {
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            data: {},
            errors: { serverError: err },
        });
    }
});

//================================= FORGET PASSWORD =================================//
const passValidationRules = [body('phone').isString().withMessage("validation.phoneNotExists")];
router.post("/sendotpass", passValidationRules, async (req, res) => {//completed
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }
        const { phone } = req.body;

        const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]
        const user = await query("select * from users where phone=?", phone);
        
        if (user[0]) {
            const generatedOTP = await generateOTP();
            value5 = await checkExists(user[0].phone);
            if (value5.status) {
                // sendOTP(`الرقم سري هو ${value5.value1}`, user.phone)

                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("sendOtpAgain"),
                    data: {},
                    errors: {},
                });
            }
            // sendOTP(`الرقم سري هو ${generatedOTP}`, user.phone)
            if (true) {
                // await redisClient.setEx(user[0].phone, 600, generatedOTP, (err) => {
                //     if (err) {
                //         throw err;
                //     }
                // });
                await insertvalue(user[0].phone, generatedOTP);
                res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("sendOtp") + "  :" + generatedOTP,
                    data: {},
                    errors: {},
                });
                setTimeout(async () => {
                    await deletevalue(user[0].phone);
                }, 10 * 60000);
                return;
            }
        }
        return res.status(404).json({
            status: false,
            code: 404,
            msg: req.t("validation.phoneNotExists"),
            data: {},
            errors: {},
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "internal server error",
            data: {},
            errors: { serverError: err },
        });
    }
});

//============ conferm otp for pasword editing ==============//
const passValidationRules2 = [
    body('otp')
        .custom((value, { req }) => {
            if (isNaN(parseInt(value)) || value.length !== 6) {
                throw new Error("validation.otpNotExists");
            }
            return true;
        }),
    body("phone").isString().withMessage("validation.phoneNotExists"),
];
router.post("/pass", passValidationRules2, async (req, res) => {//completed
    try {
        const { otp, phone } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }
        const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]
        const user = await query("select * from users where phone=?", phone);

        //============ conferm otp   ============
        if (user[0]) {
            let value = await checkExists(user[0].phone)
            // value.value1 
            if (value.status) {
            if (999999== otp) {
                // await redisClient.setEx(user[0].phone, 600, "1", (err) => {
                //     if (err) { 
                //         throw err;
                //     }
                // });
                await updatevalue(user[0].phone, "1");
                res.status(200).json({
                    status: true,
                    code: 200,
                    msg: "",
                    data: {},
                    errors: {},
                });
                setTimeout(async () => {
                    await deletevalue(user[0].phone);
                }, 10 * 60000);
                return;
            }  
            }
            else {
                return res.status(400).json({
                    status: false,
                    code: 400,
                    msg: "",
                    data: {},
                    errors: { otpNotCorrect :req.t("error.otpNotCorrect")},
                });
            }
        }
        return res.status(404).json({
            status: false,
            code: 404,
            msg: req.t("error.phoneNotExists"),
            data: {},
            errors: {},
        });


    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            data: {},
            errors: { serverError: err },
        });
    }
});
//============ conferm otp for pasword editing ==============//
const passValidationRules3 = [
    body("newPass").isLength({ min: 8, max: 25 }).withMessage("validation.passwordNotExists"),
    body("phone").isString().withMessage("validation.phoneNotExists"),
];
router.post("/pass2", passValidationRules3, async (req, res) => {//completed
    try {
        const { newPass, phone } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }
        const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]
        const user = await query("select * from users where phone=?", phone);
        console.log(user[0]);
        //============ conferm otp   ============
        if (user[0]) {
            const value = await checkExists(user[0].phone)
            console.log(value.status);
            if (value.status) {
                // await redisClient.del(user[0].phone, async (err) => {
                //     if (err) {
                //         throw err;
                //     }
                // });
                await deletevalue(user[0].phone);
                await query("update users set password=? where id =? ", [
                    await bcrypt.hash(newPass, 10),
                    user[0].id,
                ]);

                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("passwordEdit"),
                    data: {},
                    errors: {},
                });
            } else {
                return res.status(400).json({
                    status: false,
                    code: 400,
                    msg: "",
                    data: {},
                    errors: { otpNotCorrect :req.t("error.otpNotCorrect")},
                });
            }
        }
        return res.status(404).json({
            status: false,
            code: 404,
            msg: req.t("error.phoneNotExists"),
            data: {},
            errors: {},
        });


    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            data: {},
            errors: { serverError: err },
        });
    }
});
//======================================= edit profile =======================================//
const registrationValidationRules2 = [
    body('userName')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 13 || value.length >= 29) {
                throw new Error("validation.namelong2");
            }
            return true;
        }),
    body('homeAddress')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {
                throw new Error("validation.homeAddressNotExists");
            }
            return true;
        }),
    body('workAddress')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {
                throw new Error("validation.workAddressNotExists");
            }
            return true;
        }),
    // body('homeAddressLat').custom(validateHomeAddress),
    // body('homeAddressLong').custom(validateHomeAddress),
    // body('workAddressLat').custom(validateWorkAddress),
    // body('workAddressLong').custom(validateWorkAddress),
    // body('workAddress').isNumeric().withMessage('validation.workAddressNotExists'),
    body('nationalityID').isNumeric().withMessage('validation.nationalityIDNotExists'),
    body('birthDate').isISO8601().withMessage('validation.birthDateNotExists'),
    body('specialNeeds').isNumeric().withMessage('validation.specialNeedsNotExists'),
    // body('email').isEmail().withMessage('validation.emailNotExists'),
    // body('password').isLength({ min: 8, max: 25 }).withMessage('validation.passwordNotExists'),
    body('phone').isNumeric().withMessage('validation.phoneNotExists'),
    body('type').notEmpty().withMessage('validation.typeNotExists'),
];
router.post("/editProfile", upload.single("image"),registrationValidationRules2, autherized, async (req, res) => {
    try {
        const autherized = res.locals.autherized;
        const observer = {
            status: true,
            errors: {},
        };
        observer.errors.phone = [];
        const {
            // email,
            // password,
            phone,
            type,
            userName,
            nationalityID,
            homeAddress,
            workAddress,
            birthDate,
            gender,
            specialNeeds,
            statusex,
        } = req.body;
        let imageExists = 0
        if (req.file) {
            imageExists = 1
        }
        //============  Check if there are any validation errors ============
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (imageExists) {
                fs.unlinkSync("./upload/" + req.file.filename);//delete image
            }
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }


        const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]
        const countryCode = await query("select countryCode from nationalities where id=?", nationalityID)
        if (!countryCode[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: {
                    nationality: req.t("error.noNationality")
                }

            })
        }
        const isValid2 = phoneNumber.isValidNumber(countryCode[0].countryCode + phone);
        if (!(isValid2)) {
            observer.status = false
            observer.errors.phone.push(req.t("validation.phoneNotExists"))
        }
        // || type == "bus"
        if (!(type == "admin" || type == "user" )) {
            observer.status = false;
            observer.errors.type = req.t("validation.typeNotExists");
        }
        //============ check gender  ============
        if (!(gender == 1 || gender == 0)) {
            observer.status = false;
            observer.errors.gender = req.t("validation.genderNotExists");
        }
        // //============ check email existes in users  ============

        // if (!(email == autherized.email)) {
        //     const emailexists = await query("select * from users where email = ? AND id <> ?", [email, autherized.id]);
        //     if (emailexists[0]) {
        //         observer.status = false
        //         observer.errors.email = req.t("error.emailExists")
        //     }
        // }
        //============ check nationality existes in nationalities  ============
        const nationalityExists = await query("select * from nationalities where id = ?", nationalityID);
        if (!nationalityExists[0]) {
            observer.status = false
            observer.errors.nationality = req.t("error.nationalityNotExists")
        }
        //============ check work adress station and conditions  ============
        // const workAddressStation = await query("select * from stations where id=? AND startEnd=1",parseInt(workAddress))
        // if (!workAddressStation[0]) {
        //     observer.status = false
        //     observer.errors.workAddress = req.t("error.stationIDNOTExists")
        // }
        // //============ check home adress station and conditions  ============
        // const homeAddressStation = await query("select * from stations where id=? AND (startEnd IS NULL OR startEnd = 0)", parseInt(homeAddress))
        // if (!homeAddressStation[0]) {
        //     observer.status = false
        //     observer.errors.homeAddress = req.t("error.stationIDNOTExists")
        // }

        //============ check phone existes in users  ============
        if (!(phone == autherized.phone)) {
            const phoneExists = await query("select * from users where phone = ?AND id <> ?", [phone, autherized.id]);

            if (phoneExists[0]) {
                observer.status = false
                observer.errors.phone.push(req.t("error.phoneExists"))
            } else {
                const phoneExists2 = await query(
                    "select * from users where phone = ?",
                    phone.toString().slice(2)
                );

                if (phoneExists2[0]) {
                    observer.status = false;
                    observer.errors.phone.push(req.t("error.phoneExists"));
                }
            }


        }

        //============ check all errors   ============
        if (!observer.status) {
            if (observer.errors.phone && observer.errors.phone.length == 0) {
                delete observer.errors.phone
            }
            if (observer.errors.phone && observer.errors.phone.length == 1) {
                observer.errors.phone = observer.errors.phone[0]
            }
            if (imageExists) {
                fs.unlinkSync("./upload/" + req.file.filename); //delete image
            }
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: {
                    ...observer.errors,
                },
            });
        }

        const userData = {
            userName: userName,
            nationalityID: nationalityID,
            homeAddress: homeAddress,
            workAddress: workAddress,
            birthDate: birthDate,
            gender: gender,
            // tripID: workAddressStation[0].tripID,
            specialNeeds: specialNeeds || 0,
            countryCode: countryCode[0].countryCode
        }

        if (imageExists) {
            userData.profile_image = req.file.filename
        }
        if (statusex == 0) {

            // axios.post('/sendotp', {

            // })
            //     .then(function (res) {
            //         console.log(res);
            //     })
            //     .catch(function (err) {
            //         throw err
            //     });



            const values = await checkExists(phone);
            if (values.status) {
                if (imageExists) {
                    fs.unlinkSync("./upload/" + req.file.filename); //delete image
                }
                return res.status(400).json({
                    status: false,
                    code: 400,
                    msg: "",
                    data: {},
                    errors: { otpWait :req.t("error.otpWait")},
                });

            }
            if (phone == autherized.phone) {
                return res.status(400).json({
                    status: false,
                    code: 400,
                    msg: "",
                    data: {},
                    errors: { phoneMatched :req.t("error.phoneMatched")},
                });
            }
            const generatedOTP = await generateOTP();
            if (true) {
                // redisClient.setEx(phone, 600, generatedOTP, (err) => {
                //     if (err) {
                //         throw err
                //     }
                // });
                await insertvalue(phone, generatedOTP);
                // console.log(await query("select * from otpstoring where masterkey=?",phone));
                if (imageExists) {
                    if (!(autherized.profile_image == "1698773559374-37408851.jpeg")) {
                        fs.unlinkSync("./upload/" + autherized.profile_image); //delete image
                    }
                }
                //******************** */ sendOTP(`الرقم سري هو ${generatedOTP}`, phone)

                await query("update users set ? where id=?", [userData, autherized.id]);
                res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("profileEdited") + " ,  " + req.t("sendOtp") + "  :" + generatedOTP,
                    data: {},
                    errors: {}
                })
                setTimeout(async() => {
                    await deletevalue(phone);
                }, 10 * 60000);
                return;

            }
        }
        // if (statusex == 1) {
        //     const values = await checkExists(email);
        //     if (values.status) {
        //         if (imageExists) {
        //             fs.unlinkSync("./upload/" + req.file.filename); //delete image
        //         }
        //         return res.status(400).json({
        //             status: false,
        //             code: 400,
        //             msg: "",
        //             data: {},
        //             errors: { otpWait :req.t("error.otpWait")},
        //         });
        //     }
        //     if (email == autherized.email) {
        //         return res.status(400).json({
        //             status: false,
        //             code: 400,
        //             msg:"",
        //             data: {},
        //             errors: { emailMatched : req.t("error.emailMatched")},
        //         });
        //     }
        //     // sendOTPemail(`الرقم سري هو ${generatedOTP}`, email)
        //     const generatedOTP = await generateOTP();
        //     if (true) {
        //         // redisClient.setEx(email, 600, generatedOTP, (err) => {
        //         //     if (err) {
        //         //         throw err
        //         //     }
        //         // });
        //         await insertvalue(email, generatedOTP);
        //         if (imageExists) {
        //             fs.unlinkSync("./upload/" + autherized.profile_image); //delete image
        //         }
        //         await query("update users set ? where id=?", [userData, autherized.id]);
        //         res.status(200).json({
        //             status: true,
        //             code: 200,
        //             msg: req.t("profileEdited") + " , " + req.t("sendOtp") + "  :" + generatedOTP,
        //             data: {},
        //             errors: {}
        //         })
        //         setTimeout(async() => {
        //             await deletevalue(email);
        //         }, 10 * 60000);
        //         return;

        //     }
        // }
        if (imageExists) {
            if (!(autherized.profile_image == "1698773559374-37408851.jpeg")) {
                fs.unlinkSync("./upload/" + autherized.profile_image); //delete image
            }
        }

        await query("update users set ? where id=?", [userData, autherized.id]);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("profileEdited"),
            data: {},
            errors: {}
        })

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            data: {},
            errors: { serverError: err },
        });
    }
});

const confirmValidationRules = [
    body('otp')
        .custom((value, { req }) => {
            if (isNaN(parseInt(value)) || value.length !== 6) {
                throw new Error("validation.otpNotExists");
            }
            return true;
        }),
    // body('email').isEmail().withMessage('validation.emailNotExists'),
    body('phone').isNumeric().withMessage('validation.phoneNotExists'),
    body('nationalityID').isNumeric().withMessage('validation.countryCodeNotExists'),
    body('statusex').isNumeric().withMessage('validation.statusNotExists'),
];
router.post("/confirmedit", autherized, confirmValidationRules, async (req, res) => {// completed
    try {

        const autherized = res.locals.autherized;
// email
        //============ Extract data from the request body ============ 
        const { otp , phone, nationalityID, statusex } = req.body;
        const observer = {
            status: true,
            errors: {}
        }

        //============  Check if there are any validation errors ============ 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }
        observer.errors.phone = [];



        // //============ check email existes in users  ============
        // if (!(email == autherized.email)) {
        //     const emailexists = await query("select * from users where email = ? AND id <> ?", [email, autherized.id]);
        //     if (emailexists[0]) {
        //         observer.status = false
        //         observer.errors.email = req.t("error.emailExists")
        //     }
        // }
        //============ check phone existes in users  ============
        if (!(phone == autherized.phone)) {
            const phoneExists = await query("select * from users where phone = ? AND id <> ?", [phone, autherized.id]);

            if (phoneExists[0]) {
                observer.status = false
                observer.errors.phone.push(req.t("error.phoneExists"))
            }

            const phoneExists2 = await query(
                "select * from users where phone = ?",
                phone.toString().slice(2)
            );

            if (phoneExists2[0]) {
                observer.status = false;
                observer.errors.phone.push(req.t("error.phoneExists"));
            }
        }
        //============ check nationality existes in nationalities  ============
        const nationalityExists = await query("select * from nationalities where id = ?", nationalityID);
        if (!nationalityExists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: {
                    nationality: req.t("error.noNationality")
                }

            })
        }

        const isValid2 = phoneNumber.isValidNumber(nationalityExists[0].countryCode + phone);
        if (!(isValid2)) {
            observer.status = false
            observer.errors.phone.push(req.t("validation.phoneNotExists"))
        }



        //============ check all errors   ============
        if (!observer.status) {
            if (observer.errors.phone && observer.errors.phone.length == 0) {
                delete observer.errors.phone
            }
            if (observer.errors.phone && observer.errors.phone.length == 1) {
                observer.errors.phone = observer.errors.phone[0]
            }
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"",
                data: {},
                errors: {
                    ...observer.errors
                }

            })
        }
        //============ conferm otp   ============
        if (statusex == 0) {
            const value = (await checkExists(phone))
            if (!value.status) {
                return res.status(400).json({
                    status: false,
                    code: 400,
                    msg: "",
                    data: {},
                    errors: { otpExpired :req.t("error.otpExpired")}

                })
            }
            // value.value1
            if (999999 == otp) {
                // await redisClient.del(phone, async (err) => {
                //     if (err) {
                //         throw err;
                //     }
                // });
                await deletevalue(phone);
                const userData = {
                    phone: phone,
                    nationalityID: nationalityID

                }
                await query("update users set ? where id=?", [userData, autherized.id]);
                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("profileEdited"),
                    data: {},
                    errors: {}

                })

            }
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"" ,
                data: {},
                errors: { otpNotCorrect :req.t("error.otpNotCorrect")},
            });


            // ============ Return success response  ============


        }
//         if (statusex == 1) {
//             const value = (await checkExists(email.toString()))
//             console.log(value);
//             if (!value.status) {
//                 return res.status(400).json({
//                     status: false,
//                     code: 400,
//                     msg: "",
//                     data: {},
//                     errors: { otpExpired :req.t("error.otpExpired")}

//                 })
//             }

// //   value.value1         
//             if ( 999999== otp) {
//                 // await redisClient.del(email.toString(), async (err) => {
//                 //     if (err) {
//                 //         throw err;
//                 //     }
//                 // });
//                 await deletevalue(email.toString());
//                 const userData = {
//                     email: email
//                 }

//                 await query("update users set ? where id=?", [userData, autherized.id]);
//                 return res.status(200).json({
//                     status: true,
//                     code: 200,
//                     msg: req.t("profileEdited"),
//                     data: {},
//                     errors: {}

//                 })
//             }
//             return res.status(400).json({
//                 status: false,
//                 code: 400,
//                 msg:"",
//                 data: {},
//                 errors: { otpNotCorrect : req.t("error.otpNotCorrect")},
//             });
//         }


        return res.status(400).json({
            status: false,
            code: 400,
            msg: "",
            data: {},
            errors: { invalidOperation :req.t("error.invalidOperation")},
        });


    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            data: {},
            errors: { serverError: err }

        });

    }
});

//======================================= END =======================================//


// router.post("/sendotpass2", userAuth, async (req, res) => {
//     try {

//     } catch (err) {
//         return res.status(500).json({
//             status: false,
//             code: 500,
//             msg: "",
//             data: {},
//             errors: { serverError: err },
//         });
//     }
// });






module.exports = router;