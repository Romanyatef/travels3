const router6 = require('express').Router();
const conn = require("../db/connection.js");
const util = require("util");//helper in queries 
// const userAuth = require("../middleware/user.js");
const { body, validationResult, check, checkExact } = require('express-validator');
const adminAuth = require("../middleware/admin");
const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]
exports.query = query;
const upload = require("../middleware/uploadImages");
const fs = require("fs");
const multer = require('multer');
const phoneNumber = require('libphonenumber-js')
const bcrypt = require("bcrypt");
const { promises } = require('dns');



const paginatedResults = async (tableName, page, limit) => {
    const startIndex = (page - 1) * limit;
    const user = "user";
    const query2 = `select * from ${tableName} where type = ? limit ? offset ?`;
    const result = await query(query2, [user, (limit + 1), startIndex]);
    const userData = {
        result: result,
        statusPrevious: true,
        statusNext: true,
        numRecords: (await query(`select count(*) as countusers from ${tableName}`))[0].countusers
    }
    if (!(result.length == limit + 1)) {
        userData.statusNext = false
    }
    if (result.length == limit + 1) {
        await userData.result.pop();
    }

    if (startIndex == 0) {
        userData.statusPrevious = false
    }



    return userData;
};

//========================== get user by id==========================//

router6.get("/userdata", adminAuth, async (req, res) => {//completed4
    try {
        const { id } = req.query;
        if (!(id)) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.userIDNOTExistsID"),
                data: {},
                errors: {},
            });
        }

        const data = await query("select * from users where id=?", id);
        if (!data[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.noUserData"),
                data: {},
                errors: {},
            });
        }
        delete data[0].password;
        delete data[0].password;
        data[0].phone = data[0].countryCode + data[0].phone
        delete data[0].type;

        if (data[0].gender == 1) {
            data[0].gender = req.t("male")
        } else {
            data[0].gender = req.t("female")
        }
        if (data[0].specialNeeds == 1) {
            data[0].specialNeeds = req.t("yes")
        } else {
            data[0].specialNeeds = req.t("no")
        }
        if (data[0].status == 1) {
            data[0].status = req.t("active")
        } else {
            data[0].status = req.t("inactive")
        }
        const country = await query("select * from nationalities where countryCode=?", data[0].countryCode)
        if (req.headers['accept-language'] == "ar") {
            data[0].nationality = country[0].nationalityAR
        } else {
            data[0].nationality = country[0].nationalityEN
        }
        delete data[0].countryCode;
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: { ...data },
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

//========================== get inactive users ==========================//

router6.get("/inactive", adminAuth, async (req, res) => {// completed4
    try {
        const { page, limit } = req.query;
        if (!(limit || page)) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.limitPage"),
                data: {},
                errors: {},
            });
        }
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const startIndex = (pageNumber - 1) * limit;

        const userQuery = `select * from users where status= 0 AND type="user" limit ? offset ?`;
        const result = await query(userQuery, [limitNumber + 1, startIndex]);
        const userData = {
            result: result,
            statusPrevious: true,
            statusNext: true,
            numRecords: (await query(`select count(*) as countusers from users where status= 0`))[0].countusers
        }
        if (startIndex == 0) {
            userData.statusPrevious = false
        }

        if (!(result.length == limit + 1)) {
            userData.statusNext = false
        }

        if (result.length == limit + 1) {
            await userData.result.pop();
        }

        if (userData.result.length == 0) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.noData"),
                data: {},
                errors: {},
            });
        } else {
            const fun = (elemn) => {
                delete elemn.password;
                delete elemn.status;
                delete elemn.type;

            };
            userData.result.map(fun);
            return res.status(200).json({
                status: true,
                code: 200,
                msg: "",
                data: userData,
                errors: {},
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

//========================== get users ==========================//

router6.get("/viewusers", adminAuth, async (req, res) => {//completed4
    try {
        const { page, limit } = req.query;
        if (!(limit || page)) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.limitPage"),
                data: {},
                errors: {},
            });
        }
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const data = await paginatedResults("users", pageNumber, limitNumber)
        if (data.result.length == 0) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.noData"),
                data: {},
                errors: {},
            });
        }
        const fun = async (elemn) => {
            delete elemn.password;
            elemn.phone = elemn.countryCode + elemn.phone
            delete elemn.type;

            if (elemn.gender == 1) {
                elemn.gender = req.t("male")
            } else {
                elemn.gender = req.t("female")
            }
            if (elemn.specialNeeds == 1) {
                elemn.specialNeeds = req.t("yes")
            } else {
                elemn.specialNeeds = req.t("no")
            }
            if (elemn.status == 1) {
                elemn.status = req.t("active")
            } else {
                elemn.status = req.t("inactive")
            }
            const country = await query("select * from nationalities where countryCode=?", elemn.countryCode)
            if (req.headers['accept-language'] == "ar") {
                elemn.nationality = country[0].nationalityAR
            } else {
                elemn.nationality = country[0].nationalityEN
            }
            delete elemn.countryCode;
            const host = req.get('host');
            elemn.profile_image = `http://${host}/upload/${elemn.profile_image} `

        };
        await Promise.all(data.result.map(fun))
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: data,
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


