const conn=require("../db/connection.js");
const util=require("util");//helper in queries 

const userAuth=async (req,res,next) => {
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
    const user = await query("select * from users where token = ?", req.headers.token);
    if (user[0] && user[0].type == "user" && user[0].status == 1){//&& user[0].status==1
        res.locals.user = user[0];
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


module.exports = userAuth;
