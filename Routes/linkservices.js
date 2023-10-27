const router3 = require('express').Router();
const conn = require("../db/connection");
const util = require("util");//helper in queries 
const bcrypt = require("bcrypt");
const { request, body, validationResult } = require('express-validator');
const crypto = require("crypto");
const CryptoJS = require('crypto-js');
const adminAuth = require("../middleware/admin");
const fs = require("fs");
const phoneNumber = require('libphonenumber-js')
const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]



//==========================================  add general settings ==========================================//
const generalValidationRules = [
    body('phone').isString().withMessage("validation.phoneNotExists"),
    body('about')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.aboutNotExists");
            }
            return true;
        }),
    body('nationalityID').isNumeric().withMessage('validation.nationalityIDNotExists'),
    body('lLink').custom((value) => {
        if (!value || typeof value !== 'string') {
            throw new Error('validation.lLinkNotExists');
        }
        const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\//i;
        if (!linkedinRegex.test(value)) {
            throw new Error('validation.lLinkNotExists');
        }
        return true;
    }),
    body('adressLink').custom((value) => {
        if (!value || typeof value !== 'string') {
            throw new Error('validation.adressNotExists');
        }
        let googleRegex = /^https:\/\/www\.google\.com\/maps\/place\/(.*)$/
        if (!googleRegex.test(value)) {
            throw new Error('validation.adressNotExists');
        }
        return true;
    }),
    body('wLink').custom((value) => {
        if (!value || typeof value !== 'string') {
            throw new Error('validation.wLinkNotExists');
        }
        const whatsappRegex = /^https?:\/\/(www\.)?.+\.whatsapp\.com\//i;
        if (!whatsappRegex.test(value)) {
            throw new Error('validation.wLinkNotExists');
        }
        return true;
    }),
    body('fLink').custom((value) => {
        if (!value || typeof value !== 'string') {
            throw new Error('validation.fLinkNotExists');
        }
        const facebookRegex = /^https?:\/\/(www\.)?facebook\.com\//i;
        if (!facebookRegex.test(value)) {
            throw new Error('validation.fLinkNotExists');
        }
        return true;
    }),
    body('tLink').custom((value) => {
        if (!value || typeof value !== 'string') {
            throw new Error('validation.tLinkNotExists');
        }
        const twitterRegex = /^https?:\/\/(www\.)?twitter\.com\//i;
        if (!twitterRegex.test(value)) {
            throw new Error('validation.tLinkNotExists');
        }
        return true;
    }),   
    body('dayStart').custom((value, { req }) => {
            if (isNaN(parseInt(value)) || (!(value.length == 1))) {

                throw new Error("validation.dayStartNotExists");
            }
            return true;
        }),
    body('dayEnd').custom((value, { req }) => {
            if (isNaN(parseInt(value)) || (!(value.length == 1))) {

                throw new Error("validation.dayEndNotExists");
            }
            return true;
        }),
    body('hourStart').custom((value) => {
            // "HH:mm:ss"
            if (!value || typeof value !== 'string') {
                throw new Error('validation.hourStartNotExists');
            }
            const hours = parseInt(value.substring(0, 2))
            const minutes = parseInt(value.substring(2, 4))
            const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
            if (!timeRegex.test(value) || hours >= 24 || minutes >= 60) {
                throw new Error('validation.hourStartNotExists');
            }
            return true;
        }),
    body('hourEnd').custom((value, { req }) => {
            // "HH:mm:ss"
            if (!value || typeof value !== 'string') {
                throw new Error('validation.hourEndNotExists');
            }
                const hours = parseInt(value.substring(0, 2))
                const minutes = parseInt(value.substring(2, 4))
                const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
                if (!timeRegex.test(value) || hours >= 24 || minutes >= 60) {
                    throw new Error('validation.hourEndNotExists');
                }
                return true;
        }),
]

router3.post("/add", adminAuth, generalValidationRules, async (req, res) => {//completed
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
                    general: translatedErrors
                },
            });
        }
        const { tLink, lLink, fLink, wLink, hourEnd, hourStart, dayEnd, dayStart, phone, adressLink, nationalityID, about } = req.body

        const date1 = new Date(`2000-01-01 ${hourEnd}`);
        const date2 = new Date(`2000-01-01 ${hourStart}`);
        const timeDifference = (Math.abs(date2 - date1)) / (1000 * 60 * 60);

        if (timeDifference < 6 || date1 < date2) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.hourdifference"),
                data: {},
                errors: {}
            });
        }
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
        if (!isValid2) {
            observer.status = false;
            observer.errors.phone.push(req.t("validation.phoneNotExists"));
        }
        const subject = {
            tLink: tLink,
            lLink: lLink,
            fLink: fLink,
            wLink: wLink,
            hourEnd: hourEnd,
            hourStart: hourStart,
            dayEnd: dayEnd,
            dayStart: dayStart,
            phone: phone,
            adressLink: adressLink,
            about: about
        }
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
        if (!termsexists[0].wLink) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.noLink"),
                data: {},
                errors: {}
            })
        }
        const subject = {
            tLink: null,
            lLink: null,
            fLink: null,
            wLink: null,
            hourEnd: null,
            hourStart: null,
            dayEnd: null,
            dayStart: null,
            phone: null,
            adressLink: null

        }
        await query("update variety set  ? where id=2",subject);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("deleted"),
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


//==========================================  view general settings ==========================================//
router3.get("/view", async (req, res) => {//completed
    try {

        const termsexists = await query("select * from variety where id=2");
        if (!termsexists[0].lLink) {
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("error.noLinkv"),
                data: {},
                errors: {}
            })
        }
        delete termsexists[0].promo
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data:termsexists[0] ,
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
