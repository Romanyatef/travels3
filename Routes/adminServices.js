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
const crypto = require("crypto");
const sendnotification = require("../index.js")


const paginatedResults2 = async (tableName, page, limit) => {
    const startIndex = (page - 1) * limit;
    const query2 = `select * from ${tableName}  limit ? offset ?`;
    const result = await query(query2, [(limit + 1), startIndex]);
    console.log(result);
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
const paginatedResults = async (tableName, page, limit) => {
    const startIndex = (page - 1) * limit;
    const user = "user";
    const query2 = `select * from ${tableName} where type = ? limit ? offset ?`;
    const result = await query(query2, [user, (limit + 1), startIndex]);
    const userData = {
        result: result,
        statusPrevious: true,
        statusNext: true,
        numRecords: (await query(`select count(*) as countusers from ${tableName} where type=${user}`))[0].countusers
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
                msg: "",
                data: {},
                errors: { userIDNOTExistsID: req.t("error.userIDNOTExistsID") },
            });
        }

        const data = await query("select * from users where id=?", id);
        if (!data[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { noUserData: req.t("error.noUserData") },
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
        if (!(Boolean(limit) && Boolean(page))) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { limitPage: req.t("error.limitPage") },
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
                msg: "",
                data: {},
                errors: { noData: req.t("error.noData") },
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

// //========================== get users ==========================//

router6.get("/viewusers", adminAuth, async (req, res) => {//completed4
    try {
        const { page, limit } = req.query;
        if (!(Boolean(limit) && Boolean(page))) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { limitPage: req.t("error.limitPage") },
            });
        }
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const data = await paginatedResults("users", pageNumber, limitNumber)
        if (data.result.length == 0) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { noData: req.t("error.noData") },
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
                msg: "",
                data: {},
                errors: { userIDNOTExistsID: req.t("error.userIDNOTExistsID") },
            });
        }
        const { operation } = req.query;
        if (!operation) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"" ,
                data: {},
                errors: { invalidOperation :req.t("error.invalidOperation")},
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
                        msg: "",
                        data: {},
                        errors: { userActivated: req.t("error.userActivated") },
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
                            msg: "",
                            data: {},
                            errors: { userInactivated :req.t("error.userInactivated")},
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
                        msg: "",
                        data: {},
                        errors: { invalidOperation :req.t("error.invalidOperation")},
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
    body('homeAddress')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.homeAddressNotExists");
            }
            return true;
        }),
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
                    images: `${req.t("imagesValidation.imagesRequired")} ${missingPhotos.join(',')}`
                },
            });
        }
        //============  Check if there are any validation errors ============

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (!imagesDeleted) {
                await deleteUploadedFiles(req.files);
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
router6.delete("/deleteDriverProfile", adminAuth, async (req, res) => {//completed
    try {
        const { id } = req.query
        if (!id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { userIDNOTExistsID :req.t("error.userIDNOTExistsID")},
            });
        }
        checkExistss = await query("select * from driver where id=?", id);
        if (!checkExistss[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { noDriver :req.t("error.noDriver")},
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
router6.delete("/deleteProfile", adminAuth, async (req, res) => {//completed
    try {
        const { id } = req.query
        if (!id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { userIDNOTExistsID :req.t("error.userIDNOTExistsID")},
            });
        }
        checkExistss = await query("select * from users where id=?", id);
        if (!checkExistss[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"" ,
                data: {},
                errors: { noUser :req.t("error.noUser")},
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
const isFloat = require("./travelsOperations.js").isFloat
const validateLocationAddress = (value, { req }) => {
    const { locationlong } = req.body;

    if ((!isFloat(locationlong)) || (parseFloat(locationlong) < -180.0 || parseFloat(locationlong) > 180.0)) {

        throw new Error('validation.currentAddressNotExists');
    }
    return true;
};
const validateLocationAddress2 = (value, { req }) => {
    const { locationlat } = req.body;

    if ((!isFloat(locationlat)) || (parseFloat(locationlat) < -85.05112878 || parseFloat(locationlat) > 85.05112878)) {

        throw new Error('validation.currentAddressNotExists');
    }
    return true;
};
const vehicleValidationRules = [
    body('time').custom((value) => {
        if (!value || typeof value !== 'string') {
            throw new Error('validation.TimeNotExists');
        }
        const hours = parseInt(value.substring(0, 2));
        const minutes = parseInt(value.substring(2, 4));
        const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
        if (!timeRegex.test(value) || hours >= 24 || minutes >= 60) {
            throw new Error('validation.TimeNotExists');
        }
        return true;
    }),
    body('locationlat').custom(validateLocationAddress2),
    body('locationlong').custom(validateLocationAddress),
    body('model')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.modelNotExists");
            }
            return true;
        }),
    body('vehicleNum').isNumeric().withMessage('validation.vehicleNumNotExists'),
    body('companyID').isNumeric().withMessage('validation.companyNotexists'),
    body('seats').isNumeric().withMessage('validation.seatsNotExists'),
    body('vehiclecolorEN')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.vehiclecolorENNotExists");
            }
            return true;
        }),
    body('vehiclecolorAR')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.vehiclecolorARNotExists");
            }
            return true;
        }),
];
router6.post("/createvehicle", vehicleValidationRules, adminAuth, async (req, res) => {//complete
    try {
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
        const { model, vehicleNum, seats, vehiclecolorEN, vehiclecolorAR, companyID, time, locationlong, locationlat } = req.body

        const companyExists = await query("select * from companies where id=?", companyID)
        if (!companyExists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"" ,
                data: {},
                errors: { companyIDNotexists :req.t("error.companyIDNotexists")}
            });
        }
        const vehicleData = {
            model: model,
            vehicleNum: vehicleNum,
            seats: seats,
            vehiclecolorEN: vehiclecolorEN,
            vehiclecolorAR: vehiclecolorAR,
            companyID: companyID,
            time: time,
            locationlat: locationlat,
            locationlong: locationlong
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
//=============================================== delete a vichle======================================
router6.delete("/deletevehicle", adminAuth, async (req, res) => {//complete
    try {
        if (!req.query.id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"",
                data: {},
                errors: { novehicleID: req.t("validation.novehicleID")}
            });
        }
        const vehicleExists = await query("select * from vehicles where id=?", req.query.id)
        if (!vehicleExists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { novehicle :req.t("error.novehicle")}
            });
        }
        await query("delete from vehicles where id=?", req.query.id)
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
//=============================================== delete a company======================================
router6.delete("/deletecompany", adminAuth, async (req, res) => {//complete
    try {
        if (!req.query.id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { companyIDNotExists :req.t("validation.companyIDNotExists")}
            });
        }
        const vehicleExists = await query("select * from companies where id=?", req.query.id)
        if (!vehicleExists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { nocompanies :req.t("error.nocompanies")}
            });
        }
        await query("delete from companies where id=?", req.query.id)
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
//=============================================== add a company======================================
const companyValidationRules = [body('companyName')
    .custom((value, { req }) => {
        if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

            throw new Error("validation.companyNameNotexists");
        }
        return true;
    })
]
router6.post("/createcompany", companyValidationRules, adminAuth, async (req, res) => {//complete
    try {
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
        const { companyName } = req.body

        const companyExists = await query("select * from companies where companyName=?", companyName)
        if (companyExists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"" ,
                data: {},
                errors: { companyNameExists :req.t("error.companyNameExists")}
            });
        }
        const companyData = {
            companyName: companyName
        }
        await query("insert into companies set ?", companyData);

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
// =============================================== view companies ======================================

router6.get("/companies", adminAuth, async (req, res) => {//complete
    try {
        const companyExists = await query("select * from companies")
        if (!companyExists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"" ,
                data: {},
                errors: { companiesNotExists :req.t("error.companiesNotExists")}
            });
        }

        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: companyExists,
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
//============================== get vehicles with company id===========================
router6.get("/vehicless", adminAuth, async (req, res) => {//complete
    try {
        if (!req.query.id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { companyIDNotExists :req.t("error.companyIDNotExists")}
            });
        }
        const companyExists = await query("select * from companies where id=? ", req.query.id)
        if (!companyExists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { companyNotExists :req.t("error.companyNotExists")}
            });
        }
        const vehicles = await query("select * from vehicles where companyID=? ", req.query.id)
        if (!vehicles[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"" ,
                data: {},
                errors: { novehicles :req.t("error.novehicles")}
            });
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: vehicles,
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
//============================== get all vehicle===========================
router6.get("/vehicles", adminAuth, async (req, res) => {//complete
    try {
        const { page, limit } = req.query;
        if (!(Boolean(limit) && Boolean(page))) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { limitPage: req.t("error.limitPage") },
            });
        }
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const vehicles = await paginatedResults2("vehicles", pageNumber, limitNumber)
        if (!vehicles.result[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { novehicles: req.t("error.novehicles") },
            });
        }
        // const user1 = res.locals.user;
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: vehicles,
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

