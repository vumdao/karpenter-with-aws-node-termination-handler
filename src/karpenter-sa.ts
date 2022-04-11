import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Role, FederatedPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { KARPENTER_CONTROLLER_SERVICEACCOUNT, KARPENTER_NAMESPACE, OIDC_ARN, OIDC_PROVIDER } from './constants';

export class KarpenterServiceAccount extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const ec2Statement = new PolicyStatement({
            sid: 'AutoScalingGroup',
            actions: [
                "ec2:CreateLaunchTemplate",
                "ec2:CreateFleet",
                "ec2:RunInstances",
                "ec2:CreateTags",
                "iam:PassRole",
                "ec2:TerminateInstances",
                "ec2:DeleteLaunchTemplate",
                "ec2:DescribeLaunchTemplates",
                "ec2:DescribeInstances",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeSubnets",
                "ec2:DescribeInstanceTypes",
                "ec2:DescribeInstanceTypeOfferings",
                "ec2:DescribeAvailabilityZones",
                "ssm:GetParameter"
            ],
            resources: ['*'],
            conditions: {
                StringEquals: { 'aws:RequestedRegion': props.env?.region },
            },
        });

        const karpenterControllerRole = new Role(this, 'karpenterControllerRole', {
            roleName: 'karpenter-controller-dev',
            assumedBy: new FederatedPrincipal(
                OIDC_ARN,
                {
                    'StringEquals': {
                        [`${OIDC_PROVIDER}:sub`]: `system:serviceaccount:${KARPENTER_NAMESPACE}:${KARPENTER_CONTROLLER_SERVICEACCOUNT}`,
                        [`${OIDC_PROVIDER}:aud`]: 'sts.amazonaws.com',
                    }
                },
                'sts:AssumeRoleWithWebIdentity'),
        });

        karpenterControllerRole.addToPolicy(ec2Statement);

        new CfnOutput(this, 'KarpenterControllerRole', { value: karpenterControllerRole.roleArn });
    }
}