const { UserModel } = require("../model/userModel");
const express = require("express");
const userRouter = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const auth = (req, res, next)=>{
    const token = req.headers.authorization.split(" ")[1];

    jwt.verify(token, process.env.SECRET, function(err, decoded) {
        if (err) throw err;
        req.body["loggedemail"] = decoded.email;
        req.body["loggedname"] = decoded.name;
        next()
    });
}

userRouter.post("/signup", async(req, res)=>{
    
    if(req.body.name == undefined || req.body.email == undefined || req.body.password == undefined){
        res.status(400).json({"msg": "Please Provide required details"});
        return
    }

    const {name, email, password} = req.body;

    try {
        const isExist = await UserModel.find({"email": email});

        if(isExist.length != 0){
            res.status(400).json({"msg": "Please Login as you already have an account with us"});
            return 
        }else{
            const hash = bcrypt.hashSync(password, process.env.SALT);
            const newUser = new UserModel({
                name, email, password: hash
            })

            await newUser.save();
            res.status(201).json({"msg": "User is Registred!, Please login."})
        }
    } catch (error) {
        console.log(error)
    }
})
userRouter.post("/login", async(req, res)=>{
    
    if(req.body.email == undefined || req.body.password == undefined){
        res.status(400).json({"msg": "Please Provide required details"});
        return
    }

    const {email, password} = req.body;

    try {
        const isExist = await UserModel.find({"email": email});

        if(isExist.length == 0){
            res.status(400).json({"msg": "Please register as you don't have an account with us"});
            return 
        }else{
            const isCorrect = bcrypt.compareSync(password, isExist[0].password);
            if(isCorrect){
                const token = jwt.sign({
                    "email": isExist[0].email,
                    "name": isExist[0].name
                  }, process.env.SECRET, { expiresIn: 60 * 60 });

                res.status(200).json({"msg": "User Logged In.", "token": token, "name": isExist[0].name, "email": isExist[0].email})
            }else{
                res.status(401).json({"msg": "Please Enter Correct Password."})
            }
            
        }
    } catch (error) {
        console.log(error)
    }
});

userRouter.patch("/add",auth, async(req, res)=>{
    const {email, name} = req.body;

    try {
        await UserModel.updateOne({"email": req.body.loggedemail}, {$push: {friends: {email, name}}});
        await UserModel.updateOne({"email": email}, {$push: {friends: {"email": req.body.loggedemail, "name" : req.body.loggedname}}});
        let explorefnds = await UserModel.find();
        // explorefnds = explorefnds.filter((el)=>{
        //     let flag = true;
        //     for(let i = 0; i < fnds.friends.length; i++){
        //         if(fnds.friends[i].email == el.email){
        //             flag = false
        //         }
        //     }

        //     if(flag){
        //         return el.email
        //     }
        // })
        res.status(201).json({"msg": "friend added", "explorefnds": explorefnds})
    } catch (error) {
        console.log(error) 
    }
});

userRouter.get("/data",auth, async(req, res)=>{
    try {
        let fnds = await UserModel.find({"email": req.body.loggedemail});
        let explorefnds = await UserModel.find();
        // explorefnds = explorefnds.filter((el)=>{
        //     let flag = true;
        //     for(let i = 0; i < res.friends.length; i++){
        //         if(res.friends[i].email == el.email){
        //             flag = false
        //         }
        //     }

        //     if(flag){
        //         return el.email
        //     }
        // })
        res.status(201).json({"msg": "friends data", "friends": fnds, "explorefnds": explorefnds})
    } catch (error) {
        console.log(error) 
    }
});
userRouter.patch("/delete",auth, async(req, res)=>{
    const {email} = req.body;
    try {
        await UserModel.updateOne({"email": req.body.loggedemail}, {$pull: {friends: {email: email}}});
        await UserModel.updateOne({"email": email}, {$pull: {friends: {email: req.body.loggedemail}}});
        let explorefnds = await UserModel.find();
        // explorefnds = explorefnds.filter((el)=>{
        //     let flag = true;
        //     for(let i = 0; i < fnds.friends.length; i++){
        //         if(fnds.friends[i].email == el.email){
        //             flag = false
        //         }
        //     }

        //     if(flag){
        //         return el.email
        //     }
        // })
        res.status(201).json({"msg": "friend removed!", "explorefnds": explorefnds})
    } catch (error) {
        console.log(error) 
    }
});

module.exports = {
    userRouter
}