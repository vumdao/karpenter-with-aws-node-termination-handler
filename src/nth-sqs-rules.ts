import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import { SqsQueue } from 'aws-cdk-lib/aws-events-targets';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { NTH_SQS_QUEUE_NAME } from './constants';


export class NTHSQSEventRules extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const spotSqs = new Queue(this, 'nth-dev-sqs', {
        queueName: NTH_SQS_QUEUE_NAME
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
                "EC2 Instance State-change Notification"
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
  }
}