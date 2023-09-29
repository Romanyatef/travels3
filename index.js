const express = require('express');
const app = express();
const conn = require("./db/connection");
const util = require("util");//helper in queries 
const i18next = require('i18next');
const middleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
require('dotenv').config();

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
app.use(cors());//ALLOWS HTTP REQUESTS BETWEEN LOCAL HOSTS("FRONTEND","BACKEND")

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
// const adminServices = require('./Routes/adminServices');

// import router from './Routes/Auth.js';

//========================== MAKE PUBLIC FOLDER ==========================//
app.use(express.static('upload'));


//========================== RUN THE APP ==========================//

app.listen(process.env.PORT || 4000, process.env.HOST, () => {
    console.log("the web server is running on port :" + process.env.PORT);
})


// ========================== API ROUTES [ENDPOINTS] ==========================//
// app.use(i18next.init);
app.use(middleware.handle(i18next));
// app.use(middleware.handle(i18next))
app.use("/auth", Auth);
app.use("/user", userservices);
app.use("/conditions", termsAndConditions);
app.use("/fqa", fqa);
app.use("/contactus", contactus);
app.use("/linkservices", linkservices); 
app.use("/nationality", nationality); 
app.use("/adminServices", adminServices); 
// app.use("/adminServices", adminServices); 
