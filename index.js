const express = require('express');
const app = express();
exports.app = app;
const conn = require("./db/connection");
const util = require("util");//helper in queries
// const imageAuth = require("./middleware/imageAuth");
const i18next = require('i18next');
const middleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
require('dotenv').config();
const moment = require('moment-timezone');
moment.tz.setDefault('Africa/Cairo');
const cron = require('node-cron');
const path = require('path');
const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]

//========================== LANGUAGE ==========================//
i18next.use(Backend).use(middleware.LanguageDetector)
    .init({
        fallbackLng: 'en',
        // Backend: {
        //     loadPath: './locales/{{lng}}/translation.json'
        // }
        resources: {
            en: {
                translation: require('./locales/en/translation.json')
            },
            ar: {
                translation: require('./locales/ar/translation.json')
            },
        }
    });
//========================== Global Medelmares ==========================//

app.use(express.urlencoded({ extended: true }));// to acess URL encoded 
app.use(express.json());
const cors = require("cors");
app.use(cors());//ALLOWS HTTPs REQUESTS BETWEEN HOSTS("FRONTEND","BACKEND")

//========================== REQUIRED MODULES ==========================//
const Auth = require('./Routes/Auth');
const userservices = require('./Routes/userServices');
// const otpservices = require('./Routes/otpOperations');
const termsAndConditions = require('./Routes/condition&terms');
const fqa = require('./Routes/fqa');
const contactus = require('./Routes/contactus');
const linkservices = require('./Routes/linkservices');
const nationality = require('./Routes/nationality');
const adminServices = require('./Routes/adminServices');
const imagesAuthAPI = require('./Routes/requestImage');
const travelsOperations = require('./Routes/travelsOperations');
const { log } = require('console');
// const adminServices = require('./Routes/adminServices');

// import router from './Routes/Auth.js';
//========================== MAKE PUBLIC FOLDER ==========================//
app.use("/upload/:filename", express.static(path.join(__dirname, '/upload')));


// app.get("/upload/:filename", imageAuth, (req, res) => {
//     try {
//         const filePath = path.join(__dirname, '/upload', req.params.filename);
//         const fileStream = fs.createReadStream(filePath);
//         fileStream.pipe(res);
//     } catch {
//         console.log(err);
//     }


// });
app.get("/healthz", (req, res) => {
    res.status(200).send("good");
})

app.listen(process.env.PORT || 80, process.env.HOST, () => {
    console.log("the web server is running on port :" + process.env.PORT);
})


// ========================== API ROUTES [ENDPOINTS] ==========================//
// app.use(i18next.init);
app.use(middleware.handle(i18next));
app.use("/auth", Auth);
app.use("/user", userservices);
app.use("/conditions", termsAndConditions);
app.use("/fqa", fqa);
app.use("/contactus", contactus);
app.use("/linkservices", linkservices);
app.use("/nationality", nationality);
app.use("/adminServices", adminServices);
app.use("", imagesAuthAPI);
app.use("/trip", travelsOperations.router8);

// console.log(moment(new Date(new Date().setHours(..."10:00:12".toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss"));

// SET @@global.time_zone = '+03:00';

// console.log(new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo', dateStyle: 'long', timeStyle: 'medium' }));

// Schedule the cron job to run on the last day of the month at 11:59 PM

//=====================================================================
// run for get paid
// const lastDayOfMonth = moment().endOf('month').date();
// const cronExpression = `59 23 ${lastDayOfMonth} * *`;//runs every time in the end of the month 
// cron.schedule(cronExpression, () => {

//     console.log('Monthly cron job for delete couter and pay for trips');
// });

//====================================================================
// send notification by arrival time
// const cronExpression2 = `*/5 * * * *`; // Runs every 5 minutes
// cron.schedule(cronExpression2, async () => {//incomplete//send notification with firebase
//     const currentTime = moment.tz('Africa/Cairo').format("HH:mm:ss")

//     const trips = await query("select * from trips where status=1")
//     if (trips[0]) {
//         await Promise.all(trips.map(async trip => {
//             const stations = await query("select stations where tripID=? AND MINUTE(timeArriveBack) = MINUTE(DATE_ADD(?, INTERVAL 5 MINUTE)) OR MINUTE(timeArriveGo) = MINUTE(DATE_ADD(?, INTERVAL 5 MINUTE))", [trip.id, currentTime, currentTime])
            
//         }))
//     }

    // const stations = await query("select * from stations");


// });
//*********************************************************************

// cron.schedule(`* * * * *`, async () => {//completed404//update trip status 
//     const trips = await query("select * from trips");
//     const currentTime = moment.tz('Africa/Cairo').format("HH:mm:ss")

//     await Promise.all(trips.map(async trip => {
//         const tripStartHBack = moment(new Date(new Date().setHours(...trip.startHBack.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
//         const tripEndHBack = moment(new Date(new Date().setHours(...trip.endHBack.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
//         const tripStartHGo = moment(new Date(new Date().setHours(...trip.startHGo.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
//         const tripEndHGo = moment(new Date(new Date().setHours(...trip.endHGo.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")

//         console.log(currentTime);
//         if (currentTime >= tripStartHGo || currentTime >= tripStartHBack) {
//             await query("update trips set status=1 where id=?",trip.id)
//         }
//         if (currentTime >= tripEndHGo || currentTime >= tripEndHBack) {
//             await query("update trips set status=0 where id=?", trip.id)
//         }
//     }))

// });
//**************************************************************************





