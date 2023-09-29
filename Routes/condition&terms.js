const router3 = require('express').Router();
const conn = require("../db/connection");
const util = require("util");//helper in queries 
const bcrypt = require("bcrypt");
const { body, validationResult } = require('express-validator');
const crypto = require("crypto");
const CryptoJS = require('crypto-js');
const adminAuth = require("../middleware/admin");
const fs = require("fs");

const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]




//==========================================  add terms and conditions   ==========================================//

router3.post("/add",adminAuth, async (req, res) => {//completed
    try {
        const { conditions } = req.body
        if (!conditions) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.enterTerms"),
                data: {},
                errors: {}
            });
        }

        const termsexists = await query("select * from variety where id=2");
        if (termsexists[0]) {
            if (termsexists[0].conditions) {
                await query("update variety set  conditions = ? where id=2", conditions);//order by conditions
                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("updated"),
                    data: {},
                    errors: {}
                })
            }
        }
        const subject = { conditions:conditions }
        await query("update  variety set ? where id=2", subject);
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




//==========================================  delete ==========================================//

router3.delete("/delete", adminAuth, async (req, res) => {//completed
    try {
        const termsexists = await query("select * from variety where id=2");
        if (!termsexists[0].conditions) {
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("error.noTerms"),
                data: {},
                errors: {}
            })
        }
        await query("update variety set conditions = NULL  where id=2");
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





//==========================================  update ==========================================//

router3.put("/alter", adminAuth, async (req, res) => {//completed
    try {
        const { conditions } = req.body

        if (!conditions) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.enterTerms"),
                data: {},
                errors: {},
            });
        }
        await query("update variety set conditions = ?  where id=2", conditions);//order by conditions
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





//==========================================  view ==========================================//

router3.get("/view", async (req, res) => {//completed
    try {

        const termsexists = await query("select * from variety where id=2");
        if (!termsexists[0].conditions) {
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("error.noTermsv"),
                data: {},
                errors: {}
            })
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: { terms: termsexists[0].conditions },
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
