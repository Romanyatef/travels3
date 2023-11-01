const conn=require("../db/connection.js");
const util=require("util");//helper in queries 

const adminAuth=async (req,res,next) => {
    if (!req.headers.token) {
        return res.status(403).json({
            status: false,
            code: 403,
            msg:"" ,
            data: {},
            errors: { invalidAuth :req.t("error.invalidAuth")}
})
    }
    
    const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]
    const { token }=req.headers;
    const admin=await query("select * from users where token = ?",token);
    if (admin[0] && admin[0].type === "admin" && admin[0].status == 1 ){
        res.locals.admin=admin[0];
        next();
    }
    else {

        return res.status(403).json({
            status: false,
            code: 403,
            msg: "",
            data: {},
            errors: { invalidAuth :req.t("error.invalidAuth")}
});
    }
};


module.exports = adminAuth;
// 