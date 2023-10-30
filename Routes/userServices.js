const router2 = require("express").Router();
const conn = require("../db/connection.js");
const util = require("util"); //helper in queries
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const userAuth = require("../middleware/user.js");
const autherized = require("../middleware/autherized.js");
const fs = require("fs");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const { title } = require("process");

const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]

//==========================================  edit pass  ==========================================//

const passValidationRules = [
    body("newPass")
        .isLength({ min: 8, max: 25 })
        .withMessage("validation.passwordNotExists"),
];

router2.post("/pass", userAuth, passValidationRules, async (req, res) => {
    //completed
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array();
            const translatedErrors = errors.array().map((error) => ({
                ...error,
                msg: req.t(error.msg),
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                data: {},

                errors: {
                    ...translatedErrors,
                },
            });
        }

        const { newPass } = req.body;
        const user1 = res.locals.user;
        await query("update users set password=? where id =? ", [
            await bcrypt.hash(newPass, 10),
            user1.id,
        ]);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("passwordEdit"),
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
//==========================================  view credit card  ==========================================//

router2.get("/viewcredit", userAuth, async (req, res) => {
    try {
        const user1 = res.locals.user;
        const visaexists = await query(
            "select * from creditcard where userID =?",
            user1.id
        );
        if (!visaexists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.visaNotExists"),
                data: {},
                errors: {},
            });
        }

        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: visaexists,
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

//==========================================  add credit card  ==========================================//
const creditValidationRules = [
    body("name").custom((value, { req }) => {
        if (
            typeof value !== "string" ||
            !isNaN(parseInt(value)) ||
            value.length <= 3 ||
            value.length >= 9
        ) {
            throw new Error("validation.namelong2");
        }
        return true;
    }),
    body('type')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.typeNotExists");
            }
            return true;
        }),
    body("cnnNumber").isNumeric().withMessage("validation.cnnNotExists"),
    body("cvv").isNumeric().withMessage("validation.cvvNotExists"),
    body("exprity").isISO8601().withMessage("validation.exprityNotExists"),
];

router2.post("/credit", userAuth, creditValidationRules, async (req, res) => {
    try {
        const { exprity, cvv, cnnNumber, name, type } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array();
            const translatedErrors = errors.array().map((error) => ({
                ...error,
                msg: req.t(error.msg),
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                data: {},
                errors: {
                    general: { ...translatedErrors },
                },
            });
        }
        const user1 = res.locals.user;
        const visaexists = await query(
            "select * from creditcard where cvv=? AND cnnNumber=?",
            [cvv, cnnNumber]
        );
        if (visaexists[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.visaExists"),
                data: {},
                errors: {},
            });
        }
        const Visa = {
            exprity: exprity,
            cvv: cvv,
            cnnNumber: cnnNumber,
            type: type,
            name: name,
            userID: user1.id,
        };

        await query("insert into creditcard set ?", Visa);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("addVisa"),
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

//==========================================  delete credit   ==========================================//
const creditValidationRules2 = [
    body("cnnNumber").isNumeric().withMessage("validation.cnnNotExists"),
    body("cvv").isNumeric().withMessage("validation.cvvNotExists"),
];
router2.delete(
    "/deletecredit",
    autherized,
    creditValidationRules2,
    async (req, res) => {
        try {
            const { cvv, cnnNumber } = req.body;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorlink = errors.array();
                const translatedErrors = errors.array().map((error) => ({
                    ...error,
                    msg: req.t(error.msg),
                }));
                return res.status(400).json({
                    status: false,
                    code: 400,
                    data: {},

                    errors: {
                        general: { ...translatedErrors },
                    },
                });
            }
            const autherized = res.locals.autherized;
            const visaexists = await query(
                "select * from creditcard where userID=? AND cvv=? AND cnnNumber=?",
                [autherized.id, cvv, cnnNumber]
            );
            if (visaexists[0]) {
                await query(
                    "delete from creditcard where userID=? AND cvv=? AND cnnNumber=? ",
                    [autherized.id, cvv, cnnNumber]
                );
                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("deleted"),
                    data: {},
                    errors: {},
                });
            }

            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.visaNotExists"),
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
    }
);

//==========================================  send profile by token  ==========================================//\