//================================= create new maintenance for vehicle  =================================//
const menValidationRules = [
    body('vehicleID')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.vehicleIDNotExists");
            }
            return true;
        }),
    body('content')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.contentNotExists");
            }
            return true;
        }),
    body('withHow')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.withHowNotExists");
            }
            return true;
        })
];
router6.post("/createmaintenance", menValidationRules, adminAuth, async (req, res) => {//completed
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
        const { vehicleID, content, withHow } = req.body

        const vehicleExists = await query("select * from vehicles where id=?", vehicleID);
        if (!vehicleExists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { vehicleNotExists: req.t("validation.vehicleNotExists") },

            })
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

router6.get("/getmaintenance", menValidationRules, adminAuth, async (req, res) => {//completed
    try {
        const { id } = req.query
        if (!id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { menIDNOTExists :req.t("error.menIDNOTExists")},
            });
        }
        const vehicleEXists = await query("select * from vehicles where id =?", id)
        if (!vehicleEXists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"" ,
                data: {},
                errors: { vehicleNotExists: req.t("validation.vehicleNotExists")},
            })
        }
        const maintenanceTripData = await query("select * from maintenance where vehicleID =?", id)
        if (!maintenanceTripData[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg:"",
                data: {},
                errors: { menIDNOTExists : req.t("error.menIDNOTExists")},
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

//==========================================  add promo and send ==========================================//
router6.post("/addpromo", adminAuth, async (req, res) => {//incompleted
    try {
        const { promo } = req.body

        if (!promo) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { enterPromo :req.t("error.enterPromo")},
            });
        }

        // const termsexists = await query("select * from variety where id=2");
        // if (termsexists[0].promo) {
        await query("update variety set promo = ? counter=30 where id=2", promo);//order by conditions

        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("added"),
            errors: {},
            data: {}
        })
        // }
        // const subject = { conditions: req.body.conditions }
        // await query("update  variety set  promo= ? where id=2", promo);
        // //send promo with firebase or email
        // return res.status(200).json({
        //     status: true,
        //     code: 200,
        //     msg: req.t("added"),
        //     errors: {},
        //     data: {}
        // })
    } catch (err) {
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            errors: { serverError: err },
            data: {}
        });
    }
});
//==========================================  send a notification ==========================================//
const sendnotificationbody = [body('message')
    .custom((value, { req }) => {
        if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

            throw new Error("validation.messageNotExists");
        }
        return true;
    }),
