const router8 = require('express').Router();
const conn = require("../db/connection.js");
const util = require("util");//helper in queries 
const userAuth = require("../middleware/user.js");
const { body, validationResult } = require('express-validator');
// const adminAuth = require("../middleware/admin.js");
const query = util.promisify(conn.query).bind(conn); //transform query into a promise to use [await/async]
exports.query = query;
const upload = require("../middleware/uploadImages.js");
const fs = require("fs");
const multer = require('multer');
const phoneNumber = require('libphonenumber-js')
const bcrypt = require("bcrypt");
const { promises } = require('dns');

const haversine = require('haversine-distance')

// const a = { lat: 37.8136, lng: 144.9631 }
// const b = { lat: 33.8650, lon: 151.2094 }

// console.log(haversine(a, b))

// const paginatedResults1 = async (tableName, page, limit) => {
//     const startIndex = (page - 1) * limit;
//     const user = "user";
//     const query2 = `select * from ${tableName} where type = ? limit ? offset ?`;
//     const result = await query(query2, [user, (limit + 1), startIndex]);
//     const userData = {
//         result: result,
//         statusPrevious: true,
//         statusNext: true
//     }
//     if (!(result.length == limit + 1)) {
//         userData.statusNext = false
//     }
//     if (result.length == limit + 1) {
//         await userData.result.pop();
//     }

//     if (startIndex == 0) {
//         userData.statusPrevious = false
//     }



//     return userData;
// };

const paginatedResults = async (tableName, goBack, page, limit) => {
    const startIndex = (page - 1) * limit;
    const query2 = `select * from ${tableName} where goBack =?  limit ? offset ?`;
    const result = await query(query2, [user, goBack, (limit + 1), startIndex]);
    const tripData = {
        result: result,
        statusPrevious: true,
        statusNext: true
    }
    if (!(result.length == limit + 1)) {
        tripData.statusNext = false
    }
    if (result.length == limit + 1) {
        await tripData.result.pop();
    }

    if (startIndex == 0) {
        tripData.statusPrevious = false
    }



    return tripData;
};

//========================== get trips for you ==========================//

