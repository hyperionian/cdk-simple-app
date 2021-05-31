const AWS = require('aws-sdk'); 
const docClient = new AWS.DynamoDB.DocumentClient(); 

exports.handler = async (event) => { 
    console.log(JSON.stringify(event)); // loop through each record for (let i=0; i < event.Records.length; i++) { const { s3 } = event.Records[i]; // write to DynamoDB with random ID const randomId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10); // Using documentClient to update DynamoDB item // @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-document-client.html#dynamodb-example-document-client-update 

await docClient.put({ 
TableName: process.env.TABLE_NAME, 
Item: { 
'id': randomId, 
'key': s3.object.key 
} 
}).promise(); 
} 

return {}; 
