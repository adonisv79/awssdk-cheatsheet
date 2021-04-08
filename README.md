#WHAT???
AWSSDK 3 cheatsheet :O

#HOW???
run the following
```
npm run start
```

#OUTPUT?
It should show the entire procedure from fetch list, put, get object and delete. a file named downloaded-blahblah.jpeg should be generated which came from S3

#PRE-REQUISITES?
## S3 Bucket with IAM
You must have an S3 bucket and IAM account in AWS which you can use

## ENVIRONMENT VARIABLES
create a .env file or set in your environment the following
S3_ACCESS_KEY_ID={PUT IAM ACCESS ID HERE}
S3_SECRET_ACCESS_KEY={PUT IAM SECRET KEY HERE}
S3_REGION={PUT REGION OF S3 BUCKET HERE (ex: ap-southeast-1)}