body('id').isNumeric().withMessage("validation.userIDNOTExists")]
router6.post("/sendnotification", sendnotificationbody, adminAuth, async (req, res) => {//incompleted
    try {
        const { id, message } = req.body
        const userExists = await query("select * from users where id =?", id)
        if (!userExists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { noUser :req.t("error.noUser")},
            });
        }
        //+++++++++++     notification ==>we can modify it to be a kind of notification send in the request +++++++++++++  
        const send = await sendnotification("notification")
        // const termsexists = await query("select * from variety where id=2");
        // if (termsexists[0].promo) {
        if (send) {
            // store the notification
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("send"),
                errors: {},
                data: {}
            })
        }

        return res.status(400).json({
            status: false,
            code: 400,
            msg: "",
            data: {},
            errors: { notsend :req.t("error.notsend")},
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            errors: { serverError: err },
            data: {}
        });
    }
});
// "noPromo": "there is no fqa to delete",
//==========================================  get private trips  ==========================================//
router6.get("/Bookprivate",adminAuth, async (req, res) => {//test
    try {
        const { page, limit } = req.query;
        if (!(Boolean(limit) && Boolean(page))) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { limitPage: req.t("error.limitPage") },
            });
        }
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const trips = await paginatedResults2("privateTrip", pageNumber, limitNumber)
        if (!trips.result[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { noUser: req.t("error.noPrivateTrips") },
            });
        }
        // const user1 = res.locals.user;
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: trips,
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

module.exports = {
    router6: router6,
    deleteUploadedFiles: deleteUploadedFiles,
    deleteFileIfExists: deleteFileIfExists

};

