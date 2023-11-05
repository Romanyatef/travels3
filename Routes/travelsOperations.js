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
const readXlsxFile = require('read-excel-file/node');
const haversine = require('haversine-distance')
const moment = require('moment-timezone');
const autherized = require('../middleware/autherized.js');
const { isDate } = require('util/types');
function isFloat(value) {
    const floatRegex = /^-?\d+(?:\.\d+)?$/;
    return floatRegex.test(value);

}
const paginatedResults = require("./contactus.js").paginatedResults

//================================= create new trip  =================================//

function validateCoordinates(longitude, latitude) {
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lon) || lon < -180 || lon > 180) {
        return false;
    }

    if (isNaN(lat) || lat < -90 || lat > 90) {
        return false;
    }

    return true;
}

async function readExcelFile(filePath) {
    try {
        const rows = await readXlsxFile(filePath);
        const headerLabels = rows[0];
        const arrays = []; // Changed: Use an array to hold arrays instead of objects

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const arr = []; // Changed: Use an array instead of an object

            const isRowFilled = row.every((cell, index) => {
                const label = headerLabels[index] || '';
                const value = String(cell) || '';
                return label.trim() !== '' && value.trim() !== '';
            });

            if (!isRowFilled) {
                console.log(`Row ${i + 1} is incomplete. Skipping...`);
                return false;
            }

            const gpsCoordinates = row[headerLabels.indexOf('GPS Coordinates')];
            const [longitude, latitude] = gpsCoordinates.split(',');

            if (!validateCoordinates(longitude, latitude)) {
                return false;
            }
            const timeGo = row[headerLabels.indexOf('Arrival Time Go')]
            const timeBack = row[headerLabels.indexOf('Arrival Time Back')]
            if (!(isDate(timeGo) || isDate(timeBack))) {
                return false
            }
            headerLabels.forEach((label, index) => {
                const value = row[index];
                arr.push(value); // Changed: Push value into the array
            });

            arrays.push(arr); // Changed: Push the array into the arrays array
        }

        return arrays; // Changed: Return the arrays array
    } catch (error) {
        console.error(error);
        return false;
    }
}
async function validateData(data) {
    try {
        const requiredKeys = ["DirectionsDetails", "GPSCoordinates", "Address", "ArrivalTimeBack", "ArrivalTimeGo", "BusStop"];//you musk make the user enter it in some order or you make an array you forget to alter the array 
        if (!Array.isArray(data)) {
            return {
                status: false
            };
        }
        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            const isRowFilled = requiredKeys.every((key) => {
                const value = row[key] || '';
                const trimmedValue = String(value).trim();
                return {
                    status: trimmedValue !== ''
                };

            });

            if (!isRowFilled) {
                console.log(`Row ${i + 1} is incomplete. Skipping...`);
                console.log("hello1");
                return {
                    status: false
                };
            }

            const gpsCoordinates = row['GPSCoordinates'];
            const [longitude, latitude] = gpsCoordinates.split(',');

            if (!validateCoordinates(longitude, latitude)) {
                console.log("hello2");
                return {
                    status: false
                };
            }

            const timeGo = row['Arrival Time Go'];
            const timeBack = row['ArrivalTimeBack'];

            if (!(isDate(new Date("2000-12-12" + timeGo)) || isDate(new Date("2000-12-12" + timeBack)))) {
                console.log("hello3");
                return {
                    status: false
                };
            }
        }

        const array = []
        data.map((e) => {
            let station = [0, e.BusStop, e.ArrivalTimeGo, e.ArrivalTimeBack, e.Address, e.GPSCoordinates, e.DirectionsDetails]
            array.push(station)
        })
        return {
            status: true,
            data: array
        };
    } catch (err) {
        console.log(err);
        return false
    }

}


const travelvalidation = [
    body('name')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 29) {

                throw new Error("validation.nameNotExcists");
            }
            return true;
        }),
    body('description')
        .custom((value, { req }) => {
            if (typeof value !== "string" || !isNaN(parseInt(value)) || value.length <= 3 || value.length >= 100) {

                throw new Error("validation.descriptionNotExcists");
            }
            return true;
        }),
    body('vehicleIDGo').isNumeric().withMessage('validation.vehicleGoIDNotExcists'),
    body('vehicleIDBack').isNumeric().withMessage('validation.vehicleBackIDNotExcists'),
    body('driveridGo').isNumeric().withMessage('validation.driverGoIDNotExcists'),
    body('driveridBack').isNumeric().withMessage('validation.driverBackIDNotExcists'),
    body('price').isNumeric().withMessage('validation.priceNotExcists'),
]

