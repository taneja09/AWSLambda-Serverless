'use strict'
const AWS = require('aws-sdk');
const REGION = 'us-east-1';

const ses = new AWS.SES();
const documentClient = new AWS.DynamoDB.DocumentClient({region: REGION});

exports.handler = (event, context, callback)=>{
    const message = event.Records[0].Sns.Message;
    const messageObj = JSON.parse(message);
    const NoDataMessage = "You don't have any Bills Due. Please take some action. Thank You";
    const WithdataMessage = "You have following Bills Due: \n\n" + JSON.stringify(messageObj.data);
    const messageData =  messageObj.data.length > 0 ? WithdataMessage : NoDataMessage;
    const emailAddress = messageObj.email;
    const UserId = messageObj.ownerId;
    const SourceEmail = messageObj.domain;

    const emailParams = {
        Source: SourceEmail,
        Destination: {
            ToAddresses: [emailAddress]
        },
        Message: {
            Body: {
                Text: { 
                    
                    Data: messageData
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