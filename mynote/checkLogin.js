//未登录
function noLogin(req,res,next){
    if(!req.session.user){
        console.log('抱歉，您还没登录！');
        return res.redirect('/login');//返回登录界面
    }
    next();
}
exports.noLogin=noLogin;