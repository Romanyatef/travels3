const router6 = require('express').Router();
const conn = require("../db/connection.js");
const util = require("util");//helper in queries 
const bcrypt = require("bcrypt");
const { body, validationResult } = require('express-validator');
const userAuth = require("../middleware/user.js");
const adminAuth = require("../middleware/admin");
const phoneNumber = require('libphonenumber-js');
const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]
const upload = require("../middleware/uploadImages.js");
const fs = require("fs");

// const deleteUploadedFiles=require("./adminServices.js")
async function deleteUploadedFiles(files) {
    // console.log('files:', files);

    const deletePromises = Object.keys(files).flatMap(field => {  
        const filesArray = Array.isArray(files[field]) ? files[field] : [files[field]];
        // console.log('filesArray:', filesArray);

        return filesArray.map(file => deleteFileIfExists(file.path));
    });

    await Promise.all(deletePromises);
}
// async function deleteUploadedFiles(files) {
//     console.log('files:', files);

//     const deletePromises = files.map(file => deleteFileIfExists(file.path));

//     await Promise.all(deletePromises);
// }
async function deleteFileIfExists(filePath) {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        await fs.promises.unlink(filePath);
    } catch (err) {
        console.log(err);
        console.log(`Failed to delete file: ${filePath}`);
    }
}

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
// 
router6.post("/complaints",upload.array("images"),validationRules, userAuth , async (req, res) => {//test

    try {
        //============  Check if there are any validation errors ============
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const translatedErrors = errors.array().map(error => ({
                ...error,
                msg: req.t(error.msg)
            }));
            if (req.files) {
                await deleteUploadedFiles(req.files)
            }
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
        const { countryCode, phone,email, userName, subject } = req.body
        const user = res.locals.user;
        const isValid2 = phoneNumber.isValidNumber( phone);
        if (!isValid2) {
            if (req.files) {
                await deleteUploadedFiles(req.files)
            }
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
        const insertion= await query("insert into contactus  set ?", complain);
        const id = insertion.insertId
        if (req.files) {
            await Promise.all(req.files.map(async (file) => {
            const contactusimage = {
                image: file.filename,
                contactusID: id,
            }
            await query("insert into contactusimages set ?", contactusimage)
        }))
        }
        
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("register"),
            data: {},
            errors: {},
        });

    } catch (err) {
        if (req.files) {
            await deleteUploadedFiles(req.files)
        }
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
const alter = async (e) => {
    let user = await query("select userName,phone from users where id=?", e.userid)
    e.actualuserName = user[0].userName
    e.actualphone = user[0].phone
}
router6.get("/solve", adminAuth, async (req, res) => {//test
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
        const host = req.get('host');
        if (complaints.result[0]) {
            await Promise.all(complaints.result.map(async (ele) => {
                const images = await query("select * from contactusimages where contactusID =?", ele.id);
                if (images[0]) {
                    ele.images = images.map((ele2) => {
                        const imageUrl = `http://${host}/upload/${ele2.image}`;
                        delete ele2.contactusID;
                        return { ...ele2, image: imageUrl };
                    });
                }
            }));
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