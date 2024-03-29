const conn=require("../db/connection.js");
const util=require("util");//helper in queries 
const query = util.promisify(conn.query).bind(conn);//transform query into a promise to use [await/async]

const userAuthlog = async (req, res, next) => {

    if (!(req.body.type == "user" || req.body.type == "admin" || req.body.type == "bus")) {
        return res.status(404).json({
            status: false,
            code: 404,
            msg: "",
            data: {},
            errors: { typeNotvalid :req.t("error.typeNotvalid")}
        })
    }
    if (!(req.body.devicetoken || req.body.type == "admin")) {
        return res.status(403).json({
            status: false,
            code: 403,
            msg: "",
            data: {},
            errors: { invalidAuth: req.t("error.invalidAuth") }
})
    }
    
    const user = await query("select * from users where email = ?", req.body.email);
    // const user2 = await query("select * from users where devicetoken = ?", req.headers.deviceToken);
    if (!((user[0]) && (user[0].type == req.body.type) && user[0].status == 1)) {
        return res.status(404).json({
            status: false,
            code: 404,
            msg: "",
            data: {},
            errors: { emailNotExists :req.t("error.emailNotExists")}
        })
    }
    // if (user[0].deviceToken == req.body.deviceToken) {//&& user[0].status==1
    //         res.locals.user = user[0];
    //         next();
        
    // }
    if (!(req.body.type == "admin")) {
        await query("update users set deviceToken=? where id=?", [req.body.devicetoken, user[0].id]);
    }
    delete user[0].deviceToken
    delete user[0].counter
    delete user[0].type
    delete user[0].status

        res.locals.user = user[0];
        next();

};


module.exports = userAuthlog;
