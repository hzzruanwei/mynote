var express=require('express');
var path=require('path');
var bodyParser=require('body-parser');
var crypto=require('crypto');
var session=require('express-session');
var moment=require('moment');
var checkLogin=require('./checkLogin.js');

//引入mongoose
var mongoose=require('mongoose');
//引入模型
var models=require('./models/models');
var User=models.User;
var Note=models.Note;
var tip=0;
var tip1=0;
var yonghu=0;
//使用mongoose连接服务
mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error',console.error.bind(console,'连接数据库失败'));


//����express
var app=express();

//����EJSģ���ģ��λ��
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

//���徲̬�ļ�Ŀ¼
app.use(express.static(path.join(__dirname,'public')));

//�������ݽ�����
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//建立session模型
app.use(session({
	secret:'1234',
	name:'1234',
	cookie:{
		maxAge:1000*60*20
	},//设置session的保存时间为20分钟
	resave:false,
	saveuninitialized:true
}));

//响应首页get请求
app.get('/',checkLogin.noLogin);
app.get('/',function(req,res) {
	if ( req.session.user){
	Note.find({author: req.session.user.username})
		.exec(function (err, allNotes) {
			if (err) {
				console.log(err);
				return res.redirect('/');
			}
			res.render('index', {
				title: '首页',
				user: req.session.user,
				notes: allNotes
			});
		})
		}else{
			res.render('index', {
				title: '首页',
				user: req.session.user,
				//notes: allNotes
		});

	}
});


app.get('/register',function(req,res){
	console.log('注册!');
	res.render('register',{
		user:req.session.user,
		title:'注册',
		err:"",
		tip:"",
		tip1:"",
		yonghu:yonghu
	});
});


//post请求
app.post('/register',function(req,res){
	//res.body可以获取到表单的每项数据
	var username=req.body.username,
		password=req.body.password,
		passwordRepeat=req.body.passwordRepeat;
	//检查输入的用户名是否为空，使用trim去掉两端空格
	if(username.trim().length==0){
		console.log('用户名不能为空');
		return res.redirect('/register');
	}
	if (!username.match( /^[a-zA-Z0-9_]{3,20}$/)) {
		console.log("用户名不规范，请重新输入");
		return res.render('register',{
			user:req.session.user,
			title:'注册',
			err:"",
			tip:'1',
			tip1:"",
			yonghu:""
		});
	}

	//检查输入的用户名是否为空，使用trim去掉两空格
	if(password.trim().length==0||passwordRepeat.trim().length==0)
	{
		console.log('密码不能为空！');
		return res.redirect('/register');
	}
	//检查两次输入的密码是否一致
	if(password!=passwordRepeat){
		console.log('两次输入的密码不一致！');
		return res.redirect('/register');
	}

	if (!password.match( /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{6,}$/)) {
		console.log("输入密码不规范，请重新输入");
		return res.render('register',{
			user:req.session.user,
			title:'注册',
			err:"",
			tip1:'1',
			tip:"",
			yonghu:""
		});
	}

	//检查用户是否已经存在，如果不存在，怎保存该条记录
	User.findOne({username:username},function(err,user){
		if(err) {
			console.log(err);
			return res.redirect('/register');
		}
		if(user){
			console.log('用户名已经存在');
			yonghu=1;
			//return res.redirect('/register');
			return res.render('register',{
				user:req.session.user,
				title:'注册',
				err:"",
				tip1:'',
				tip:"",
				yonghu:yonghu
			});
		}
		//对密码进行md5加密
		var md5=crypto.createHash('md5'),
			md5password=md5.update(password).digest('hex');
		//新建user对象用于保存数据
		var newUser=new User({
			username:username,
			password:md5password
		});
		newUser.save(function(err,doc){
			if(err){
				console.log(err);
				return res.redirect('/register');
			}
			console.log('注册成功！');
			return res.redirect('/');
		});
	});

});

app.get('/login',function(req,res){
	console.log('登录！');
	res.render('login', {
		user:req.session.username,
		title:'登录'
	});
});

app.post('/login',function(req,res){
		var username=req.body.username,
			password=req.body.password;
		User.findOne({username:username},function(err,user){
			if(err){
				console.log(err);
				return res.redirect('/login');
			}
			if(!user){
				console.log('用户不存在');
				return res.redirect('/login');

			}
			//对密码进行md5加密
			var md5=crypto.createHash('md5');
			md5password=md5.update(password).digest('hex');
			if(user.password!==md5password){
				console.log('密码错误！');
				return res.redirect('/login');
			}
			console.log('登陆成功！');
			req.session.user=user;
			user.password=null;
			delete user.password;
			return res.redirect('/');
		});
});
app.get('/quit',function(req,res){
	req.session.user=null;
	console.log('退出');
	return res.redirect('/login');

});
app.get('/post',function(req,res){
	console.log('发布！');
	res.render('post',{
		user:req.session.user,
		title:'发布'});
});

app.post('/post',function(req,res){
	var note=new Note({
		title:req.body.title,
		author:req.session.user.username,
		tag:req.body.tag,
		content:req.body.content
	});
	note.save(function(err,doc){
		if(err){
			console.log(err);
			return res.redirect('/post');
		}
		console.log('文章发表成功！');
		return res.redirect('/');
	});

})
app.get('/detail/:_id',function(req,res){
	console.log('查看笔记!');
	Note.findOne({_id:req.params._id})
		.exec(function(err,art){
			if(err){
				console.log(err);
				return res.redirect('/');
			}
			if(art){
				res.render('detail',{
					title:'笔记详情',
					user:req.session.user,
					art:art,
					moment:moment
				});
			}
		});
});

//监听3000端口
app.listen(3000,function(req,res){
	console.log('app is running at port 3000');
});