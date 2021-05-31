const AWS = require('aws-sdk'); 
const docClient = new AWS.DynamoDB.DocumentClient(); 
exports.handler = async (event) => { 
    // Using documentClient to update DynamoDB item // @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property 
const result = await docClient.scan({ 
TableName: process.env.TABLE_NAME 
}).promise(); 

return { 
statusCode: 200, 
headers: { 
"Content-Type": "application/json", 
"Access-Control-Allow-Headers" : "*", 
"Access-Control-Allow-Origin": "*", 
"Access-Control-Allow-Methods": "OPTIONS,POST,GET" 
}, 
body: JSON.stringify(result.Items) 
} 
}