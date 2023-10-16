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



const nationalityValidationRules = [
    body('nationalityAR').isString().withMessage("error.nationalityARNOTExists"),
    body('nationalityEN').isString().withMessage("error.nationalityENNOTExists"),
    body('countryCode').notEmpty().withMessage("validation.countryCodeNotExists")
]


//==========================================  add nationality ==========================================//

router3.post("/add", nationalityValidationRules, async (req, res) => {//completed
    try {
        const { nationalityEN, nationalityAR, countryCode } = req.body
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
                    general: translatedErrors 
                },
            });
        }

        const observer = {
            status: true,
            errors:{}
        }
        const termsexists = await query("select * from nationalities where countryCode=?", countryCode);
        if (termsexists[0]) {
            observer.status = false
            observer.errors.countryCode=req.t("error.countryCodeExistsINDB")
        }
        const termsexists2 = await query("select * from nationalities where nationalityEN=?", nationalityEN);
        if (termsexists2[0]) {
            observer.status = false
            observer.errors.nationalityEN = req.t("error.nationalityENNOTExists")
        }
        const termsexists3 = await query("select * from nationalities where nationalityAR=?", nationalityAR);
        if (termsexists3[0]) {
            observer.status = false
            observer.errors.nationalityAR = req.t("error.nationalityARNOTExists");

        }
        if (!observer.status) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: {...observer.errors}
            })
        }



        const subject = {
            nationalityAR: nationalityAR,
            nationalityEN: nationalityEN,
            countryCode: countryCode
        }
        await query("insert into nationalities set ? ", subject);
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




//==========================================  delete nationality ==========================================//

router3.delete("/delete", adminAuth, async (req, res) => {//completed
    try {
        if (!req.body.id) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.nationalityIDNOTExists"),
                data: {},
                errors: {}
            })
        }


        const nationalitysExists = await query("select * from nationalities where id=?", req.body.id);
        if (!nationalitysExists[0]) {
            return res.status(404).json({
                status: true,
                code: 404,
                msg: req.t("error.noNationality"),
                data: {},
                errors: {}
            })
        }
        const termsexists = await query("delete from nationalities where id=?", req.body.id);

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



//==========================================  update nationality ==========================================//
const nationalityUpdateValidationRules = [
    body('nationalityAR').isString().withMessage("error.nationalityARNOTExists"),
    body('nationalityEN').isString().withMessage("error.nationalityENNOTExists"),
    body('countryCode').notEmpty().withMessage("validation.countryCodeNotExists"),
    body('id').isNumeric().withMessage("error.nationalityIDNOTExistsID")

]

router3.put("/alter", adminAuth, nationalityUpdateValidationRules, async (req, res) => {//completed
    try {
        const { nationalityAR, nationalityEN, countryCode, id } = req.body
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
                    general: translatedErrors 
                },
            });
        }

        const nationalitysExists = await query("select * from nationalities where id=?", id);
        if (!nationalitysExists[0]) {
            return res.status(404).json({
                status: true,
                code: 404,
                msg: req.t("error.noNationality"),
                data: {},
                errors: {}
            })
        }

        const observer = {
            status: true,
            errors: {}
        }
        const termsexists = await query("select * from nationalities where countryCode=? AND id <> ? ", [countryCode,id]);
        if (termsexists[0]) {
            observer.status = false
            observer.errors.countryCode = req.t("error.countryCodeExistsINDB")
        }
        const termsexists2 = await query("select * from nationalities where nationalityEN=? AND id <> ?", [nationalityEN,id]);
        if (termsexists2[0]) {
            observer.status = false
            observer.errors.nationalityEN = req.t("error.nationalityENExistsINDB")
        }
        const termsexists3 = await query("select * from nationalities where nationalityAR=? AND id <> ?", [nationalityAR, id]);
        if (termsexists3[0]) {
            observer.status = false
            observer.errors.nationalityAR = req.t("error.nationalityARExistsINDB")
        }
        if (!observer.status) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { ...observer.errors }
            })
        }
        const nationalityObject = {
            countryCode: countryCode,
            nationalityEN: nationalityEN,
            nationalityAR: nationalityAR
        }
        await query("update nationalities set ?  where id=?", [nationalityObject, id]);//order by conditions
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("updated"),
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


//==========================================  view nationalities ==========================================//

router3.get("/view", async (req, res) => {//completed
    try {

        const termsexists = await query("select * from nationalities");
        if (termsexists[0]) {
            res.status(200).json({
                status: true,
                code: 200,
                msg: "",
                data: termsexists,
                errors: {}
            })
            setTimeout(() => {
                console.log("hrwe");
            }, 10);
            return;
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("error.nationalityNOTExistsINDB"),
            data: {},
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
