//   /api/quiz/...
const router = require('express').Router();
const QuizData = require('../models/quizdata');
const utils = require('../utils');
const db = require('../db');
const auth = require('../auth');
const { resolveSoa } = require('dns');


router.get('/test',(req,res) => {
    res.status(200).json({message:'working'});
})

router.get('/fetch/:amt',(req,res) => {
    let amount = parseInt(req.params.amt);
    if ([5,10,20].includes(amount)){
        QuizData.countDocuments().exec((error,count) => {
            let randList = utils.generateRandomList(amount,count);
            let collections = [];
            let c = 0;
            for (x of randList){
                QuizData.findOne().skip(x).exec((error,data) => {
                    c++;
                    collections.push(data);
                    if (c == amount){
                        res.send(collections);
                    }
                });
            }
        });
    }
});


router.get('/question-count',(req,res) => {
    QuizData.countDocuments().exec((error,count) => {
        res.json({'questionCount':count});
    });
});










router.post('/create',async(req,res) => {
    let data = req.body;
    let checkCreatorKey = await db.checkCreatorKey(data.key);
    
    if (checkCreatorKey){
        let checkQuiz = await auth.checkQuizItem(data);
        if (checkQuiz[0]){
            data = await auth.alterQuizItem(data);
            let quizObj = {
                difficulty:data.difficulty,
                question:data.question,
                answer:data.answer,
                option1:data.option1,
                option2:data.option2,
                option3:data.option3,
                author:checkCreatorKey.creatorName
            }

            let newQuizItem = db.createQuiz(quizObj);
            if (newQuizItem){
                res.json({
                    'message':'Published submitted quiz item',
                    'success':true,
                    'validKey':true
                });
            }
            else if (!newQuizItem){
                res.json({
                    'message':'Database error in publishing quiz item',
                    'success':false,
                    'validKey':true
                });
            }

        }
        else if (!checkQuiz[0]){
            let reason = checkQuiz[1];
            res.send({
                'message':reason,
                'success':false,
                'validKey':true
            });
        }
    }
    else {
        res.json({
            'message':'Creator key invalid',
            'success':false,
            'validKey':false
        });
    }

});








module.exports = router;
