const router6 = require('express').Router();
const conn = require("../db/connection.js");
const util = require("util");//helper in queries 
const bcrypt = require("bcrypt");
const { body, validationResult } = require('express-validator');
// const userAuth = require("../middleware/user.js");
const adminAuth = require("../middleware/admin");
const phoneNumber = require('libphonenumber-js');
const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]



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
const paginatedResults = async (tableName, page, limit) => {
    const startIndex = (page - 1) * limit;
    const user = "user";
    const query2 = `select * from ${tableName} where type = ? limit ? offset ?`;
    const result = await query(query2, [user, limit, startIndex]);
    const userData = {
        result: result,
        statusPrevious: true,
        statusNext:true
    }
    if (startIndex == 0) {
        userData.statusPrevious=false
    }
    if (result.length < limit) {
        userData.statusNext=false
    }

    
    return userData;
};
//========================== get users ==========================//
router6.get("/userdata", adminAuth, async (req, res) => {
    try {
    const { id } = req.body;
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

        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: {...data},
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
//========================== get users ==========================//

router6.post("/viewusers", adminAuth, async (req, res) => {
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
        if (data.result.length==0) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.noData"),
                data: {},
                errors: {},
            });
        }

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
