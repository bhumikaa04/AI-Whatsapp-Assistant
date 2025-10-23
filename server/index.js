const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config(); 
const express = require('express'); 
const bodyParser = require('body-parser'); 
const cors = require('cors'); 

const app = express(); 
app.use(express.json()); 
app.use(bodyParser.json()); 
app.use(cors()); 

app.get('/' , (req, res) => {
    res.send("hello world : Gemini");
})

// const ai = new GoogleGenAI({});

// async function main() {
//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: "How does AI work?",
//   });
//   console.log(response.text);
// }

// await main();

const genAI = new GoogleGenerativeAI(process.env.API_KEY); 
const model = genAI.getGenerativeModel({model:"gemini-2.5-flash"}); 

//const prompt = "number of alphabets"; 

const generate = async(prompt) => {
    try{
        const result = await model.generateContent(prompt); 
        console.log(result.response.text()); 
        return result.response.text(); 
    }catch(error){
        console.log(error); 
    }
}

//generate(); 

app.post('/api/content' , async (req, res) => {
    try{
        const data = req.body.question ;
        const result = await generate(data); 
        res.send({
            "result" : result
        })
    }catch(err){
        console.log(err);
        res.send(err); 
    }
})

app.listen(3000 ,() => {
    console.log("server is listening"); 
}); 
