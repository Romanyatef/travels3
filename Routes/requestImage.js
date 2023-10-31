const router9 = require('express').Router();
const conn = require("../db/connection.js");
const util = require("util");//helper in queries 
const bcrypt = require("bcrypt");
const path = require('path');
const fs = require("fs");
const phoneNumber = require('libphonenumber-js');
const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]
const imageAuth = async (req, res, next) => {

    // console.log(!req.headers.token)
    if (!req.headers.token) {
        return res.status(404).json({
            status: false,
            code: 404,
            msg: req.t("error.invalidAuth"),
            data: {},
            errors: {},
        });
    }
    const { token } = req.headers;

    const { filename } = req.params;
    const userAuth = await query("select * from users where profile_image=? AND token=?", [filename, token]);
    if ((userAuth[0] && userAuth[0].status == 1) || userAuth[0].type == "admin") {
            return next();
        }
    const driverr = await query("SELECT id FROM driver WHERE profile_image=? OR tradeLicense=? OR carLicense=? OR drivingLicense=? OR passport=? OR residenceVisa=?", [filename, filename, filename, filename, filename, filename]); if (driverr[0]) {
        if (driverr[0]) {
            const query3 = "select * from users where token = ?";
            const userAuth3 = await query(query3, token);
            if (userAuth3[0] && userAuth3[0].status == 1 && userAuth3[0].type == "admin") {
                return next();
            }
            const query2 = "select * from driver where token = ?";
            const userAuth2 = await query(query2, token);
            if (userAuth2[0] && userAuth2[0].status == 1 && (userAuth2[0].profile_image == filename || userAuth2[0].carLicense == filename || userAuth2[0].tradeLicense == filename || userAuth2[0].residenceVisa == filename || userAuth2[0].passport == filename || userAuth2[0].drivingLicense == filename)) {
                return next();
            }
        }
    }
    const userIDExists = (await query("select id from users where token =? AND type=admin", token))
    if (!userIDExists[0]) {
        return res.status(404).json({
            status: false,
            code: 404,
            msg: req.t("error.invalidAuth"),
            data: {},
            errors: {},
        });
    }
    // const contactusimages = await query("select * from contactusimages where userID=? AND image=?"[, filename])
    // const contactusimages = await query("select * from contactus where userID=? AND image=?"[, filename])
    const image = await query("SELECT contactus.id, contactus.userid, contactus.userName, contactus.phone, contactus.email, contactus.subject, contactusimages.image FROM contactus JOIN contactusimages ON contactus.id = contactusimages.contactusID  where contactusimages.image=?", [filename])
    if (image[0]) {
        next()
    }
    return res.status(404).json({
        status: false,
        code: 404,
        msg: req.t("error.invalidAuth"),
        data: {},
        errors: {},
    });
}


module.exports = imageAuth;

router9.get("/upload/:filename", (req, res) => {
    try {
        const filePath = path.join(__dirname, '../upload', req.params.filename);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (err) {
        console.log(err);
    }


});

module.exports = router9;