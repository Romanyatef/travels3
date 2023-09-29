const router3 = require('express').Router();
const conn = require("../db/connection");
const util = require("util");//helper in queries 
const bcrypt = require("bcrypt");
const { request, body, validationResult } = require('express-validator');
const crypto = require("crypto");
const CryptoJS = require('crypto-js');
const adminAuth = require("../middleware/admin");
const fs = require("fs");

const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]



const creditValidationRules = [
    body('link').isURL().withMessage("validation.enterLink")
]


//==========================================  add link ==========================================//

router3.post("/add", adminAuth, creditValidationRules, async (req, res) => {//completed
    try {
        const { link } = req.body
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
        const termsexists = await query("select * from variety where id=2");
        if (termsexists[0]) {
            if (termsexists[0].link) {
                await query("update variety set  link = ? where id=2", link);//order by conditions
                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("updated"),
                    data: {},
                    errors: {}
                })
            }
        }
        const subject = { link: link }
        await query("update variety set ? where id=2", subject);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("added"),
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




//==========================================  delete link ==========================================//

router3.delete("/delete", adminAuth, async (req, res) => {//completed
    try {
        const termsexists = await query("select * from variety where id=2");
        if (!termsexists[0].link) {
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("error.noLink"),
                data: {},
                errors: {}
            })
        }
        await query("update variety set link = NULL  where id=2");
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("deleted"),
            data: {},
            errors: {}
        })
    } catch (err) {
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            data: {},
            errors: { serverError: err }
        });
    }
});





//==========================================  update link ==========================================//

router3.put("/alter", adminAuth, creditValidationRules, async (req, res) => {//completed
    try {
        const { link } = req.body
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
        await query("update variety set link = ?  where id=2", link);//order by conditions
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("updated"),
            data: {},
            errors: {}
        })
    } catch (err) {
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            data: {},
            errors: { serverError: err }
        });
    }
});





//==========================================  view link ==========================================//

router3.get("/view", async (req, res) => {//completed
    try {

        const termsexists = await query("select * from variety where id=2");
        if (!termsexists[0].link) {
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("error.noLinkv"),
                data: {},
                errors: {}
            })
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: { link: termsexists[0].link },
            errors: {}
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            data: {},
            errors: { serverError: err }
        });
    }
});






module.exports = router3;