const requestTripValidation = [
    body('longitudeCurrent').isFinite().withMessage('validation.AddressNotExists'),
    body('latitudeCurrent').isFinite().withMessage('validation.AddressNotExists'),
    body('longitudeDestination').isFinite().withMessage('validation.AddressNotExists'),
    body('latitudeDestination').isFinite().withMessage('validation.AddressNotExists'),
]
router8.get("/tripsforyou", requestTripValidation, userAuth, async (req, res) => {//completed4
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array();
            const translatedErrors = errors.array().map(error => ({
                ...error,
                msg: req.t(error.msg)
            }));
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
        const dataCurrent = await query(` select * from stations where ${haversine.sql('latitude', 'longitude', latitudeCurrent, longitudeCurrent, 1000)}`)
        const dataDestination = await query(` select * from stations where ${haversine.sql('latitude', 'longitude', latitudeDestination, longitudeDestination, 1000)}`)
        const matchingResults = dataCurrent.filter(currentRow =>
            dataDestination.some(destRow => destRow.tripID == currentRow.tripID)
        );
        const uniqueTrip = Array.from(new Set(matchingResults.map(row => row.tripID)));
        const allTripsDetails = []
        const getTripDetaile=async (tripid)=> {
            const tripDetails = await query('select * from trips where id=? ', tripid)
            // const tripstations = await query("select * from stations where tripID=?", tripid)
            const allTrip = {
                ...tripDetails,
                // stations: tripstations
            }
            allTripsDetails.push(allTrip);
        }

        await Promise.all(uniqueTrip.map(getTripDetaile))
        if (!allTripsDetails[0]) {
            const tripsDestinationIDs = []
            const getid = (station) => {
                tripsDestinationIDs.push(station.tripID)
            }
            dataDestination.map(getid);
            await Promise.all(tripsDestinationIDs.map(getTripDetaile))
            if (allTripsDetails[0]) {
                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("error.NotripsforyouButThatSuggestions"),
                    data: {},
                    errors: {},
                });
            }
            return res.status(404).json({
                status: false,
                code: 404,
                msg: req.t("error.Notrips"),
                data: {},
                errors: {},
            });
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: allTripsDetails,
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


//========================== get all trip stations by id ==========================//
router8.get("/alltripstations", userAuth, async (req, res) => {//completed4
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
        const tripStations = await query("select * from stations where tripID=?", id);
        if (!tripStations[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.tripStationsNOTExists"),
                data: {},
                errors: {},
            });
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: tripStations,
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


//========================== get all trips  ==========================//
router8.get("/alltrips", userAuth, async (req, res) => {//completed4
    try {
        const { page, limit } = req.query;
        const { goBack }=req.body
        if (!(limit || page || goBack)) {
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
        const data = await paginatedResults("trips", goBack, pageNumber, limitNumber);
        if (data.result.length == 0) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.noTripData"),
                data: {},
                errors: {},
            });
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: data,
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

//========================== get all trips by time ==========================//
const requestTripValidationByTime = [
    body('startTime').isFinite().withMessage('validation.startTime'),
    body('endTime').isFinite().withMessage('validation.endTime'),
]
router8.get("/alltripsbytime", requestTripValidationByTime, userAuth, async (req, res) => {//completed4
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorlink = errors.array();
            const translatedErrors = errors.array().map(error => ({
                ...error,
                msg: req.t(error.msg)
            }));
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
        const { page, limit } = req.query;
        const { goBack}=req.body
        if (!(limit || page || goBack )) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.limitPage"),
                data: {},
                errors: {},
            });
        }
        if (!(goBack == 1 || goBack == 0)) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.goBack"),
                data: {},
                errors: {},
            });
        }
        const { startTime, endTime } = req.body;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const startIndex = (pageNumber - 1) * limit;
        const data = await query("select * from trips where startH=? AND endH=? AND goBack =? limit ? offset ?", [startTime, endTime, goBack, limitNumber+1, startIndex]);
        const tripsdata = {
            result: result,
            statusPrevious: true,
            statusNext: true,
            numRecords: (await query(`select count(*) as counttrips from trips where startH=? AND endH=? AND  goBack =?`, [startTime, endTime, goBack]))[0].counttrips
        }
        if (startIndex == 0) {
            tripsdata.statusPrevious = false
        }

        if (!(data.length == limit + 1)) {
            tripsdata.statusNext = false
        }

        if (data.length == limit + 1) {
            await tripsdata.result.pop();
        }

        if (tripsdata.result.length == 0) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: req.t("error.noTripData"),
                data: {},
                errors: {},
            });
        } else {
            
            return res.status(200).json({
                status: true,
                code: 200,
                msg: "",
                data: tripsdata,
                errors: {},
            });
        }
        

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

//================================= create new trip  =================================//

// router8.post("/createtravel", adminAuth, async (req, res) => {
//     try {
//         const { id } = req.query
//         if (!id) {
//             return res.status(400).json({
//                 status: false,
//                 code: 400,
//                 msg: req.t("error.userIDNOTExistsID"),
//                 data: {},
//                 errors: {},
//             });
//         }
//         checkExistss = await query("select * from users where id=?", id);
//         if (!checkExistss[0]) {
//             return res.status(400).json({
//                 status: false,
//                 code: 400,
//                 msg: req.t("error.noUser"),
//                 data: {},
//                 errors: {},
//             });
//         }
//         await query("delete from users where id = ? ", id)
//         deleteFileIfExists("./upload/" + checkExistss[0].profile_image)
//         // fs.unlinkSync("./upload/" + checkExistss[0].profile_image); //delete image

//         return res.status(200).json({
//             status: true,
//             code: 200,
//             msg: req.t("deleted"),
//             data: {},
//             errors: {},

//         })

//     } catch (err) {
//         console.log(err);
//         return res.status(500).json({
//             status: false,
//             code: 500,
//             msg: "",
//             data: {},
//             errors: { serverError: err },
//         });
//     }
// });


module.exports = router8;
