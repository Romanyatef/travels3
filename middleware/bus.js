const conn=require("../db/connection");
const util=require("util");//helper in queries 

const busAuth=async (req,res,next) => {
    if (!req.headers.token) {
        return res.status(403).json({
            status: false,
            code: 403,
            msg: req.t("error.invalidAuth"),
            data: {},
            errors: {}
})
    }
    
    const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]
    const bus=await query("select * from users where token = ?",req.headers.token);
    if (bus[0] && bus[0].type == "bus" && bus[0].status == 1){// && bus[0].status==1
        res.locals.bus=bus[0];
        next();
    }
    else{
        return res.status(403).json({
            status: false,
            code: 403,
            msg: req.t("error.invalidAuth"),
            data: {},
            errors: {}
});
    }
};


module.exports = busAuth;
