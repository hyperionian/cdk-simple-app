const AWS = require('aws-sdk'); 
const s3 = new AWS.S3(); 

exports.handler = async (event) => { 

console.log(JSON.stringify(event)); 

let result = {}; 

const {fileAsBase64, name, type} = JSON.parse(event.body); 

const randomId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10); 
const body = Buffer.from(fileAsBase64.replace(/^data:image\/\w+;base64,/, ''),'base64'); 
const params = { 
Bucket: process.env.BUCKET, 
Key: `photos/${randomId}-${name}`, // we write to subdirectory /photos because we wanted to use the same CloudFront origin path /photos 
Body:body, 
ContentEncoding: 'base64', 
ContentType: type 
}; 
await s3.putObject(params).promise(); 

result = {'success': true}; 

return { 
statusCode: 200, 
headers: { 
'Content-Type': 'application/json' , 
'Access-Control-Allow-Headers' : '*', 
'Access-Control-Allow-Origin': '*', 
'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' 
}, 
body: JSON.stringify(result) 
} 
}