router8.post("/createtravel", upload.single('excelFile'), travelvalidation, async (req, res) => {//completed
    try {
        if (!Array.isArray(req.body.stationsArray)) {
            if (!req.file) {
                return res.status(400).json({
                    status: false,
                    code: 400,
                    msg: "",
                    data: {},
                    errors: { excelNotExists: req.t("error.excelNotExists") }
                })
            }
        }
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (!req.body.stationsArray) {
                if (req.file) {
                    fs.unlinkSync("./upload/" + req.file.filename); //delete file
                }
            } 
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }
        let stations = [];
        if (req.file) {

        stations = await readExcelFile("./upload/" + req.file.filename)            
            if (req.file) {
                fs.unlinkSync("./upload/" + req.file.filename); //delete image
            }
            if (!stations) {
                return res.status(400).json({
                    status: false,
                    code: 400,
                    msg: "",
                    data: {},
                    errors: { excelError: req.t("error.excelError") }
                })
            }
        }
        else {
            if (req.body.stationsArray) {
                console.log("hello");

                const isValid44 = (await validateData(req.body.stationsArray))
                if (isValid44.status) {
                    stations = isValid44.data
                } else {
                    return res.status(400).json({
                        status: false,
                        code: 400,
                        msg: "",
                        data: {},
                        errors: { dataError: req.t("error.dataError") }
                    })
                }
            }

        }
        // return res.status(200).json({
        //     data: stations.sort((a, b) => a.ID - b.ID)
        // })

        const { name, driveridGo, driveridBack, description, vehicleIDGo, vehicleIDBack, price } = req.body
        const driverExists = [await query("select * from driver where id=? ", [driveridGo]), await query("select * from driver where id=? ", [driveridBack]),];
        if (!(Boolean(driverExists[0][0]) && Boolean(driverExists[1][0]))) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { noDriver: req.t("error.noDriver") },
            })
        }
        const vehicleExists = [await query("select * from vehicles where id=?", [vehicleIDGo]), await query("select * from vehicles where id=?", [vehicleIDBack])]
        if (!(Boolean(vehicleExists[0][0]) && Boolean(vehicleExists[1][0]))) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { vehicleNotExists: req.t("validation.vehicleNotExists") },
            })
        }
        // console.log(moment(new Date(new Date().setHours(..."10:10:10".split(':')) )).tz('Africa/Cairo').format("HH:mm:ss"));

        // console.log(vehicleExists[0].seats);
        // if (!(vehicleExists[0].seats >= passengersNum)) {
        //     return res.status(400).json({
        //         status: false,
        //         code: 400,
        //         msg: req.t("validation.vehicleNotValid"),
        //         data: {},
        //         errors: {},
        //     })
        // }
        // console.log(moment(stations[0][2]).tz('Africa/Cairo').format("HH:mm:ss"));
        // const startH = moment(new Date(new Date().setHours(...stations[0][2].toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
        // const endH = moment(moment().format('YYYY-MM-DD') + 'T' +stations[stations.length - 1][2]).tz('Africa/Cairo').format("HH:mm:ss")
        // const endH = moment(new Date(new Date().setHours(stations[stations.length - 1][2].toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
        if (req.file) {
            const startHGo = moment(stations[0][2]).tz('Africa/Cairo').format("HH:mm:ss")
            const endHGo = moment(stations[stations.length - 1][2]).tz('Africa/Cairo').format("HH:mm:ss")
            const startHBack = moment(stations[0][3]).tz('Africa/Cairo').format("HH:mm:ss")
            const endHBack = moment(stations[stations.length - 1][3]).tz('Africa/Cairo').format("HH:mm:ss")
            // check vehicle valid
            const trips = await query("select * from trips where vehicleIDGo=? or vehicleIDBack=? ", [vehicleIDGo, vehicleIDBack])

            if (trips.length >= 1) {
                const selectedTrips = trips.filter(trip => {
                    const tripStartHGo = moment(new Date(new Date().setHours(...trip.startHGo.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
                    const tripEndHGo = moment(new Date(new Date().setHours(...trip.endHGo.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
                    if (((tripStartHGo <= startHGo && tripEndHGo >= startHGo) ||
                        (tripStartHGo <= endHGo && tripEndHGo >= endHGo) ||
                        (tripStartHGo >= startHGo && tripEndHGo <= endHGo))) {
                        return true;
                    }
                    const tripStartHBack = moment(new Date(new Date().setHours(...trip.startHBack.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
                    const tripEndHBack = moment(new Date(new Date().setHours(...trip.endHBack.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")

                    if (((tripStartHBack <= startHBack && tripEndHBack >= startHBack) ||
                        (tripStartHBack <= endHBack && tripEndHBack >= endHBack) ||
                        (tripStartHBack >= startHBack && tripEndHBack <= endHBack))) {
                        return true;
                    }
                    return false;
                });

                if (selectedTrips[0]) {
                    return res.status(400).json({
                        status: false,
                        code: 400,
                        msg: "",
                        data: selectedTrips,
                        errors: { vehicleNotvalidTime: req.t("error.vehicleNotvalidTime") },
                    })
                }
            }
            // check driver valid
            const driverTripsGo = await query("select * from trips where driveridGo=?", driveridGo);
            const driverTripsBack = await query("select * from trips where driveridBack=?", driveridBack);
            if (driverTripsGo[0]) {
                let counterGo = 0;
                await Promise.all(driverTripsGo.map(async (trip) => {
                    console.log(trip.startHGo);
                    console.log(trip.endHGo);
                    const format = 'HH:mm:ss';
                    const tripStartHGo = moment(trip.startHGo, format).tz('Africa/Cairo').format(format);
                    const tripEndHGo = moment(trip.endHGo, format).tz('Africa/Cairo').format(format);
                    const duration = moment.duration(moment(tripEndHGo, format).diff(moment(tripStartHGo, format)));
                    const differenceInMinutes = duration.asMinutes();
                    console.log(tripStartHGo);
                    console.log(tripEndHGo);
                    counterGo = counterGo + differenceInMinutes;

                }));

                if (counterGo / 60 >= 8) {
                    return res.status(400).json({
                        status: false,
                        code: 400,
                        msg: "",
                        data: driverTripsGo,
                        errors: { driverNotvalidTime: req.t("error.driverNotvalidTime" + " :" + driveridGo) },
                    })
                }
            }
            if (driverTripsBack[0]) {
                let counterBack = 0;
                await Promise.all(driverTripsBack.map(async (trip) => {
                    const format = 'HH:mm:ss';
                    const tripStartHBack = moment(new Date(new Date().setHours(...trip.startHBack.toString().split(':')))).tz('Africa/Cairo').format(format)
                    const tripEndHBack = moment(new Date(new Date().setHours(...trip.endHBack.toString().split(':')))).tz('Africa/Cairo').format(format)
                    const duration = moment.duration(moment(tripEndHBack, format).diff(moment(tripStartHBack, format)));
                    const differenceInMinutes = duration.asMinutes();

                    counterBack = counterBack + differenceInMinutes

                }));
                if (counterBack / 60 >= 8) {
                    return res.status(400).json({
                        status: false,
                        code: 400,
                        msg: "",
                        data: driveridBack,
                        errors: { driverNotvalidTime: req.t("error.driverNotvalidTime" + " :" + driveridBack) },
                    })
                }

            }
            const trip = {
                name: name,
                driveridGo: driveridGo,
                driveridBack: driveridBack,
                vehicleIDGo: vehicleIDGo,
                vehicleIDBack: vehicleIDBack,
                description: description,
                startHGo: startHGo,
                endHGo: endHGo,
                startHBack: startHBack,
                endHBack: endHBack,
                price: price,
            }
            const insertion = await query("insert into trips set ?", trip);
            const id = insertion.insertId

            await Promise.all(stations.map(async (stationArray, index) => {
                const isFirstIteration = index === 0;
                const isLastIteration = index === stations.length - 1;
                const [latitude, longitude] = stationArray[5].split(",");

                const station = {
                    tripID: id,
                    longitude: longitude,
                    latitude: latitude,
                    name: stationArray[1],
                    timeArriveGo: moment(stationArray[2]).tz('Africa/Cairo').format("HH:mm:ss"),
                    timeArriveBack: moment(stationArray[3]).tz('Africa/Cairo').format("HH:mm:ss"),
                    // timeArriveGo: moment(stationArray[2]).tz('Africa/Cairo').format("HH:mm:ss"),
                    details: stationArray[6],
                    address: stationArray[4],
                };
                if (isFirstIteration) {
                    station.startEnd = 0
                    station.ranking = 1
                } else
                    if (isLastIteration) {
                        station.startEnd = 1
                        station.ranking = stations.length
                    } else {
                        station.ranking = index + 1
                    }
                await query("insert into stations set ?", station);
            }));
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("added"),
                data: {},
                errors: {},
            });
        }
        else {
            const startHGo = moment(stations[0][2], "HH:mm:ss").tz('Africa/Cairo').format("HH:mm:ss")
            const endHGo = moment(stations[stations.length - 1][2], "HH:mm:ss").tz('Africa/Cairo').format("HH:mm:ss")
            const startHBack = moment(stations[0][3], "HH:mm:ss").tz('Africa/Cairo').format("HH:mm:ss")
            const endHBack = moment(stations[stations.length - 1][3], "HH:mm:ss").tz('Africa/Cairo').format("HH:mm:ss")
            // check vehicle valid
            const trips = await query("select * from trips where vehicleIDGo=? or vehicleIDBack=? ", [vehicleIDGo, vehicleIDBack])

            if (trips.length >= 1) {
                const selectedTrips = trips.filter(trip => {
                    const tripStartHGo = moment(new Date(new Date().setHours(...trip.startHGo.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
                    const tripEndHGo = moment(new Date(new Date().setHours(...trip.endHGo.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
                    if (((tripStartHGo <= startHGo && tripEndHGo >= startHGo) ||
                        (tripStartHGo <= endHGo && tripEndHGo >= endHGo) ||
                        (tripStartHGo >= startHGo && tripEndHGo <= endHGo))) {
                        return true;
                    }
                    const tripStartHBack = moment(new Date(new Date().setHours(...trip.startHBack.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
                    const tripEndHBack = moment(new Date(new Date().setHours(...trip.endHBack.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")

                    if (((tripStartHBack <= startHBack && tripEndHBack >= startHBack) ||
                        (tripStartHBack <= endHBack && tripEndHBack >= endHBack) ||
                        (tripStartHBack >= startHBack && tripEndHBack <= endHBack))) {
                        return true;
                    }
                    return false;
                });

                if (selectedTrips[0]) {
                    return res.status(400).json({
                        status: false,
                        code: 400,
                        msg: "",
                        data: selectedTrips,
                        errors: { vehicleNotvalidTime: req.t("error.vehicleNotvalidTime") },
                    })
                }
            }
            // check driver valid
            const driverTripsGo = await query("select * from trips where driveridGo=?", driveridGo);
            const driverTripsBack = await query("select * from trips where driveridBack=?", driveridBack);
            if (driverTripsGo[0]) {
                let counterGo = 0;
                await Promise.all(driverTripsGo.map(async (trip) => {
                    const format = 'HH:mm:ss';
                    const tripStartHGo = moment(trip.startHGo, format).tz('Africa/Cairo').format(format);
                    const tripEndHGo = moment(trip.endHGo, format).tz('Africa/Cairo').format(format);
                    const duration = moment.duration(moment(tripEndHGo, format).diff(moment(tripStartHGo, format)));
                    const differenceInMinutes = duration.asMinutes();
                    counterGo = counterGo + differenceInMinutes;

                }));

                if (counterGo / 60 >= 8) {
                    return res.status(400).json({
                        status: false,
                        code: 400,
                        msg: "",
                        data: driverTripsGo,
                        errors: { driverNotvalidTime: req.t("error.driverNotvalidTime" + " :" + driveridGo) },
                    })
                }
            }
            if (driverTripsBack[0]) {
                let counterBack = 0;
                await Promise.all(driverTripsBack.map(async (trip) => {
                    const format = 'HH:mm:ss';
                    const tripStartHBack = moment(new Date(new Date().setHours(...trip.startHBack.toString().split(':')))).tz('Africa/Cairo').format(format)
                    const tripEndHBack = moment(new Date(new Date().setHours(...trip.endHBack.toString().split(':')))).tz('Africa/Cairo').format(format)
                    const duration = moment.duration(moment(tripEndHBack, format).diff(moment(tripStartHBack, format)));
                    const differenceInMinutes = duration.asMinutes();

                    counterBack = counterBack + differenceInMinutes

                }));
                if (counterBack / 60 >= 8) {
                    return res.status(400).json({
                        status: false,
                        code: 400,
                        msg: "",
                        data: driveridBack,
                        errors: { driverNotvalidTime: req.t("error.driverNotvalidTime" + " :" + driveridBack) },
                    })
                }

            }
            const trip = {
                name: name,
                driveridGo: driveridGo,
                driveridBack: driveridBack,
                vehicleIDGo: vehicleIDGo,
                vehicleIDBack: vehicleIDBack,
                description: description,
                startHGo: startHGo,
                endHGo: endHGo,
                startHBack: startHBack,
                endHBack: endHBack,
                price: price,
            }
            const insertion = await query("insert into trips set ?", trip);
            const id = insertion.insertId

            await Promise.all(stations.map(async (stationArray, index) => {
                const isFirstIteration = index === 0;
                const isLastIteration = index === stations.length - 1;
                const [latitude, longitude] = stationArray[5].split(",");

                const station = {
                    tripID: id,
                    longitude: longitude,
                    latitude: latitude,
                    name: stationArray[1],
                    timeArriveGo: moment(stationArray[2], "HH:mm:ss").tz('Africa/Cairo').format("HH:mm:ss"),
                    timeArriveBack: moment(stationArray[3], "HH:mm:ss").tz('Africa/Cairo').format("HH:mm:ss"),
                    // timeArriveGo: moment(stationArray[2]).tz('Africa/Cairo').format("HH:mm:ss"),
                    details: stationArray[6],
                    address: stationArray[4],
                };
                if (isFirstIteration) {
                    station.startEnd = 0
                    station.ranking = 1
                } else
                    if (isLastIteration) {
                        station.startEnd = 1
                        station.ranking = stations.length
                    } else {
                        station.ranking = index + 1
                    }
                await query("insert into stations set ?", station);
            }));
            return res.status(200).json({
                status: true,
                code: 200,
                msg: req.t("added"),
                data: {},
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

const paginatedResults2 = async (tableName, goBack, page, limit) => {
    const startIndex = (page - 1) * limit;
    const query2 = `select * from ${tableName} where goBack =?   limit ?  offset ?`;
    const result = await query(query2, [goBack, (limit + 1), startIndex]);
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
const validateCurrentAddress = (value, { req }) => {
    const { longitudeCurrent } = req.body;

    if ((!isFloat(longitudeCurrent)) || (parseFloat(longitudeCurrent) < -180.0 || parseFloat(longitudeCurrent) > 180.0)) {

        throw new Error('validation.currentAddressNotExists');
    }
    return true;
};
const validateCurrentAddress2 = (value, { req }) => {
    const { latitudeCurrent } = req.body;

    if ((!isFloat(latitudeCurrent)) || (parseFloat(latitudeCurrent) < -85.05112878 || parseFloat(latitudeCurrent) > 85.05112878)) {

        throw new Error('validation.currentAddressNotExists');
    }
    return true;
};
const validateWorkAddress = (value, { req }) => {
    const { latitudeDestination, longitudeDestination } = req.body;

    if ((!isFloat(longitudeDestination)) || (parseFloat(longitudeDestination) < -180.0 || parseFloat(longitudeDestination) > 180.0)) {

        throw new Error('validation.workAddressNotExists');
    }
    return true;
};
const validateWorkAddress2 = (value, { req }) => {
    const { latitudeDestination } = req.body;

    if ((!isFloat(latitudeDestination)) || (parseFloat(latitudeDestination) < -85.05112878 || parseFloat(latitudeDestination) > 85.05112878)) {

        throw new Error('validation.workAddressNotExists');
    }
    return true;
};
const requestTripValidation = [
    body('latitudeCurrent').custom(validateCurrentAddress2),
    body('longitudeCurrent').custom(validateCurrentAddress),
    body('latitudeDestination').custom(validateWorkAddress2),
    body('longitudeDestination').custom(validateWorkAddress),
];

router8.get("/tripsforyou", requestTripValidation, userAuth, async (req, res) => {//completed4
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }

        const { latitudeCurrent, longitudeCurrent, latitudeDestination, longitudeDestination } = req.body
        // const dataCurrent = await query(` select * from stations where ${haversine.sql('latitude', 'longitude', latitudeCurrent, longitudeCurrent, 1000)}`)
        // const dataDestination = await query(`SELECT * FROM stations WHERE ${haversine('latitude', 'longitude', latitudeDestination, longitudeDestination, { unit: 'km' })}`);        
        // const matchingResults = dataCurrent.filter(currentRow =>
        //     dataDestination.some(destRow => destRow.tripID == currentRow.tripID)
        // );
        // const distance = 1; // Distance in kilometers

        // const query1 = `SELECT * FROM stations WHERE ${haversine('latitude', 'longitude', latitude, longitude, { unit: 'km' })} <= ${distance}`
        // const dataDestination = await query(query1,); 
        // const matchingResults = dataCurrent.filter(currentRow =>
        //     dataDestination.some(destRow => destRow.tripID == currentRow.tripID)
        // );

        const matchingResultsCurrent = []
        const matchingResultsdistination = []
        const stations = await query("select * from stations");
        stations.forEach(station => {
            const a = { lat: station.latitude, lng: station.longitude }
            const b = { lat: latitudeCurrent, lng: longitudeCurrent }
            const distance = haversine(a, b)
            if (distance <= 1000) {
                matchingResultsCurrent.push(station.tripID)
            }
            const c = { lat: station.latitude, lng: station.longitude }
            const d = { lat: latitudeDestination, lng: longitudeDestination }
            const distance2 = haversine(c, d)
            if (distance2 <= 1000) {

                matchingResultsdistination.push(station.tripID)
            }

        })
        const matchingResultsCurrent2 = new Set(matchingResultsCurrent);
        const matchingResultsdistination2 = new Set(matchingResultsdistination);
        const intersection = new Set();

        matchingResultsCurrent2.forEach(value => {
            if (matchingResultsdistination2.has(value)) {
                intersection.add(value);
            }
        });
        const intersectionArray = Array.from(intersection);
        const allTripsDetails = [];

        await Promise.all(
            intersectionArray.map(async trip => {
                const tripDetails = await query('select * from trips where id = ?', trip);
                const drivernameGo = await query("select fullName from driver where id = ?", [tripDetails[0].driveridGo]);
                const drivernameBack = await query("select fullName from driver where id = ?", [tripDetails[0].vehicleIDBack]);

                if (drivernameGo[0]) {
                    tripDetails[0].driveridGo = drivernameGo[0].fullName
                } else {
                    tripDetails[0].drivernameGo = "none"
                }
                if (drivernameBack[0]) {
                    tripDetails[0].vehicleIDBack = drivernameBack[0].fullName
                } else {
                    tripDetails[0].vehicleIDBack = "none"
                }
                const allTrip = tripDetails[0];
                allTripsDetails.push(allTrip);
            })
        );
        if (!allTripsDetails[0]) {
            await Promise.all(
                Array.from(matchingResultsdistination2).map(async trip => {
                    const tripDetails = await query('select * from trips where id = ?', trip);
                    const drivernameGo = await query("select fullName from driver where id = ?", [tripDetails[0].driveridGo]);
                    const drivernameBack = await query("select fullName from driver where id = ?", [tripDetails[0].vehicleIDBack]);

                    if (drivernameGo[0]) {
                        tripDetails[0].driveridGo = drivernameGo[0].fullName
                    } else {
                        tripDetails[0].drivernameGo = "none"
                    }
                    if (drivernameBack[0]) {
                        tripDetails[0].vehicleIDBack = drivernameBack[0].fullName
                    } else {
                        tripDetails[0].vehicleIDBack = "none"
                    }
                    const allTrip = tripDetails[0];
                    allTripsDetails.push(allTrip);
                })
            );
            if (allTripsDetails[0]) {
                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: req.t("error.NotripsforyouButThatSuggestions"),
                    data: allTripsDetails,
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

// //========================== get trips for you ==========================//
// router8.get("/worktrips", userAuth, async (req, res) => {//completed4*******************************************
//     try {
//         const user1 = res.locals.user;
//         // const latitudeCurrent = user1.homeAddressLat
//         // const longitudeCurrent = user1.homeAddressLong
//         const stationId = await query("select * from stations where id=?", user1.workAddress)
//         const latitudeDestination = user1.workAddressLat
//         const longitudeDestination = user1.workAddressLong
//         // const dataCurrent = await query(` select * from stations where ${haversine.sql('latitude', 'longitude', latitudeCurrent, longitudeCurrent, 1000)}`)
//         // const dataDestination = await query(`SELECT * FROM stations WHERE ${haversine('latitude', 'longitude', latitudeDestination, longitudeDestination, { unit: 'km' })}`);
//         // const matchingResults = dataCurrent.filter(currentRow =>
//         //     dataDestination.some(destRow => destRow.tripID == currentRow.tripID)
//         // );
//         // const distance = 1; // Distance in kilometers

//         // const query1 = `SELECT * FROM stations WHERE ${haversine('latitude', 'longitude', latitude, longitude, { unit: 'km' })} <= ${distance}`
//         // const dataDestination = await query(query1,);
//         // const matchingResults = dataCurrent.filter(currentRow =>
//         //     dataDestination.some(destRow => destRow.tripID == currentRow.tripID)
//         // );

//         const matchingResultsCurrent = []
//         // const matchingResultsdistination = []
//         const stations = await query("select * from stations where startEnd=1");
//         stations.forEach(station => {
//             const a = { lat: station.latitude, lng: station.longitude }
//             const b = { lat: latitudeCurrent, lng: longitudeCurrent }
//             const distance = haversine(a, b)
//             if (distance <= 1000) {
//                 matchingResultsCurrent.push(station.tripID)
//             }
//             const c = { lat: station.latitude, lng: station.longitude }
//             const d = { lat: latitudeDestination, lng: longitudeDestination }
//             const distance2 = haversine(c, d)
//             if (distance2 <= 1000) {

//                 matchingResultsdistination.push(station.tripID)
//             }

//         })
//         // const matchingResultsCurrent2 = new Set(matchingResultsCurrent);
//         // const matchingResultsdistination2 = new Set(matchingResultsdistination);
//         // const intersection = new Set();

//         // matchingResultsCurrent2.forEach(value => {
//         //     if (matchingResultsdistination2.has(value)) {
//         //         intersection.add(value);
//         //     }
//         // });
//         // const intersectionArray = Array.from(intersection);

//         const allTripsDetails = [];
//         await Promise.all(
//             intersectionArray.map(async trip => {
//                 const tripDetails = await query('select * from trips where id = ?', trip);
//                 const drivernameGo = await query("select fullName from driver where id = ?", [tripDetails[0].driveridGo]);
//                 const drivernameBack = await query("select fullName from driver where id = ?", [tripDetails[0].vehicleIDBack]);
//                 if (drivernameGo[0]) {
//                     tripDetails[0].driveridGo = drivernameGo[0].fullName
//                 } else {
//                     tripDetails[0].drivernameGo = "none"

//                 }
//                 if (drivernameBack[0]) {
//                     tripDetails[0].vehicleIDBack = drivernameBack[0].fullName
//                 } else {
//                     tripDetails[0].vehicleIDBack = "none"
//                 }
//                 const allTrip = tripDetails[0];
//                 allTripsDetails.push(allTrip);
//             })
//         );
//         if (!allTripsDetails[0]) {

//             await Promise.all(
//                 Array.from(matchingResultsdistination2).map(async trip => {
//                     const tripDetails = await query('select * from trips where id = ?', trip);
//                     const drivernameGo = await query("select fullName from driver where id = ?", [tripDetails[0].driveridGo]);
//                     const drivernameBack = await query("select fullName from driver where id = ?", [tripDetails[0].vehicleIDBack]);
//                     if (drivernameGo[0]) {
//                         tripDetails[0].driveridGo = drivernameGo[0].fullName
//                     } else {
//                         tripDetails[0].drivernameGo = "none"

//                     }
//                     if (drivernameBack[0]) {
//                         tripDetails[0].vehicleIDBack = drivernameBack[0].fullName
//                     } else {
//                         tripDetails[0].vehicleIDBack = "none"
//                     }
//                     const allTrip = tripDetails[0];
//                     allTripsDetails.push(allTrip);
//                 })
//             );
//             if (allTripsDetails[0]) {
//                 return res.status(200).json({
//                     status: true,
//                     code: 200,
//                     msg: req.t("error.NotripsforyouButThatSuggestions"),
//                     data: allTripsDetails,
//                     errors: {},
//                 });
//             }
//             return res.status(404).json({
//                 status: false,
//                 code: 404,
//                 msg: req.t("error.Notrips"),
//                 data: {},
//                 errors: {},
//             });
//         }
//         return res.status(200).json({
//             status: true,
//             code: 200,
//             msg: "",
//             data: allTripsDetails,
//             errors: {},
//         });

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
//========================== get trips for you ==========================//
router8.get("/alltrips2", userAuth, async (req, res) => {//completed4*******************************************
    try {
        const { page, limit } = req.query;
        if (!(Boolean(limit) && Boolean(page))) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { limitPage: req.t("error.limitPage") },
            });
        }
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const trips = await paginatedResults("trips", pageNumber, limitNumber)
        await Promise.all(trips.result.map(async (e) => {
            if (e.status == 1) {
                e.status = req.t("active")
            } else {
                e.status = req.t("inactive")
            }
            if (e.goBack == 1) {
                e.goBack = req.t("Go")
            } else {
                e.goBack = req.t("Back")
            }
            e.vehicleGo = (await query("select vehicleNum,model,seats from vehicles where id=?", e.vehicleIDGo))[0]
            e.vehicleBack = (await query("select vehicleNum,model,seats from vehicles where id=?", e.vehicleIDBack))[0]
            e.driverGo = (await query("select fullName,mobileNumber from driver where id=?", e.driveridGo))[0]
            e.driverBack = (await query("select fullName,mobileNumber from driver where id=?", e.driveridBack))[0]
            delete e.vehicleIDGo
            delete e.vehicleIDBack
            delete e.driveridGo
            delete e.driveridBack

        }))
        if (!trips.result[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { tripIDNOTExistsID: req.t("error.noTripData") },
            });
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: trips,
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
                msg: "",
                data: {},
                errors: { tripIDNOTExistsID: req.t("error.tripIDNOTExistsID") },
            });
        }
        const tripExist = await query("select * from trips where id=?", id)
        if (!tripExist[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { tripIDNOTExists: req.t("error.tripIDNOTExists") },
            });
        }
        const tripStations = await query("select * from stations where tripID=?", id);
        if (!tripStations[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { tripStationsNOTExists: req.t("error.tripStationsNOTExists") },
            });
        }
        tripStations.map((e) => {
            if (parseInt(e.startEnd) == 0) {
                e.startEnd = req.t("start")
            } else {
                if (parseInt(e.startEnd) == 1) {
                    e.startEnd = req.t("end")
                } else {
                    e.startEnd = req.t("notStartOrEnd")
                }
            }
        })
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
//========================== get  trip of station ==========================//
router8.get("/tripofstation", userAuth, async (req, res) => {//completed
    try {
        const { id } = req.query;
        if (!(id)) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { stationIDNOTExistsID: req.t("error.stationIDNOTExistsID") },
            });
        }
        const tripStations = await query("select * from stations where id=?", id);
        if (!tripStations[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { tripStationsNOTExists: req.t("error.tripStationsNOTExists") },
            });
        }
        const tripExist = await query("select * from trips where id=?", tripStations[0].tripID)
        if (!tripExist[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { tripIDNOTExists: req.t("error.tripIDNOTExists") },
            });
        }

        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: tripExist,
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
//========================== get all trip end stations ==========================//
router8.get("/allendstations", userAuth, async (req, res) => {//completed
    try {
        const tripStations = await query("select * from stations where startEnd=?", 1);
        if (!tripStations[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { tripEndStationsNOTExists: req.t("error.tripEndStationsNOTExists") },
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
//========================== get  trip by end station ==========================//
router8.get("/alltripstations2", userAuth, async (req, res) => {//completed
    try {
        const { id } = req.query;
        if (!(id)) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { stationIDNOTExistsID: req.t("error.stationIDNOTExistsID") },
            });
        }
        const stationExist = await query("select * from stations where id=? AND startEnd=1", id)
        console.log(stationExist);
        if (!stationExist[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { stationIDNOTExists: req.t("error.stationIDNOTExists") },
            });
        }
        const trip = await query("select * from trips where id=?", stationExist[0].tripID);
        if (!trip[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { tripNOTExists: req.t("error.tripNOTExists") },
            });
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: trip,
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
//========================== get  trip of work address of the user ==========================//
router8.get("/alltripstations3", userAuth, async (req, res) => {//completed
    try {
        const user1 = res.locals.user
        const stationExist = await query("select * from stations where id=?", user1.workAddress)
        if (!stationExist[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { stationIDNOTExists: req.t("error.stationIDNOTExists") },
            });
        }
        const trip = await query("select * from trips where id=?", stationExist[0].tripID);
        if (!trip[0]) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { tripNOTExists: req.t("error.tripNOTExists") },
            });
        }
        return res.status(200).json({
            status: true,
            code: 200,
            msg: "",
            data: trip,
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
router8.get("/alltrips", autherized, async (req, res) => {//completed4
    try {
        const { page, limit } = req.query;
        const { goBack } = req.body
        if (!(Boolean(limit) && Boolean(page) && (goBack == 1 || goBack == 0))) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { limitPage: req.t("error.limitPage") },
            });
        }
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const goBackNumber = parseInt(goBack)
        const data = await paginatedResults2("trips", goBackNumber, pageNumber, limitNumber);
        if (data.result.length == 0) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { noTripData: req.t("error.noTripData") },
            });
        }

        await Promise.all(data.result.map(async trip => {
            const drivernameGo = await query("select fullName from driver where id = ?", [tripDetails[0].driveridGo]);
            const drivernameBack = await query("select fullName from driver where id = ?", [tripDetails[0].vehicleIDBack]);
            if (drivernameGo[0]) {
                tripDetails[0].driveridGo = drivernameGo[0].fullName
            } else {
                tripDetails[0].drivernameGo = "none"

            }
            if (drivernameBack[0]) {
                tripDetails[0].vehicleIDBack = drivernameBack[0].fullName
            } else {
                tripDetails[0].vehicleIDBack = "none"
            }
        }))
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
    body('startTime').custom((value) => {
        if (!value || typeof value !== 'string') {
            throw new Error('validation.startTime');
        }
        const hours = parseInt(value.substring(0, 2));
        const minutes = parseInt(value.substring(2, 4));
        const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
        if (!timeRegex.test(value) || hours >= 24 || minutes >= 60) {
            throw new Error('validation.startTime');
        }
        return true;
    }),
    body('endTime').custom((value) => {
        if (!value || typeof value !== 'string') {
            throw new Error('validation.endTime');
        }
        const hours = parseInt(value.substring(0, 2));
        const minutes = parseInt(value.substring(2, 4));
        const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
        if (!timeRegex.test(value) || hours >= 24 || minutes >= 60) {
            throw new Error('validation.endTime');
        }
        return true;
    })
]
router8.get("/alltripsbytime", autherized, requestTripValidationByTime, async (req, res) => {//completed4
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const translatedErrors = errors.array().map((error) => ({
                [error.path]: req.t(error.msg)
            }));

            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: translatedErrors.reduce((result, current) => {
                    return { ...result, ...current };
                }, {})
            });
        }
        const { page, limit } = req.query;
        const { goBack } = req.body
        if (!(Boolean(limit) && Boolean(page) && (goBack == 1 || goBack == 0))) {
            return res.status(400).json({
                status: false,
                code: 400,
                msg: "",
                data: {},
                errors: { limitPage: req.t("error.limitPage") },
            });
        }
        const { startTime, endTime } = req.body;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const startIndex = (pageNumber - 1) * limit;

        if (goBack == 0) {
            const data = await query("SELECT * FROM trips WHERE HOUR(startHGo) = HOUR(?) AND HOUR(endHGo) = HOUR(?) AND goBack = ? LIMIT ? OFFSET ?", [startTime, endTime, goBack, limitNumber + 1, startIndex]);
            const tripsdata = {
                result: data,
                statusPrevious: true,
                statusNext: true,
                numRecords: (await query(`select count(*) as counttrips from trips where HOUR(startHGo) = HOUR(?) AND HOUR(endHGo) = HOUR(?) AND  goBack =?`, [startTime, endTime, goBack]))[0].counttrips
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
                    msg: "",
                    data: {},
                    errors: { noTripData: req.t("error.noTripData") },
                });
            } else {
                await Promise.all(tripsdata.result.map(async trip => {
                    const drivernameGo = await query("select fullName from driver where id = ?", [tripDetails[0].driveridGo]);
                    const drivernameBack = await query("select fullName from driver where id = ?", [tripDetails[0].vehicleIDBack]);
                    if (drivernameGo[0]) {
                        tripDetails[0].driveridGo = drivernameGo[0].fullName
                    } else {
                        tripDetails[0].drivernameGo = "none"

                    }
                    if (drivernameBack[0]) {
                        tripDetails[0].vehicleIDBack = drivernameBack[0].fullName
                    } else {
                        tripDetails[0].vehicleIDBack = "none"
                    }
                    delete trip.startHBack
                    delete trip.endHBack
                }))
                return res.status(200).json({
                    status: true,
                    code: 200,
                    msg: "",
                    data: tripsdata,
                    errors: {},
                });
            }
        }
        const data = await query("SELECT * FROM trips WHERE HOUR(startHBack) = HOUR(?) AND HOUR(endHBack) = HOUR(?) AND goBack = ? LIMIT ? OFFSET ?", [startTime, endTime, goBack, limitNumber + 1, startIndex]);
        const tripsdata = {
            result: data,
            statusPrevious: true,
            statusNext: true,
            numRecords: (await query(`select count(*) as counttrips from trips where HOUR(startHBack) = HOUR(?) AND HOUR(endHBack) = HOUR(?) AND  goBack =?`, [startTime, endTime, goBack]))[0].counttrips
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
                msg: "",
                data: {},
                errors: { noTripData: req.t("error.noTripData") },
            });

        }
        else {
            await Promise.all(tripsdata.result.map(async trip => {
                const drivernameGo = await query("select fullName from driver where id = ?", [tripDetails[0].driveridGo]);
                const drivernameBack = await query("select fullName from driver where id = ?", [tripDetails[0].vehicleIDBack]);
                if (drivernameGo[0]) {
                    tripDetails[0].driveridGo = drivernameGo[0].fullName
                } else {
                    tripDetails[0].drivernameGo = "none"

                }
                if (drivernameBack[0]) {
                    tripDetails[0].vehicleIDBack = drivernameBack[0].fullName
                } else {
                    tripDetails[0].vehicleIDBack = "none"
                }
                delete trip.startHGo
                delete trip.endHGo
            }))
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

module.exports = {
    router8: router8,
    isFloat: isFloat,
    validateCoordinates: validateCoordinates
};