"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotographyStack = void 0;
const cdk = require("@aws-cdk/core");
const cloudfront = require("@aws-cdk/aws-cloudfront");
const origins = require("@aws-cdk/aws-cloudfront-origins");
const s3 = require("@aws-cdk/aws-s3");
const s3Deployment = require("@aws-cdk/aws-s3-deployment");
const apigw = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const lambdaEventSources = require("@aws-cdk/aws-lambda-event-sources");
class PhotographyStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // The code that defines your stack goes here
        const originBucket = new s3.Bucket(this, 'photo-origin-bucket', {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });
        const photoBucket = new s3.Bucket(this, 'photo-bucket', {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });
        const distribution = new cloudfront.Distribution(this, 'photo-cf', {
            defaultBehavior: { origin: new origins.S3Origin(originBucket) },
            defaultRootObject: 'index.html',
            additionalBehaviors: {
                '/photos/*': {
                    origin: new origins.S3Origin(photoBucket),
                },
            }
        });
        new s3Deployment.BucketDeployment(this, "objects-upload", {
            sources: [s3Deployment.Source.asset('./src/web')],
            destinationBucket: originBucket
        });
        //API Gateway resource
        const photoApi = new apigw.RestApi(this, 'photo-api', {
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS,
            },
        });
        // Lambda Function  
        const photoFunction = new lambda.Function(this, 'photo-Function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('src/create'),
            environment: {
                'BUCKET': photoBucket.bucketName
            }
        });
        const photo = photoApi.root.addResource('photo');
        //POST endpoint /photo
        photo.addMethod('POST', new apigw.LambdaIntegration(photoFunction));
        //Grant appropriate permissions
        photoBucket.grantWrite(photoFunction);
        //DynamoDB
        const photoTable = new dynamodb.Table(this, 'photo-table', {
            partitionKey: {
                name: 'id', type: dynamodb.AttributeType.STRING
            },
        });
        //Record Function
        const recordFunction = new lambda.Function(this, 'register-Function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('src/register'),
            environment: {
                'TABLE_NAME': photoTable.tableName
            }
        });
        // S3 event notifications trigger
        recordFunction.addEventSource(new lambdaEventSources.S3EventSource(photoBucket, {
            events: [
                s3.EventType.OBJECT_CREATED, s3.EventType.OBJECT_REMOVED
            ]
        }));
        photoTable.grantWriteData(recordFunction);
        // create Lambda to list files from DynamoDB 
        const listFunction = new lambda.Function(this, 'photography-function-list', {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset('src/read'),
            handler: 'index.handler',
            environment: {
                'TABLE_NAME': photoTable.tableName
            }
        });
        // grant Lambda permission to read/write to DynamoDB 
        photoTable.grantReadData(listFunction);
        // add GET /photos to API Gateway 
        photo.addMethod('GET', new apigw.LambdaIntegration(listFunction));
    }
}
exports.PhotographyStack = PhotographyStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGhvdG9ncmFwaHktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaG90b2dyYXBoeS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFDckMsc0RBQXNEO0FBQ3RELDJEQUEyRDtBQUMzRCxzQ0FBc0M7QUFFdEMsMkRBQTJEO0FBQzNELGlEQUFpRDtBQUNqRCw4Q0FBOEM7QUFDOUMsa0RBQWtEO0FBQ2xELHdFQUF3RTtBQUV4RSxNQUFhLGdCQUFpQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzdDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsNkNBQTZDO1FBQzdDLE1BQU0sWUFBWSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDL0QsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7U0FDbEQsQ0FBQyxDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFFLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDeEQsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7U0FDbEQsQ0FBQyxDQUFDO1FBR0gsTUFBTSxZQUFZLEdBQUcsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDakUsZUFBZSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUMvRCxpQkFBaUIsRUFBRSxZQUFZO1lBQy9CLG1CQUFtQixFQUFFO2dCQUNuQixXQUFXLEVBQUU7b0JBQ1QsTUFBTSxFQUFFLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7aUJBQzVDO2FBQ0Y7U0FDRixDQUFDLENB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YSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRTNDLGtDQUFrQztRQUM5QixLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7Q0FDRDtBQXJHRCw0Q0FxR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gJ0Bhd3MtY2RrL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnQGF3cy1jZGsvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdAYXdzLWNkay9hd3MtczMnO1xuaW1wb3J0ICogYXMgczNvYmplY3RzIGZyb20gJ0Bhd3MtY2RrL2F3cy1zMy1hc3NldHMnO1xuaW1wb3J0ICogYXMgczNEZXBsb3ltZW50IGZyb20gXCJAYXdzLWNkay9hd3MtczMtZGVwbG95bWVudFwiO1xuaW1wb3J0ICogYXMgYXBpZ3cgZnJvbSAnQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnQGF3cy1jZGsvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGxhbWJkYUV2ZW50U291cmNlcyBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhLWV2ZW50LXNvdXJjZXMnO1xuXG5leHBvcnQgY2xhc3MgUGhvdG9ncmFwaHlTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBUaGUgY29kZSB0aGF0IGRlZmluZXMgeW91ciBzdGFjayBnb2VzIGhlcmVcbiAgICBjb25zdCBvcmlnaW5CdWNrZXQgPSBuZXcgczMuQnVja2V0ICh0aGlzLCAncGhvdG8tb3JpZ2luLWJ1Y2tldCcsIHtcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTExcbiAgICB9KTtcbiAgICBcbiAgICAgY29uc3QgcGhvdG9CdWNrZXQgPSBuZXcgczMuQnVja2V0ICh0aGlzLCAncGhvdG8tYnVja2V0Jywge1xuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTFxuICAgIH0pO1xuICAgIFxuICBcbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgJ3Bob3RvLWNmJywge1xuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7IG9yaWdpbjogbmV3IG9yaWdpbnMuUzNPcmlnaW4ob3JpZ2luQnVja2V0KSB9LFxuICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6ICdpbmRleC5odG1sJyxcbiAgICAgIGFkZGl0aW9uYWxCZWhhdmlvcnM6IHtcbiAgICAgICAgJy9waG90b3MvKic6IHtcbiAgICAgICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuUzNPcmlnaW4ocGhvdG9CdWNrZXQpLFxuICAgICAgICB9LFxuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgbmV3IHMzRGVwbG95bWVudC5CdWNrZXREZXBsb3ltZW50KHRoaXMsIFwib2JqZWN0cy11cGxvYWRcIiwge1xuICAgICAgc291cmNlczogW3MzRGVwbG95bWVudC5Tb3VyY2UuYXNzZXQoJy4vc3JjL3dlYicpXSxcbiAgICAgIGRlc3RpbmF0aW9uQnVja2V0OiBvcmlnaW5CdWNrZXRcbiAgICB9KTtcbiAgICBcbiAgICAvL0FQSSBHYXRld2F5IHJlc291cmNlXG4gICAgXG4gICAgY29uc3QgcGhvdG9BcGkgPSBuZXcgYXBpZ3cuUmVzdEFwaSAodGhpcywgJ3Bob3RvLWFwaScsIHtcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWd3LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ3cuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgXG4gIC8vIExhbWJkYSBGdW5jdGlvbiAgXG4gICBjb25zdCBwaG90b0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAncGhvdG8tRnVuY3Rpb24nLCB7XG4gICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnc3JjL2NyZWF0ZScpLFxuICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgJ0JVQ0tFVCc6IHBob3RvQnVja2V0LmJ1Y2tldE5hbWVcbiAgICAgfVxuICAgfSk7XG4gICBcbiAgICBjb25zdCBwaG90byA9IHBob3RvQXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3Bob3RvJyk7XG4gICAgXG4gICAgLy9QT1NUIGVuZHBvaW50IC9waG90b1xuICAgIFxuICAgIHBob3RvLmFkZE1ldGhvZCAoJ1BPU1QnLCBuZXcgYXBpZ3cuTGFtYmRhSW50ZWdyYXRpb24ocGhvdG9GdW5jdGlvbiksXG4gICAgKTtcbiAgICBcbiAgICAvL0dyYW50IGFwcHJvcHJpYXRlIHBlcm1pc3Npb25zXG4gICAgcGhvdG9CdWNrZXQuZ3JhbnRXcml0ZSAocGhvdG9GdW5jdGlvbik7XG4gICAgXG4gICAgLy9EeW5hbW9EQlxuICAgIGNvbnN0IHBob3RvVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ3Bob3RvLXRhYmxlJywgeyBcbiAgICAgICBwYXJ0aXRpb25LZXk6IHsgXG4gICAgICAgbmFtZTogJ2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgXG4gICAgfSxcbiAgICB9KTtcbiAgICBcbiAgICAvL1JlY29yZCBGdW5jdGlvblxuICAgIGNvbnN0IHJlY29yZEZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAncmVnaXN0ZXItRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnc3JjL3JlZ2lzdGVyJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICdUQUJMRV9OQU1FJzogcGhvdG9UYWJsZS50YWJsZU5hbWVcbiAgICAgfVxuICAgIH0pO1xuICAgXG4gICAgLy8gUzMgZXZlbnQgbm90aWZpY2F0aW9ucyB0cmlnZ2VyXG4gICAgXG4gICAgcmVjb3JkRnVuY3Rpb24uYWRkRXZlbnRTb3VyY2UgKG5ldyBsYW1iZGFFdmVudFNvdXJjZXMuUzNFdmVudFNvdXJjZSAocGhvdG9CdWNrZXQsIHtcbiAgICBldmVudHM6IFsgXG4gICAgICBzMy5FdmVudFR5cGUuT0JKRUNUX0NSRUFURUQsIHMzLkV2ZW50VHlwZS5PQkpFQ1RfUkVNT1ZFRFxuICAgIF1cbiAgICB9KSk7XG4gICAgXG4gICAgIHBob3RvVGFibGUuZ3JhbnRXcml0ZURhdGEgKHJlY29yZEZ1bmN0aW9uKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgTGFtYmRhIHRvIGxpc3QgZmlsZXMgZnJvbSBEeW5hbW9EQiBcbiAgIGNvbnN0IGxpc3RGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ3Bob3RvZ3JhcGh5LWZ1bmN0aW9uLWxpc3QnLCB7IFxuICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCwgLy8gZXhlY3V0aW9uIGVudmlyb25tZW50IFxuICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ3NyYy9yZWFkJyksIC8vIGNvZGUgbG9hZGVkIGZyb20gcmVmZXJlbmNlZCBkaXJlY3RvcnkgXG4gICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyAsIFxuICAgICAgIGVudmlyb25tZW50OiB7IFxuICAgICAgICAnVEFCTEVfTkFNRSc6IHBob3RvVGFibGUudGFibGVOYW1lIFxuICAgICAgIH0gXG4gICB9KTsgXG5cbi8vIGdyYW50IExhbWJkYSBwZXJtaXNzaW9uIHRvIHJlYWQvd3JpdGUgdG8gRHluYW1vREIgXG4gICAgcGhvdG9UYWJsZS5ncmFudFJlYWREYXRhKGxpc3RGdW5jdGlvbik7IFxuXG4vLyBhZGQgR0VUIC9waG90b3MgdG8gQVBJIEdhdGV3YXkgXG4gICAgcGhvdG8uYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ3cuTGFtYmRhSW50ZWdyYXRpb24obGlzdEZ1bmN0aW9uKSk7XG4gfVxufVxuIl19