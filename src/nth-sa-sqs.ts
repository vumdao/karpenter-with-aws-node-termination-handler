import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import { SqsQueue } from 'aws-cdk-lib/aws-events-targets';
import { Role, FederatedPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION, OIDC_ARN, OIDC_PROVIDER } from './constants';


export class NodeTerminateHandler extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const spotSqs = new Queue(this, 'nth-dev-sqs', {
        queueName: 'nth-dev-sqs'
    });

    const sqsTarget = new SqsQueue(spotSqs);

    new Rule(this, 'ec2-spot-event-rule', {
        ruleName: 'ec2-spot-event-rule',
        targets: [sqsTarget],
        eventPattern: {
            source: ["aws.ec2"],
            detailType: [
                "EC2 Spot Instance Interruption Warning",
                "EC2 Instance Rebalance Recommendation",
                "EC2 Instance State-change Notification",

            ]
        }
    });

    new Rule(this, 'aws-health-event-rule', {
        ruleName: 'aws-health-event-rule',
        targets: [sqsTarget],
        eventPattern: {
            source: ["aws.health"],
            detailType: [ "AWS Health Event" ]
        }
    });

    new CfnOutput(this, 'nth-dev-sqs-output', { value: spotSqs.queueUrl});

    const sqsSts = new PolicyStatement({
      sid: 'SQSSpotEvent',
      actions: [
        "sqs:DeleteMessage",
        "sqs:ReceiveMessage"
      ],
      resources: [spotSqs.queueArn]
    });

    const ec2Sts = new PolicyStatement({
        sid: "EC2Handle",
        actions: ["ec2:DescribeInstances"],
        resources: ['*'],
        conditions: {
            StringEquals: {
                'aws:RequestedRegion': CDK_DEFAULT_REGION,
                'aws:PrincipalAccount': CDK_DEFAULT_ACCOUNT
            },
        },
    });

    const NTHRole = new Role(this, 'nth-dev-role', {
      roleName: 'nth-dev-role',
      assumedBy: new FederatedPrincipal(
        OIDC_ARN,
        {
            'StringEquals': {
                [`${OIDC_PROVIDER}:sub`]: 'system:serviceaccount:kube-system:aws-node-termination-handler',
                [`${OIDC_PROVIDER}:aud`]: 'sts.amazonaws.com',
            }
        },
        'sts:AssumeRoleWithWebIdentity')
    });

    NTHRole.addToPolicy(sqsSts);
    NTHRole.addToPolicy(ec2Sts);

    new CfnOutput(this, '${namePrefix}-role-output', { value: NTHRole.roleArn });
  }
}