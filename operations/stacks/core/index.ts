import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export default async (): Promise<void> => {
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

  const securityGroup = new aws.ec2.SecurityGroup("iperf", {
    ingress: [
      { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
      {
        protocol: "tcp",
        fromPort: 5201,
        toPort: 5201,
        cidrBlocks: ["0.0.0.0/0"],
      },
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

  const serverUserData = `#!/bin/sh
apt-get update;
apt-get install -yq iperf3 jq;
iperf3 -s --bind 0.0.0.0
`;

  // The instance that will run the iperf server
  const serverInstance = new aws.ec2.Instance("server", {
    vpcSecurityGroupIds: [securityGroup.id],
    availabilityZone: "us-east-1a", // Specify AZ so that we don't pay for transfer within same AZ.
    ami: ubuntu.then((ubuntu) => ubuntu.id),
    instanceType: "t3.micro",
    tags: {
      Description: "iperf3 server",
    },
    userData: serverUserData,
  });

  const clientUserData = pulumi.interpolate`#!/bin/sh
# Give server time to boot up
sleep 180;
apt-get update;
apt-get install -yq iperf3 jq;
iperf3 -c ${serverInstance.publicIp} --time 30 --interval 1
`;

  // The instance that will run the iperf server
  const clientInstance = new aws.ec2.Instance("client", {
    vpcSecurityGroupIds: [securityGroup.id],
    availabilityZone: "us-east-1a", // Specify AZ so that we don't pay for transfer within same AZ.
    ami: ubuntu.then((ubuntu) => ubuntu.id),
    instanceType: "t3.micro",
    tags: {
      Description: "iperf3 client",
    },
    userData: clientUserData,
  });
};