//================================= set in-Active users to active state  =================================//

router6.post("/userstate", adminAuth, async (req, res) => {//completed4
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.userIDNOTExistsID"),
                data: {},
                errors: {},
            });
        }
        const { operation } = req.query;
        if (!operation) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.invalidOperation"),
                data: {},
                errors: {},
            });
        }

        const usere = await query("select * from users where id= ?", id);
        if (!usere[0]) {
            return res.status(404).json({
                status: false,
                code: 404,
                msg: req.t("error.noUser"),
                data: {},
                errors: {},
            });
        }
        else {
            if (operation == 1) {
                if (usere[0].status == 1) {
                    return res.status(400).json({
                        status: false,
                        code: 400,
                        msg: req.t("error.userActivated"),
                        data: {},
                        errors: {},
                    });
                }
                await query("update users set status = 1 where id =? ", id);
                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("userActivate"),
                    data: {},
                    errors: {},
                });
            } else {
                if (operation == 0) {
                    if (usere[0].status == 0) {
                        return res.status(400).json({
                            status: false,
                            code: 400,
                            msg: req.t("error.userInactivated"),
                            data: {},
                            errors: {},
                        });
                    }
                    await query("update users set status = 0 where id =? ", id);
                    return res.status(200).json({
                        status: true,
                        code: 200,
                        msg: req.t("userInactivate"),
                        data: {},
                        errors: {},
                    });
                } else {
                    return res.status(400).json({
                        status: false,
                        code: 400,
                        msg: req.t("error.invalidOperation"),
                        data: {},
                        errors: {},
                    });
                }
            }
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
//================================= regester new driver  =================================//
const registrationValidationRules = [
    body('fullName')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 13 || value.length >= 29) {

                throw new Error("validation.namelong2");
            }
            return true;
        }),
    body('phone').isString().withMessage('validation.phoneNotExists'),
    body('email').isEmail().withMessage('validation.emailNotExists'),
    body('password').isLength({ min: 8, max: 25 }).withMessage('validation.passwordNotExists'),
    body('homeAddress').isString().withMessage('validation.homeAddressNotExists'),
    body('birthDate').isISO8601().withMessage('validation.birthDateNotExists'),
    body('gender').isNumeric().withMessage('validation.genderNotExists'),
    body('emiratesID').isNumeric().withMessage('validation.nationalityIDNotExists'),
    body('individualOrCorporate').isNumeric().withMessage('validation.individualOrCorporateNotExists'),



];
// exports.registrationValidationRules = registrationValidationRules;
router6.post("/driverregister", (req, res, next) => {//completed4
    upload.fields([
        { name: 'profile_image', maxCount: 1 },
        { name: 'passport', maxCount: 1 },
        { name: 'drivingLicense', maxCount: 1 },
        { name: 'residenceVisa', maxCount: 1 },
        { name: 'tradeLicense', maxCount: 1 },
        { name: 'carLicense', maxCount: 1 }
    ])(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                console.log("Unexpected field in the request");
            }
        } else if (err) {
            return res.status(500).json({
                status: false,
                code: 500,
                msg: "",
                data: {},
                errors: { serverError: err }
            });
        }

        next();
    });
}, registrationValidationRules, async (req, res) => {
    try {
        //check the required images
        const requiredPhotos = ['profile_image', 'passport', 'drivingLicense', 'residenceVisa', 'tradeLicense', 'carLicense'];
        const missingPhotos = [];
        for (const photo of requiredPhotos) {
            if (!req.files || !req.files[photo]) {

                missingPhotos.push(`imagesValidation.${photo}`);
            }
        }
        let imagesDeleted = false;
        if (missingPhotos.length > 0) {
            imagesDeleted = true;
            await deleteUploadedFiles(req.files);
            for (let i = 0; i < missingPhotos.length; i++) {
                missingPhotos[i] = req.t(missingPhotos[i])
            }
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: {
                    general: [{ images: `${req.t("imagesValidation.imagesRequired")} ${missingPhotos.join(',')}` }]
                },
            });
        }
        //============  Check if there are any validation errors ============

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (!imagesDeleted) {
                await deleteUploadedFiles(req.files);
            }

            const errorlink = errors.array();
            const translatedErrors = errors.array().map(error => ({
                ...error,
                msg: req.t(error.msg)
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: {
                    general: translatedErrors
                },
            });
        }

        const observer = {
            status: true,
            errors: {},
        };
        const { individualOrCorporate, emiratesID, gender, birthDate, homeAddress, password, email, phone, fullName, companyName } = req.body
        //============ check phone   ============

        const isValid2 = phoneNumber.isValidNumber(phone);
        observer.errors.phone = [];
        if (!isValid2) {
            observer.status = false;
            observer.errors.phone.push(req.t("validation.phoneNotExists"));
        }
        const phoneExists = await query("select * from driver where mobileNumber = ?", phone);

        if (phoneExists[0]) {
            observer.status = false;
            observer.errors.phone.push(req.t("error.phoneExists"))
        }

        //============ check email existes in driver  ============
        const emailexists = await query("select * from driver where emailAddress = ?", email);
        if (emailexists[0]) {
            observer.status = false
            observer.errors.email = req.t("error.emailExists")
        }
        //============ check emiratesID existes in driver  ============
        const emiratesIDexists = await query("select * from driver where emiratesID = ?", emiratesID);
        if (emiratesIDexists[0]) {
            observer.status = false
            observer.errors.emiratesID = req.t("error.emiratesIDExists")
        }
        //============ check gender  ============
        if (!(gender == 1 || gender == 0)) {
            observer.status = false;
            observer.errors.gender = req.t("validation.genderNotExists");
        }
        //============ check individualOrCorporate  ============
        if (!(individualOrCorporate == 1 || individualOrCorporate == 0)) {
            observer.status = false;
            observer.errors.individualOrCorporateNotExists = req.t("validation.individualOrCorporateNotExists");
        }

        //============ check individualOrCorporate for company name ============
        if (individualOrCorporate == 1) {
            if (!companyName) {
                return res.status(400).json({
                    status: false,
                    code: 400,
                    msg: "",
                    data: {},
                    errors: {
                        companyName: req.t("validation.companyName")
                    }
                })
            }
        }
        //============ check all errors   ============
        if (!observer.status) {
            if (observer.errors.phone.length == 0) {
                delete observer.errors.phone
            }
            await deleteUploadedFiles(req.files);
            return res.status(400).json({
                status: false,
                code: 400,
                data: {},
                errors: {
                    ...observer.errors,
                },
            });
        }

        const currentDate = new Date();
        const driverData = {
            fullName: fullName,
            mobileNumber: phone,
            emailAddress: email,
            password: await bcrypt.hash(password, 10),
            homeAddress: homeAddress,
            dateOfBirth: birthDate,
            emiratesID: emiratesID,
            profile_image: req.files['profile_image'][0].filename,
            passport: req.files['passport'][0].filename,
            residenceVisa: req.files['residenceVisa'][0].filename,
            drivingLicense: req.files['drivingLicense'][0].filename,
            carLicense: req.files['carLicense'][0].filename,
            tradeLicense: req.files['tradeLicense'][0].filename,
            token: crypto.randomBytes(16).toString("hex"),//to now is an admin or not and is loged or not ,
            gender: gender,
            individualOrCorporate: individualOrCorporate,
            joiningDate: currentDate,
        }
        if (individualOrCorporate == 1) {
            driverData.companyName = companyName
        }
        await query("insert into driver set ?", driverData);

        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("register"),
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
            errors: { serverError: err }
        });
    }
});


