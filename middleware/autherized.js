const conn=require("../db/connection.js");
const util=require("util");//helper in queries 

const autherized=async (req,res,next) => {
    if (!req.headers.token) {
        return res.status(403).json({
            status: false,
            code: 403,
            msg:"",
            data: {},
            errors: { invalidAuth :req.t("error.invalidAuth")}
})
    }
    
    const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]
    const { token }=req.headers;
    const autherized =await query("select * from users where token = ?",token);
    if (autherized[0] && autherized[0].status == 1) {
        const host = req.get('host');
        // autherized[0].profile_image = `http://${host}/upload/${autherized[0].profile_image} `
        res.locals.autherized = autherized[0];
        next();
    }
    else {
        console.log("hello2");

        return res.status(403).json({
            status: false,
            code: 403,
            msg: "",
            data: {},
            errors: { invalidAuth :req.t("error.invalidAuth")}
});
    }
};


module.exports = autherized;
// 