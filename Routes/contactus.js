const router6 = require('express').Router();
const conn = require("../db/connection.js");
const util = require("util");//helper in queries 
const bcrypt = require("bcrypt");
const { body, validationResult } = require('express-validator');
const userAuth = require("../middleware/user.js");
const adminAuth = require("../middleware/admin");
const phoneNumber = require('libphonenumber-js');
const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]



const paginatedResults = async (tableName, page, limit) => {
    const startIndex = (page - 1) * limit;
    const query2 = `select * from ${tableName}  limit ? offset ?`;
    const result = await query(query2, [ (limit + 1), startIndex]);
    const complaints = {
        result: result,
        statusPrevious: true,
        statusNext: true
    }
    if (!(result.length == limit + 1)) {
        complaints.statusNext = false
    }
    if (result.length == limit + 1) {
        await complaints.result.pop();
    }

    if (startIndex == 0) {
        complaints.statusPrevious = false
    }



    return complaints;
};

const validationRules = [
    body('userName')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length < 13 || value.length > 29) {
                throw new Error("validation.namelong2");
            }
            return true;
        })
    ,
    body('email').isEmail().withMessage('validation.emailNotExists'),
    body('phone').isString().withMessage("validation.phoneNotExists"),
    body('subject')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.subjectNotExists");
            }
            return true;
        }),
];

router6.post("/complaints", userAuth, validationRules, async (req, res) => {
    try {
        //============  Check if there are any validation errors ============
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const translatedErrors = errors.array().map(error => ({
                ...error,
                msg: req.t(error.msg)
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                data: {},
                errors: {
                    general: translatedErrors 
                },
            });
        }
        const { countryCode, phone,email, userName, subject } = req.body
        const user = res.locals.user;
        const isValid2 = phoneNumber.isValidNumber( phone);
        if (!isValid2) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("validation.phoneNotExists"),
                data: {},
                errors: {},
            });
        }
        const complain = {
            userid: user.id,
            phone: phone,
            userName: userName,
            subject: subject,
            email:email
        }
        await query("insert into contactus  set ?", complain);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("register"),
            data: {},
            errors: {},
        });
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
const alter = async (e) => {
    let user = await query("select userName,phone from users where id=?", e.userid)
    e.actualuserName = user[0].userName
    e.actualphone = user[0].phone
}
router6.get("/solve", adminAuth, async (req, res) => {
    try {
        const { page, limit } = req.query;
        if (!(Boolean(limit) && Boolean(page))) {
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
        const complaints = await paginatedResults("contactus", pageNumber, limitNumber)
        if (complaints.result[0]) {

            await Promise.all(complaints.result.map(alter));
            
            return res.status(200).json({
                status: true,
                code: 200,
                msg: "",
                data: complaints,
                errors: {},
            });
        }

        return res.status(404).json({
            status: false,
            code: 404,
            msg: req.t("error.complainsNotExists"),
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



module.exports = router6;