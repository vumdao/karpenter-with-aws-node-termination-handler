import { App } from 'aws-cdk-lib';
import { CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION } from './constants';
import { NTHServiceAccount } from './nth-sa';
import { NTHSQSEventRules } from './nth-sqs-rules';


const app = new App();

const sqsRule = new NTHSQSEventRules(app, 'NTHSQSEventRules', {
  description: "Node Termination handler SQS target and Event Rules",
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT
  }
});

const serviceAcc = new NTHServiceAccount(app, 'NTHServiceAccount', {
  description: "NTH Service Account",
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT
  }
});

serviceAcc.addDependency(sqsRule);

app.synth();