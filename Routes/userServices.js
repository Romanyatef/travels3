const router2= require('express').Router();
const conn=require("../db/connection.js");
const util=require("util");//helper in queries 
const bcrypt=require("bcrypt");
const { body, validationResult } = require('express-validator'); 
const crypto = require("crypto");
const CryptoJS = require('crypto-js');
const userAuth = require("../middleware/user.js");
const autherized = require("../middleware/autherized.js");
const fs = require("fs");

const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]



//==========================================  edit pass  ==========================================//

const passValidationRules = [body('newPass').isLength({ min: 8, max: 25 }).withMessage("validation.passwordNotExists")];

router2.post("/pass",userAuth,passValidationRules,async (req,res)=>{//completed
    try {
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array()
            const translatedErrors = errors.array().map(error => ({
                ...error,
                msg: req.t(error.msg)
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                data: {},

                errors: {
                    ...translatedErrors
                },
            });
        }

        const { newPass } = req.body;
        const user1 = res.locals.user;
        await query("update users set password=? where id =? ", [await bcrypt.hash(newPass,10), user1.id]);
                return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("passwordEdit"),
            data: {},
            errors: {  }
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
//==========================================  view credit card  ==========================================//

router2.get("/viewcredit", userAuth,async (req,res)=>{
    try {
        const user1 = res.locals.user;
        const visaexists = await query("select * from creditcard where userID =?", user1.id)
        if (!visaexists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.visaNotExists"),
                data: {},
                errors: {}
            })
        }

        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: visaexists,
            errors: {  }
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


//==========================================  add credit card  ==========================================//
const creditValidationRules = [
    body('name')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 9) {

                throw new Error("validation.namelong2");
            }
            return true;
        }),
    body('type').isString().withMessage("validation.typeNotExists"),
    body('cnnNumber').isNumeric().withMessage("validation.cnnNotExists"),
    body('cvv').isNumeric().withMessage("validation.cvvNotExists"),
    body('exprity').isISO8601().withMessage("validation.exprityNotExists")]


router2.post("/credit", userAuth, creditValidationRules,async (req,res)=>{
    try {

        const { exprity, cvv, cnnNumber, name, type } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array()
            const translatedErrors = errors.array().map(error => ({
                ...error,
                msg: req.t(error.msg)
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                data: {},
                errors: {
                    general: { ...translatedErrors }
                },
            });
        }
        const user1 = res.locals.user;
        const visaexists = await query("select * from creditcard where cvv=? AND cnnNumber=?", [ cvv, cnnNumber])
        if (visaexists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.visaExists"),
                data: {},
                errors: {}
            })
        }
        const Visa = {
            exprity: exprity,
            cvv: cvv,
            cnnNumber: cnnNumber,
            type: type,
            name: name,
            userID: user1.id
            
        }

        await query("insert into creditcard set ?", Visa);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("addVisa"),
            data: {},
            errors: {  }
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

//==========================================  delete credit   ==========================================//
const creditValidationRules2 = [
    body('cnnNumber').isNumeric().withMessage("validation.cnnNotExists"),
    body('cvv').isNumeric().withMessage("validation.cvvNotExists"),
    ]

router2.delete("/deletecredit", autherized, creditValidationRules2,async (req,res)=>{
    try {
        const {cvv, cnnNumber } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array()
            const translatedErrors = errors.array().map(error => ({
                ...error,
                msg: req.t(error.msg)
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                data: {},

                errors: {
                    general: { ...translatedErrors }
                },
            });
        }
        const autherized = res.locals.autherized;
        const visaexists = await query("select * from creditcard where userID=? AND cvv=? AND cnnNumber=?", [autherized.id, cvv, cnnNumber])
        if (visaexists[0]) {
            await query("delete from creditcard where userID=? AND cvv=? AND cnnNumber=? ", [autherized.id,cvv,cnnNumber]);
            return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("deleted"),
            data: {},
            errors: {}
})
        }
        
        return res.status(400).json({
            status: false,
            code: 400,
            msg: req.t("error.visaNotExists"),
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


// //==========================================  send profile by token  ==========================================//


router2.post("/send",autherized,async (req,res)=>{//completed
    try {        
        const autherized = res.locals.autherized;
                return res.status(400).json({
                    status: true,
                    code: 200,
                    msg: "",
                    data: autherized,
                    errors: {},
                    
                })       

    }catch(err){
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            data: {},
            errors: { serverError: err },
            
        });
    }
});
//==========================================  delete profile   ==========================================//


router2.delete("/deleteProfile",autherized,async (req,res)=>{
    try {
        const autherized = res.locals.autherized;
        await query("delete from users where id = ? ", autherized.id)
        fs.unlinkSync("./upload/" + autherized.profile_image); //delete image

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



module.exports= router2;






// router.post("",(req,res)=>{
//     try{
        
//     }catch(err){
//         return res.status(500).json({
        //     status: false,
        //     code: 500,
        //     msg: "",
        //     data: {},
        //     errors: { serverError: err },
        // });
//     }
// });

