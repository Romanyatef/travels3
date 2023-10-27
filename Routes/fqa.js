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






//==========================================  add fqa ==========================================//

router3.post("/add", adminAuth, async (req, res) => {//completed
    try {
        const { fqa } = req.body

        if (!fqa) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.enterFqa"),
                errors: {},
                data: {}
            });
        }

        const termsexists = await query("select * from variety where id=2");
        if (termsexists[0].fqa) {
            await query("update variety set fqa = ? where id=2", fqa);//order by conditions
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("updated"),
                errors: {},
                data: {}
            })
        }
        const subject = { fqa: fqa }
        await query("update  variety set ? where id=?", [subject, 2]);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("added"),
            errors: {},
            data: {}
        })
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



//==========================================  delete fqa ==========================================//

router3.delete("/delete", adminAuth, async (req, res) => {//completed
    try {
        const termsexists = await query("select * from variety where id=2");
        if (!termsexists[0].fqa) {
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("error.noFqa"),
                errors: {},
                data: {}
            })
        }
        await query("update variety set fqa = NULL  where id=2");
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("deleted"),
            errors: {},
            data: {}
        })
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



//==========================================  update fqa ==========================================//

router3.put("/alter", adminAuth, async (req, res) => {//completed
    try {
        const { fqa } = req.body

        if (!fqa) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.enterFqa"),
                errors: {},
                data: {}
            });
        }
        await query("update variety set fqa = ? where id=2", fqa);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("updated"),
            errors: {},
            data: {}
        })
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



//==========================================  view fqa ==========================================//

router3.get("/view", async (req, res) => {//completed
    try {

        const termsexists = await query("select * from variety where id=2");
        if (!termsexists[0].fqa) {
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("error.noFqav"),
                errors: {},
                data: {}
            })
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            errors: {},
            data: { fqa: termsexists[0].fqa }
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            status: false,
            code: 500,
            msg: "",
            errors: { serverError: err },
            data: {}
        });
    }
});











module.exports = router3;
