const conn=require("../db/connection.js");
const util=require("util");//helper in queries 

const userAuthlog = async (req, res, next) => {
    if (!(req.body.type == "user" || req.body.type == "admin" || req.body.type == "bus" )) {
        return res.status(404).json({
            status: false,
            code: 404,
            msg: req.t("error.typeNotvalid"),
            data: {},
            errors: {}
        })
    }
    if (!req.body.devicetoken) {
        return res.status(403).json({
            status: false,
            code: 403,
            msg: req.t("error.invalidAuth"),
            data: {},
            errors: {}
})
    }
    
    const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]
    const user = await query("select * from users where email = ?", req.body.email);
    // const user2 = await query("select * from users where devicetoken = ?", req.headers.deviceToken);
    if (!((user[0]) && (user[0].type == req.body.type) && user[0].status == 1)) {
        return res.status(404).json({
            status: false,
            code: 404,
            msg: req.t("error.emailNotExists"),
            data: {},
            errors: {}
        })
    }
    // if (user[0].deviceToken == req.body.deviceToken) {//&& user[0].status==1
    //         res.locals.user = user[0];
    //         next();
        
    // }
    await query("update users set deviceToken=? where id=?", [req.body.devicetoken, user[0].id]);
    delete user[0].devicetoken
        res.locals.user = user[0];
        next();

};


module.exports = userAuthlog;