router2.post("/send", autherized, async (req, res) => {
    //completed
    try {
        const autherized = res.locals.autherized;
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: autherized,
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
//==========================================  delete profile   ==========================================//

router2.delete("/deleteProfile", autherized, async (req, res) => {
    try {
        const autherized = res.locals.autherized;
        await query("delete from users where id = ? ", autherized.id);
        fs.unlinkSync("./upload/" + autherized.profile_image); //delete image

        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("deleted"),
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

//==========================================  booking a trip  ==========================================//
router2.post("/book", autherized, async (req, res) => {//completed
    //completed
    try {
        const { id } = req.query;
        if (!(id)) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.tripIDNOTExistsID"),
                data: {},
                errors: {},
            });
        }
        const tripExist = await query("select * from trips where id=?", id);
        if (!tripExist[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.tripIDNOTExists"),
                data: {},
                errors: {},
            });
        }

        if (tripExist[0].startHBack <= moment().tz("Africa/Cairo").hour()) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.tripNotValid"),
                data: {},
                errors: {},
            });
        }
        console.log(tripExist);
        let vehicle;
        if (tripExist[0].goBack == 1) {
            vehicle = await query(
                "select * from vehicles where id=?",
                parseInt(tripExist[0].vehicleIDGo)
            );
        } else {
            vehicle = await query(
                "select * from vehicles where id=?",
                parseInt(tripExist[0].vehicleIDBack)
            );
        }
        if (vehicle[0].passengeersNum == vehicle[0].seats) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.noSeats"),
                data: {},
                errors: {},
            });
        }
        const autherized = res.locals.autherized;
        // if (autherized.tripID == id) {
        //     return res.status(400).json({
        //         status: false,
        //         code: 400,
        //         msg: req.t("error.tripsNotbooked"),
        //         data: {},
        //         errors: {},
        //     });
        // }
        // if (autherized.tripID && kind == 1) {
        //     // const tripExist2 = await query("select * from trips where id=?", autherized.tripID)
        //     // const vehicle2 = await query("select * from vehicles where id=?", tripExist2[0].vehicleID)
        //     // await query("update vehicles set passengeersNum=?  where id =?", [vehicle2[0].passengeersNum - 1, vehicle2[0].id])

        //     return res.status(400).json({
        //         status: false,
        //         code: 400,
        //         msg: req.t("error.tripsNotbooked2"),
        //         data: {},
        //         errors: {},
        //     });
        // }
        // if (true) {
        // moment.tz.setDefault("Africa/Cairo");

        // const currentDate = moment();
        // const endOfMonth = moment().endOf("month");
        // const duration = moment.duration(endOfMonth.diff(currentDate));
        // const numOfDays = duration.asDays();
        const tripBook = {
            tripID: id,
            userID: autherized.id,
            // counter: numOfDays * 2 + 6,.add(1, 'day')
        };

        await query("insert into externaltrips set ? ", [tripBook]);
        await query("update vehicles set passengeersNum=?  where id =?", [
            vehicle[0].passengeersNum + 1,
            vehicle[0].id,
        ]);
        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("booked"),
            data: {},
            errors: {},
        });
        // }

        // if (kind == 0) {
        //     // moment.tz.setDefault('Africa/Cairo');
        //     // const currentDate = moment();
        //     // const endOfMonth = moment().endOf('month');
        //     // const duration = moment.duration(endOfMonth.diff(currentDate));
        //     // const numOfDays = duration.asDays();
        //     const tripBook = {
        //         tripID: id,
        //         userID: autherized.id,
        //         day: day,
        //     };

        //     // await query("update users set ?  where id =?", [tripBook, autherized.id])
        //     await query("insert into externaltrips set ?", tripBook);
        //     await query("update vehicles set passengeersNum=?  where id =?", [
        //         vehicle[0].passengeersNum + 1,
        //         vehicle[0].id,
        //     ]);
        //     return res.status(200).json({
        //         status: true,
        //         code: 200,
        //         msg: req.t("booked"),
        //         data: {},
        //         errors: {},
        //     });
        // }
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
//==========================================  schedule trips  ==========================================//
const validateDates = async (dates, id) => {
    console.log("hello");

    if (!Array.isArray(dates)) {
        console.log("hello1#");
        return false
    }
    const currentDate = new Date();
    for (let i = 0; i < dates.length; i++) {
        if (!(new Date(dates[i]) instanceof Date)) {
            console.log("hello2#");
            return false;
        }
    console.log(dates[1] instanceof Date);

        const dateExists = await query("select * from userschedule where userID=? AND date=?", [id, new Date(dates[i])])
        if (dateExists[0]) {
            console.log("hello3#");

            return false;
        }
        if (dates[i] <= currentDate) {
            console.log("hello4#");
            return false
        }
    }

    return true;
}

