const conn=require("../db/connection.js");
const util=require("util");//helper in queries 

const Notautherized=async (req,res,next) => {
    if (!req.headers.token) {
        return res.status(403).json({
            status: false,
            code: 403,
            msg: "",
            data: {},
            errors: { invalidAuth: req.t("error.invalidAuth") }
})
    }
    
    const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]
    const { token }=req.headers;
    const Notautherized = await query("select * from users where token = ?", token);
    if (Notautherized[0] && Notautherized[0].status == 0){
        res.locals.Notautherized = Notautherized[0];
        next();
    }
    else{
        return res.status(403).json({
            status: false,
            code: 403,
            msg: "",
            data: {},
            errors: { invalidAuth: req.t("error.invalidAuth") }
});
    }
};


module.exports = Notautherized;
// 