async function deleteUploadedFiles(files) {
    const deletePromises = Object.values(files).flatMap(filesArray => {
        return filesArray.map(file => deleteFileIfExists(file.path));
    });

    await Promise.all(deletePromises);
}

async function deleteFileIfExists(filePath) {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        await fs.promises.unlink(filePath);
    } catch (err) {
        console.log(`Failed to delete file: ${filePath}`);
    }
}


//================================= delete driver  =================================//
router6.delete("/deleteDriverProfile", adminAuth, async (req, res) => {
    try {
        const { id } = req.query
        if (!id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.userIDNOTExistsID"),
                data: {},
                errors: {},
            });
        }
        checkExistss = await query("select * from driver where id=?", id);
        if (!checkExistss[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.noDriver"),
                data: {},
                errors: {},
            });
        }
        const filesArray = [checkExistss[0].tradeLicense, checkExistss[0].carLicense, checkExistss[0].drivingLicense, checkExistss[0].residenceVisa, checkExistss[0].passport, checkExistss[0].profile_image]
        await Promise.all(filesArray.map(async file => await deleteFileIfExists("./upload/" + file)));
        await query("delete from driver where id = ? ", id);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("deleted"),
            data: {},
            errors: {},

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


//================================= delete user profile  =================================//

router6.delete("/deleteProfile", adminAuth, async (req, res) => {
    try {
        const { id } = req.query
        if (!id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.userIDNOTExistsID"),
                data: {},
                errors: {},
            });
        }
        checkExistss = await query("select * from users where id=?", id);
        if (!checkExistss[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.noUser"),
                data: {},
                errors: {},
            });
        }
        await query("delete from users where id = ? ", id)
        deleteFileIfExists("./upload/" + checkExistss[0].profile_image)
        // fs.unlinkSync("./upload/" + checkExistss[0].profile_image); //delete image

        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("deleted"),
            data: {},
            errors: {},

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


