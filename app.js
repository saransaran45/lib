const express =require("express");
const bodyparser = require("body-parser");
const pg =require("pg");
const cookieParser = require("cookie-parser");
const app=express();
app.use(cookieParser());
app.set("view-engine","ejs");
app.use(bodyparser.urlencoded({extended:true}))
const conn = new pg.Client({
    host:"localhost",
    user:"postgres",
    port:5432,
    password:"root",
    database:"library"
})
conn.connect((err)=>{
    if(err){
        console.log("error:"+err);
    }
    else{
        console.log("connected");
    }
});

app.get("/",function(req,res){
    res.render("login.ejs");
});

app.get("/login",function(req,res){
        res.render("login.ejs");
});

app.post("/login",function(req,res){
    const user=req.body.user;
    const pwd = req.body.pw;
    conn.query("select password from login where username=$1 and password=$2",[user,pwd],(err,result)=>{
        console.log(result.rows.length);
        if(result.rows.length==1){
            console.log(result.rows[0].password,pwd);
            if(result.rows[0].password==pwd){
                res.cookie('user',user);
                res.cookie('password',pwd);
                console.log(err,pwd);
                conn.query("select * from login where password=$1",[pwd],(err,result)=>{
                    console.log(result.rows[0].name);
                    if(result.rows[0].name=='1' || result.rows[0].name==''){
                        console.log(err);
                        res.render("info.ejs");
                    }
                    else{
                        res.redirect('/lib');
                    } 
                })
                
            }
            else{
                res.redirect('/login');
            }
        }
        else{
            res.redirect('/login');
        }
    })
});

app.get("/infos",function(req,res){
    res.render("info.ejs");
})

app.get("/lib",function(req,res){
    conn.query("select * from books where noofbooks=1;",(err,resu)=>{
        res.render("lib.ejs",{result:resu.rows});
    })
})

app.get("/return",function(req,res){
    conn.query("select * from books where bookid in(select bookid from return where name=$1) and noofbooks=0;",[req.cookies.user],(err,resu)=>{
        res.render("return.ejs",{re:resu.rows});
    })
})

app.get("/information",function(req,res){
    conn.query("select * from student_info where name in(select name from login where password=$1)",[req.cookies.password],(err,resu)=>{
        console.log(resu.rows[0].name,resu.rows[0].rollno);
        console.log(req.cookies.password);
        res.render("student.ejs",{result:resu.rows});
    })
})

app.post("/returns",function(req,res){
    const book= req.body.bo_na;
    const id1=req.body.bid;
    conn.query("update books set noofbooks=$1 where bookid=$2",[1,id1]);
    conn.query("delete from return where bookid=$1;",[id1]);
    res.redirect('/return');
})


app.get("/register",function(req,res){
    res.render("register.ejs");
});

app.post("/Borrow",function(req,res){
    const book=req.body.bo_name;
    const id1=req.body.bo_id;
    console.log(req.body);
    conn.query("select noofbooks from books where name=$1",[book],(err,result)=>{
        if(result.rows[0].noofbooks==1){
            conn.query("insert into student values($1,$2);",[req.cookies.user,id1]);
            conn.query("insert into return values($1,$2);",[req.cookies.user,id1]);
            conn.query("update books set noofbooks=0 where bookid=$1",[id1]);
            res.redirect('/lib');
        }
        
    })
});

app.post("/register",function(req,res){
    const use=req.body.use;
    const pw=req.body.paw;
    conn.query("insert into login values($1,$2,$3)",[use,pw,'1'],(err)=>{
        console.log(err);
    })
    res.redirect('/login');
});

app.get("/inf",function(req,res){
    res.render("info.ejs");
})


app.post("/info",function(req,res){
    const name = req.body.nam;
    const reg = req.body.regno;
    const dep = req.body.dept;
    const sem = req.body.semester;
    conn.query("select * from student_info where name=$1 and rollno=$2 and department=$3 and semester=$4",[name,reg,dep,sem],(err,resu)=>{
        if(resu.rows.length==1){
            res.redirect('/info');
        }
        else{
            if(name.length>1 && reg.length>1 && dep.length>1 && sem.length>1){
                conn.query("insert into student_info values($1,$2,$3,$4);",[name,reg,dep,sem]);
                conn.query("update login set name=$1 where password=$2;",[name,req.cookies.password]);
                console.log('1',err);
                res.redirect("/lib");
            }
            else{
                console.log('2',err);
                res.redirect('/inf');
            }
        }
    })
});


app.listen(3000,function(){
    console.log("Server started on port 3000");
});