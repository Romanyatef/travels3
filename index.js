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

app.listen(process.env.PORT || 4000, process.env.HOST, () => {
    console.log("the web server is running on port :" + process.env.PORT);
})


// ========================== API ROUTES [ENDPOINTS] ==========================//
// app.use(i18next.init);
app.use(middleware.handle(i18next));
app.use("/auth", Auth);
app.use("/user", userservices);
app.use("/conditions", termsAndConditions);
app.use("/fqa", fqa);
app.use("/contactus", contactus.router6);
app.use("/linkservices", linkservices);
app.use("/nationality", nationality);
app.use("/adminServices", adminServices.router6);
app.use("", imagesAuthAPI);
app.use("/trip", travelsOperations.router8);
const admin = require('firebase-admin');

const serviceAccount = require('./trips-75f46-firebase-adminsdk-in1hu-312fdd2d62.json');

// const serviceAccount = require('./travels3/carlift-9df91-firebase-adminsdk-mosd3-c31f0e8b99.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const sendnotification = async(title,body,deviceToken) => {
    const payload = {
    notification: {
        title: title,
        body: body
    }
    };
    const options = {
    priority: 'high',
    timeToLive: 60 * 60 * 24 // Notification will be kept for 24 hours if the device is offline
    };
    admin.messaging().sendToDevice(deviceToken, payload, options)
    .then((response) => {
        console.log('Notification sent successfully:', response);
        return true
    })
    .catch((error) => {
        console.log('Error sending notification:', error);
        return false
    });

}






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
const updateState = async(trip) => {
    const currentTime = moment.tz('Africa/Cairo').format("HH:mm:ss")
    const usertrips = await query("select * from trips where ",)
}
// send notification by arrival time
// const cronExpression2 = `*/5 * * * *`; // Runs every 5 minutes
// cron.schedule(cronExpression2, async () => {//incomplete//send notification with firebase
//     const currentTime = moment.tz('Africa/Cairo').format("HH:mm:ss")

//     const trips = await query("select * from trips where status=1")
//     if (trips[0]) {
//         await Promise.all(trips.map(async trip => {
//             const stations = await query("select stations where tripID=? AND MINUTE(timeArriveBack) = MINUTE(DATE_ADD(?, INTERVAL 5 MINUTE)) OR MINUTE(timeArriveGo) = MINUTE(DATE_ADD(?, INTERVAL 5 MINUTE))", [trip.id, currentTime, currentTime])
            
//             await sendnotification()
//         }))
//     }

//     const stations = await query("select * from stations");


// });
const getuser = async () => {
    const user =await query ("select * from users where id=34")
    sendnotification("hello","hello",user[0].deviceToken)
}
//========================================================================
// const cronExpression = '0 0 * * *';  // Runs at 12:00 AM (midnight) every day

// cron.schedule(cronExpression, async () => {
//     const currentDate = moment().format('YYYY-MM-DD');
//     const tripsForToday = await query("select * FROM userschedule where date= ?", currentDate)
//     console.log(tripsForToday);
//     const tripCount = tripsForToday.reduce((countMap, { tripID }) => {
//         countMap[tripID] = (countMap[tripID] || 0) + 1;
//         return countMap;
//     }, {});
//     console.log(tripCount);
//     const tripIDSet = new Set(tripsForToday.map(({ tripID }) => tripID));
//     const tripIDArray = Array.from(tripIDSet);
//     await Promise.all(tripIDArray.map(async (ele) => {
//         const trip = await query("select * from trips where id=?", ele)
//         await query("update vehicles set passengeersNum=? where id=?", [tripCount[ele], trip[0].vehicleIDGo])
//         await query("update vehicles set passengeersNum=? where id=?", [tripCount[ele], trip[0].vehicleIDBack])
//         // if (tripExist[0].startHGo == moment().tz("Africa/Cairo").hour()) {
//         //     const userIds = tripsForToday
//         //         .filter(({ tripId }) => tripId === specificTripId)
//         //         .map(({ userId }) => userId);
            
//         // }
//     }))
    
// });
//========================================================================
// const cronExpression3 = `*/5 * * * *`; // Runs every 5 minutes//not valid delete
// cron.schedule(cronExpression3, async () => {
//     const currentDate = moment().format('YYYY-MM-DD');
//     const usertrips = await query("SELECT * FROM externaltrips WHERE date < ?", currentDate);
//     await Promise.all(usertrips.map(async (ele) => {
//         await query("delete from externaltrips where userID=?", ele.userID)
//     }))
// });
//========================================================================

// const cronExpression4 = `*/5 * * * *`; // Runs every 5 minutes//test//will be handeled when develop driver app
// cron.schedule(cronExpression4, async () => {
//     const currentDate = moment().format('YYYY-MM-DD');
//     const usertripsEnded = await query("SELECT * FROM externaltrips WHERE date < ?", currentDate);
//     await Promise.all(usertripsEnded.map(async (ele) => {
//         await query("delete from externaltrips where id=?", ele.id)
//     }))
//     // const usertrips = await query("select * from externaltrips where added=0")
//     // await Promise.all(usertrips.map(async (ele) => {
//     //     await 
//     //     await query("update externaltrips set added=1 where id=?", ele.id)
//     // }))
// });
//========================================================================
// const user =await query ("select * from users where id=34")
//*********************************************************************

// cron.schedule(`* * * * *`, async () => {//test//update trip status
//     const trips = await query("select * from trips");
//     const currentTime = moment.tz('Africa/Cairo').format("HH:mm:ss")
//     const time = (await query("select time from variety where id=2"))[0].time

//     await Promise.all(trips.map(async trip => {
//         const tripStartHBack = moment(new Date(new Date().setHours(...trip.startHBack.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
//         const tripEndHBack = moment(new Date(new Date().setHours(...trip.endHBack.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
//         const tripStartHGo = moment(new Date(new Date().setHours(...trip.startHGo.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
//         const tripEndHGo = moment(new Date(new Date().setHours(...trip.endHGo.toString().split(':')))).tz('Africa/Cairo').format("HH:mm:ss")
//         const going = (currentTime >= tripStartHGo && currentTime < tripEndHGo)  
//         const back = (currentTime >= tripStartHBack && currentTime < tripEndHBack)
//         if (going) {
//             const updatestatus = {
//                 status:1,
//                 goBack:0
//             }
//             await query("update trips set ? where id=?", [updatestatus,trip.id])                
//             const tripStartHGoadd5 = moment(tripStartTime).subtract(time, 'minutes').format("HH:mm:ss");
//             if (moment(currentTime, "HH:mm:ss").isBefore(tripStartHGoadd5, "HH:mm:ss")) {
//                 const users3 = await query("select * from userschedule where date =? AND tripID=?", [currentTime, trip.id]);
//                 const user = await query("select deviceToken from users where id=?", users3[0].userID)
//                 await Promise.all(users3.map((user) => {
//                     // sendnotification(req.t("info"), req.t("busarrive5"), user[0].deviceToken)
//                     console.log("sent");
//                 }))
//             }
//             return;
//         }

//         if (back) {
//             const updatestatus = {
//                 status:1,
//                 goBack:1
//             }
//             await query("update trips set ? where id=?", [updatestatus, trip.id])
//             return
//         } 
//         await query("update trips set status=0 where id=?", trip.id) 
//     }))

// });
//**************************************************************************



// REDIS_PASSWORD = 1BQcvbtqWLaWGI5TIyBjXmJWIpL4qJIU
// REDIS_HOST = redis - 18918.c285.us - west - 2 - 2.ec2.cloud.redislabs.com
// REDIS_PORT = 18918

module.exports = sendnotification;