const validateTripIds = async (tripIds) => {
    if (!Array.isArray(tripIds)) {
        return false
    }
    for (let i = 0; i < tripIds.length; i++) {
        if (typeof tripIds[i] == 'number') {
            const tripExists = await query("select * from trips where id=?", tripIds[i])
            //check if there a space in the trip
            const vichlego = await query("select * from vehicles where id=?", parseInt(tripExists[0].vehicleIDGo))
            const vichleBack = await query("select * from vehicles where id=?", parseInt(tripExists[0].vehicleIDBack))
            if (vichlego[0].passengeersNum + 1 > vichlego[0].seats && vichleBack[0].passengeersNum + 1 > vichleBack[0].seats) {
                return false;
            }
            // if (tripExists[0].startHGo <= moment().tz("Africa/cairo").hour()) {
            //     return false;
            // }
            if (!tripExists[0]) {
                return false;
            }
        } else {
            return false
        }
    }
}

const combineArrays = async (dateArray, tripIdArray, userID) => {
    const combinedArray = dateArray.map((date, index) => ({
        userID: userID,
        tripID: tripIdArray[index],
        date: date
    }));
    return combinedArray;
}
router2.post("/bookschedule", autherized, async (req, res) => {//test
    //completed
    try {
        // const currunt
        const { dates, tripIds } = req.body;
        const autherized = res.locals.autherized;
        const validTripIds = await validateTripIds(tripIds);
        // if (!validTripIds) {
        //     console.log("hello3");
        //     return res.status(400).json({
        //         status: false,
        //         code: 400,
        //         msg: req.t("error.invalidInputs"),
        //         data: {},
        //         errors: {},
        //     });
        // }

        // Validate dates
        const validDates = await validateDates(dates, autherized.id);
        if (!validDates) {
            console.log("hello1");
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.invalidInputs"),
                data: {},
                errors: {},
            });
        }
        if (!dates.length == tripIds.length) {
            console.log("hello2");
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.invalidInputs"),
                data: {},
                errors: {},
            });
        }

        // if (!(((await validateTripIds(tripIds)) && (await validateDates(dates, autherized.id))) && dates.length == tripIds.length)) {
        //     return res.status(400).json({
        //         status: false,
        //         code: 400,
        //         msg: req.t("error.invalidInputs"),
        //         data: {},
        //         errors: {},
        //     });
        // }
        const combinedArray = await combineArrays(dates, tripIds, autherized.id);
        combinedArray.map(async (obj) => {
            await query("insert into userschedule set ?", obj)
        });

        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("added"),
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
//==========================================  generate text  ==========================================//
router2.post("/generate", autherized, async (req, res) => {//incomplete//add trip id in front to generated text to use it later in the scan for which trip
    try {
        const autherized = res.locals.autherized;
        const exists = await query(
            "select * from qrcodes where userID=?",
            autherized.id
        );
        const generatedtext = uuidv4();
        if (exists[0]) {
            // await query("delete from qrcodes  where userID =?", [autherized.id]);
            if (!exists[0].present) {
                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: "",
                    data: { generatedText: exists[0].qrcodetext + ":" + autherized.id },
                    errors: {},
                });
            }
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.checkoutFirst"),
                data: {},
                errors: {},
            });
        }
        const userQrCode = {
            userID: autherized.id,
            qrcodetext: generatedtext,
        };
        await query("insert into qrcodes set ? ", userQrCode);

        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: { generatedText: generatedtext + ":" + autherized.id },
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
//==========================================  scan text  ==========================================//
const datascanned = [
    body('generatedtext')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("error.generatedtext");
            }
            return true;
        }),
    // body("tripID").isString().withMessage("error.tripIDNOTExistsID"),
];
router2.post("/scan", datascanned, autherized, async (req, res) => {//incomplete// tripid or scan for which trip
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array();
            const translatedErrors = errors.array().map((error) => ({
                ...error,
                msg: req.t(error.msg),
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                data: {},
                errors: {
                    general: { ...translatedErrors },
                },
            });
        }
        const autherized = res.locals.autherized;
        const splitGeneratedtext = req.body.generatedtext.split(":");
        const generatedtextData = splitGeneratedtext[0];
        const id = splitGeneratedtext[1];
        const userGExist = await query("select * from qrcodes where userID=? AND qrcodetext=?", [autherized.id, generatedtextData]);
        if (!userGExist[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.textnotExists"),
                data: {},
                errors: {},
            });
        }


        const present = userGExist[0].present;
        if (present) {
            await query("delete from qrcodes where userID=?", [
                id,
            ]);
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("checkedout"),
                data: {},
                errors: {},
            });
        }
        if (!present) {

            await query("update qrcodes set present=?  where userID=?", [
                1,
                id,
            ]);

            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("checkedin"),
                data: {},
                errors: {},
            });
        }

        return res.status(400).json({
            status: false,
            code: 400,
            msg: req.t("error.checkError"),
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
//==========================================  add address   ==========================================//
const isFloat = require("./travelsOperations.js").isFloat
const favAddress1 = (value, { req }) => {
    const { longitude } = req.body;
    if ((!isFloat(longitude)) || (parseFloat(longitude) < -180.0 || parseFloat(longitude) > 180.0)) {
        throw new Error('validation.AddressNotExist');
    }
    return true;
};
const favAddress2 = (value, { req }) => {
    const { latitude } = req.body;
    if ((!isFloat(latitude) || (parseFloat(latitude) < -85.05112878 || parseFloat(latitude) > 85.05112878))) {
        throw new Error('validation.AddressNotExist');
    }
    return true;
};
const addAdress = [
    body('title')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.titleNotExists");
            }
            return true;
        }),
    body("longitude").custom(favAddress1),
    body("latitude").custom(favAddress2),
];
router2.post("/fav", addAdress, autherized, async (req, res) => {//complete
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array();
            const translatedErrors = errors.array().map((error) => ({
                ...error,
                msg: req.t(error.msg),
            }));
            return res.status(400).json({
                status: false,
                code: 400,
                data: {},

                errors: {
                    general: { ...translatedErrors },
                },
            });
        }
        const autherized = res.locals.autherized;
        const { title, longitude, latitude } = req.body
        const favAddres = {
            title: title,
            userID: autherized.id,
            longitude: longitude,
            latitude: latitude
        }
        await query("insert into favaddress set ?", favAddres)

        return res.status(200).json({
            status: true,
            code: 200,
            msg: req.t("added"),
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
//==========================================  get inbox data  ==========================================//
const paginatedResults = async (page, limit, id) => {
    const startIndex = (page - 1) * limit;
    const user = "user";
    const result = await query("select * from inbox where userID =? limit ? offset ?", [id, (limit + 1), startIndex])
    console.log(result);
    // const query2 = `select * from ${tableName} where type = ? limit ? offset ?`;
    // const result = await query(query2, [user, (limit + 1), startIndex]);
    const userData = {
        result: result,
        statusPrevious: true,
        statusNext: true,
        numRecords: (await query(`select count(*) as countinbox from inbox where userID =${id}`))[0].countinbox
    }
    if (!(result.length == limit + 1)) {
        userData.statusNext = false
    }
    if (result.length == limit + 1) {
        await userData.result.pop();
    }

    if (startIndex == 0) {
        userData.statusPrevious = false
    }



    return userData;
};
router2.get("/inbox", autherized, async (req, res) => {//completed
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
        const autherized = res.locals.autherized;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const inboxData = await paginatedResults(pageNumber, limitNumber, autherized.id)
        if (inboxData.result[0]) {
            return res.status(200).json({
                status: true,
                code: 200,
                msg: "",
                data: inboxData,
                errors: {},
            });
        }
        return res.status(400).json({
            status: false,
            code: 400,
            msg: req.t("error.finishPresenting"),
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
//==========================================  get fav address  ==========================================//
router2.get("/fav", autherized, async (req, res) => {//completed
    try {
        const autherized = res.locals.autherized;
        const favAddresses = await query("select * from favaddress where userID =? ", autherized.id)
        if (favAddresses[0]) {
            return res.status(200).json({
                status: true,
                code: 200,
                msg: "",
                data: favAddresses,
                errors: {},
            });
        }
        return res.status(400).json({
            status: false,
            code: 400,
            msg: req.t("error.adressesNotExists"),
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
//==========================================  get fav address  ==========================================//
router2.post("/promo", autherized, async (req, res) => {//incomplete//completed
    try {
        const { promo } = req.body
        if (!promo) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("validation.promoNotExists"),
                data: {},
                errors: {},
            });
        }
        // const autherized = res.locals.autherized;
        const promoInfo = (await query("select promo, counter  from variety where id=2"))[0]
        const promoExist = promoInfo.promo;
        if (parseInt(promoInfo.counter) == 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("error.promoFinished"),
                data: {},
                errors: {},
            });
        }
        if (promoInfo.promo == promo) {
            //execute the operations of the promo code
            await query("update variety set counter=? where id=2", (parseInt(promoInfo.counter) - 1))
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("promo"),
                data: {},
                errors: {},
            });
        }
        return res.status(400).json({
            status: false,
            code: 400,
            msg: req.t("error.promoNotcorrect"),
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

module.exports = router2;

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
