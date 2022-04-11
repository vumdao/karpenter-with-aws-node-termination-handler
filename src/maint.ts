import { App } from 'aws-cdk-lib';
import { CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION } from './constants';
import { KarpenterServiceAccount } from './karpenter-sa';
import { NodeTerminateHandler } from './nth-sa-sqs';


const app = new App();

new KarpenterServiceAccount(app, 'KarpenterControllerSA', {
  description: 'Karpenter IAM Service Account',
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT
  }
});

new NodeTerminateHandler(app, 'NTHDev', {
  description: "Node Termination handler for spot interuption",
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT
  }
})
app.synth();