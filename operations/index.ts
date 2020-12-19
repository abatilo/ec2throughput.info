import * as fs from "fs";
import * as path from "path";
import * as pulumi from "@pulumi/pulumi";

const stackName = pulumi.getStack();

if (
  !fs.existsSync(
    path.relative(process.cwd(), `${__dirname}/stacks/${stackName}`)
  )
) {
  throw new Error(`${stackName} stack not found!`);
}

require(`./stacks/${stackName}`).default();
