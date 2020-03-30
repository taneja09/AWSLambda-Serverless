'use strict'
const AWS = require('aws-sdk');
const envParams = require('./AWSConfiguration/aws-config');

AWS.config.update({
    region: envParams.REGION,
    accessKeyId : envParams.accessKeyId,
    secretAccessKey :envParams.secretAccessKey
});

const ses = new AWS.SES();
const documentClient = new AWS.DynamoDB.DocumentClient({region: envParams.REGION});

exports.handler = (event, context, callback)=>{
    const message = event.Records[0].Sns.Message;
    const messageObj = JSON.parse(message);
    const messageData = JSON.stringify(messageObj.data);
    const emailAddress = messageObj.email;
    const UserId = messageObj.ownerId;

    //console.log(emailAddress + " " + UserId);

    const emailParams = {
        Source: "ses-smtp-user.20200329-025853@dev.divyataneja.me",
        Destination: {
            ToAddresses: [emailAddress]
        },
        Message: {
            Body: {
                Text: { Data: messageData
                } 
            },
            Subject: { Data: "Bills Due"   
            }
        }
    };

    const SECONDS_IN_AN_HOUR = 60 * 60;
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    const expirationTime = secondsSinceEpoch + SECONDS_IN_AN_HOUR;

    const DDBParams = {
        TableName: "UserBillsDue",
                Item: {
                    User_Id: UserId,
                    UserTTL: expirationTime
                }
        };

        ses.sendEmail(emailParams, function (err, data) {
            callback(null, {err: err, data: data});
            if (err) {
                console.log(err);
            } else {
                console.log(data); 
                    documentClient.put(DDBParams ,function (err,data){
                      if(err)
                      console.log(err);
                      else
                      console.log(data);
                    });       
            }
        });
};