//================================= create new vehicle  =================================//
const vehicleValidationRules = [
    body('model').isString().withMessage('validation.modelNotExists'),
    body('vehicleNum').isNumeric().withMessage('validation.vehicleNumNotExists'),
    body('seats').isNumeric().withMessage('validation.seatsNotExists'),
    body('vehiclecolorEN').isString().withMessage('validation.vehiclecolorENNotExists'),
    body('vehiclecolorAR').isString().withMessage('validation.vehiclecolorARNotExists'),
];
router6.post("/createvehicle", vehicleValidationRules, adminAuth, async (req, res) => {
    try {
        //============  Check if there are any validation errors ============

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array();
            const translatedErrors = errors.array().map(error => ({
                ...error,
                msg: req.t(error.msg)
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: {
                    general: translatedErrors
                },
            });
        }
        const vehicleData = {
            model: model,
            vehicleNum: vehicleNum,
            seats: seats,
            vehiclecolorEN: vehiclecolorEN,
            vehiclecolorAR: vehiclecolorAR
        }
        await query("insert into vehicles set ?", vehicleData);

        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("added"),
            data: {},
            errors: {},

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



//================================= create new maintenance for vehicle  =================================//
const menValidationRules = [
    body('vehicleID').isString().withMessage('validation.modelNotExists'),
    body('content').isString().withMessage('validation.vehiclecolorENNotExists'),
    body('withHow').isString().withMessage('validation.vehiclecolorARNotExists'),
];
router6.post("/createmaintenance", menValidationRules, adminAuth, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array();
            const translatedErrors = errors.array().map(error => ({
                ...error,
                msg: req.t(error.msg)
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: {
                    general: translatedErrors
                },
            });
        }
        const maintenanceData = {
            vehicleID: vehicleID,
            content: content,
            withHow: withHow,
        }
        await query("insert into maintenance set ?", maintenanceData);

        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("added"),
            data: {},
            errors: {},

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
//================================= get maintenance for vehicle by id =================================//

router6.post("/getmaintenance", menValidationRules, adminAuth, async (req, res) => {
    try {
        const { id } = req.query
        if (!id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.tripIDNOTExistsID"),
                data: {},
                errors: {},
            });
        }
        const maintenanceTripData = await query("select * from maintenance where vehicleID =?", id)
        if (!maintenanceTripData[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.tripIDNOTExists"),
                data: {},
                errors: {}, 
            })
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: maintenanceTripData,
            errors: {},

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



module.exports = router6;

//============  Check if there are any validation errors ============
// const errors = validationResult(req);
// if (!errors.isEmpty()) {
//     const translatedErrors = errors.array().map(error => ({
//         ...error,
//         msg: req.t(error.msg)
//     }));
//     return res.status(400).json({
//         status: false,
//         code: 400,
//         data: {},
//         errors: {
//             general: { ...translatedErrors },
//         },
//     });
// }
// const { countryCode, phone, email, userName, subject } = req.body
// const user = res.locals.user;
// const isValid2 = phoneNumber.isValidNumber(countryCode + phone);
// if (!isValid2) {
//     return res.status(400).json({
//         status: false,
//         code: 400,
//         msg: req.t("validation.phoneNotExists"),
//         data: {},
//         errors: {},
//     });
// }
// const complain = {
//     userid: user.id,
//     phone: phone,
//     countryCode: countryCode,
//     userName: userName,
//     subject: subject,
//     email: email
// }
// await query("insert into contactus  set ?", complain);
// return res.status(200).json({
//     status: true,
//     code: 200,
//     msg: req.t("register"),
//     data: {},
//     errors: {},
// });


// const otpValidationRules = [
//     body('userName')
//         .custom((value, { req }) => {
//             if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length < 13 || value.length > 29) {
//                 throw new Error("validation.namelong2");
//             }
//             return true;
//         })
//     ,
//     body('email').isEmail().withMessage('validation.emailNotExists'),
//     body('phone').isString().withMessage("validation.phoneNotExists"),
//     body('subject').isString().withMessage('validation.subjectNotExists'),
//     body('countryCode').notEmpty().withMessage("validation.countryCodeNotExists")
// ];

// const paginatedResults = async (tableName, page, limit) => {
//     const startIndex = (page - 1) * limit;
//     // const endIndex = page * limit;
//     const user ="user"
//     const data = await query("select * from ? where type = ?  limit ? offset ? ", [tableName, user, limit, startIndex])
//     return data;
// }