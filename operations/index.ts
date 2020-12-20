import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();

const clientType = config.requireSecret("clientInstanceType");

const clientInstanceType = clientType || pulumi.output("t3.micro");
const safeClientInstanceType = clientInstanceType.apply((s) =>
  s.replace(".", "-")
);

// c5.18xlarge to match:
// https://cloudonaut.io/ec2-network-performance-cheat-sheet/
const serverInstanceType = "c5.18xlarge";

// IAM role for writing results into S3
const role = new aws.iam.Role("ec2t-role", {
  assumeRolePolicy: `{
  "Version": "2012-10-17",
  "Statement": {
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }
}`,
});

const policy = new aws.iam.Policy("ec2t-policy", {
  policy: `{
   "Version":"2012-10-17",
   "Statement":[
      {
         "Effect":"Allow",
         "Action":[
            "s3:PutObject",
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:DeleteObject",
            "s3:DeleteObjectVersion"
         ],
         "Resource":"arn:aws:s3:::ec2throughput.info/results/*"
      }
   ]
}`,
});

const rolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  "ec2t-rolePolicyAttachment",
  {
    role,
    policyArn: policy.arn,
  }
);

const instanceProfile = new aws.iam.InstanceProfile("ec2t-instanceProfile", {
  name: safeClientInstanceType,
  role,
});

const ubuntu = aws.getAmi({
  mostRecent: true,
  filters: [
    {
      name: "name",
      values: ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"],
    },
    {
      name: "virtualization-type",
      values: ["hvm"],
    },
  ],
  owners: ["099720109477"],
});

const securityGroup = new aws.ec2.SecurityGroup("ec2t-securityGroup", {
  ingress: [
    { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
  ],
  egress: [
    {
      protocol: "tcp",
      fromPort: 0,
      toPort: 65535,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
});

const securityGroupRule = new aws.ec2.SecurityGroupRule(
  "ec2t-securityGroupRule",
  {
    type: "ingress",
    protocol: "-1",
    fromPort: 0,
    toPort: 65535,
    securityGroupId: securityGroup.id,
    sourceSecurityGroupId: securityGroup.id,
  }
);

const serverUserData = `#!/bin/sh
apt-get update;
echo "Installing tools";
apt-get install -yq iperf3 jq;
echo "Running server";
iperf3 -s --daemon --bind 0.0.0.0
`;

// The instance that will run the iperf server
const serverInstance = new aws.ec2.Instance("server", {
  vpcSecurityGroupIds: [securityGroup.id],
  availabilityZone: "us-west-2a", // Specify AZ so that we don't pay for transfer within same AZ.
  ami: ubuntu.then((ubuntu) => ubuntu.id),
  // instanceType: "m5n.8xlarge",
  instanceType: serverInstanceType,
  tags: {
    Name: pulumi.interpolate`server ${clientInstanceType}`,
  },
  userData: serverUserData,
});

const clientUserData = pulumi.interpolate`#!/bin/sh
# Give server time to boot up
sleep 300;
apt-get update;
apt-get install -yq iperf3 awscli jq;
echo "Running client";
iperf3 -c ${
  serverInstance.privateIp
} --time 3600 --interval 60 --json --version4 -P 10 | jq -c '{intervals: .intervals}' | aws s3 cp - "s3://ec2throughput.info/results/${safeClientInstanceType}/${new Date()
  .toISOString()
  .slice(0, 10)}.json"
`;

// The instance that will run the iperf server
const clientInstance = new aws.ec2.Instance(
  "client",
  {
    vpcSecurityGroupIds: [securityGroup.id],
    availabilityZone: "us-west-2a", // Specify AZ so that we don't pay for transfer within same AZ.
    ami: ubuntu.then((ubuntu) => ubuntu.id),
    iamInstanceProfile: instanceProfile,
    instanceType: clientInstanceType,
    tags: {
      Name: pulumi.interpolate`client ${clientInstanceType}`,
    },
    userData: clientUserData,
  },
  { dependsOn: serverInstance }
);
