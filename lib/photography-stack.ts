import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3objects from '@aws-cdk/aws-s3-assets';
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambdaEventSources from '@aws-cdk/aws-lambda-event-sources';

export class PhotographyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const originBucket = new s3.Bucket (this, 'photo-origin-bucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });
    
     const photoBucket = new s3.Bucket (this, 'photo-bucket', {
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
    
    const photoApi = new apigw.RestApi (this, 'photo-api', {
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
    
    photo.addMethod ('POST', new apigw.LambdaIntegration(photoFunction),
    );
    
    //Grant appropriate permissions
    photoBucket.grantWrite (photoFunction);
    
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
    
    recordFunction.addEventSource (new lambdaEventSources.S3EventSource (photoBucket, {
    events: [ 
      s3.EventType.OBJECT_CREATED, s3.EventType.OBJECT_REMOVED
    ]
    }));
    
     photoTable.grantWriteData (recordFunction);
    
    // create Lambda to list files from DynamoDB 
   const listFunction = new lambda.Function(this, 'photography-function-list', { 
     runtime: lambda.Runtime.NODEJS_14_X, // execution environment 
     code: lambda.Code.fromAsset('src/read'), // code loaded from referenced directory 
     handler: 'index.handler' , 
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
