import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Role, FederatedPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION, NTH_SQS_QUEUE_NAME, OIDC_ARN, OIDC_PROVIDER } from './constants';


export class NTHServiceAccount extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const sqsSts = new PolicyStatement({
      sid: 'SQSSpotEvent',
      actions: [
        "sqs:DeleteMessage",
        "sqs:ReceiveMessage"
      ],
      resources: [`arn:aws:sqs:${CDK_DEFAULT_REGION}:${CDK_DEFAULT_ACCOUNT}:${NTH_SQS_QUEUE_NAME}`]
    });

    const ec2Sts = new PolicyStatement({
        sid: "EC2Handle",
        actions: [
            "ec2:DescribeInstances",
            "autoscaling:Describe*"
        ],
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