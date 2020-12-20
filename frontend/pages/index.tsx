import aws, { S3 } from "aws-sdk";

type PerInstanceProps = {
  instanceType: string;
  lastUpdated: string;
  baseline: number;
  burst: number;
};

type Props = {
  instanceResults: PerInstanceProps[];
};

const Home = ({ instanceResults }: Props) => {
  return (
    <div>
      <ul>
        {instanceResults.map((results) => {
          const { instanceType, lastUpdated, baseline, burst } = results;
          return (
            <li key={instanceType}>
              {instanceType} has a baseline of {baseline} Gb/s and a burst of{" "}
              {burst} Gb/s and was last updated on {lastUpdated}.
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export async function getStaticProps() {
  // Custom env vars take precedence
  // https://vercel.com/knowledge/how-can-i-use-aws-sdk-environment-variables-on-vercel
  aws.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  });

  const s3Client = new S3({ region: "us-east-1" });

  const res = await new Promise((resolve, reject) => {
    s3Client.listObjectsV2(
      {
        Bucket: "ec2throughput.info",
        Delimiter: "/",
        Prefix: "results/",
      },
      async (err, data) => {
        if (err) reject(err);

        const { CommonPrefixes: prefixes } = data;
        const instanceTypes = prefixes.map((p) =>
          p.Prefix.slice(8, p.Prefix.length - 1).replace("-", ".")
        );

        let allInstanceData = [];

        for (let i = 0; i < prefixes.length; i++) {
          const singleInstanceData = await new Promise((resolve, reject) => {
            s3Client.listObjectsV2(
              {
                Bucket: "ec2throughput.info",
                Prefix: prefixes[i].Prefix,
              },
              (err, data) => {
                if (err) reject(err);
                const { Key } = data.Contents[data.Contents.length - 1];

                s3Client.getObject(
                  {
                    Bucket: "ec2throughput.info",
                    Key,
                  },
                  (err, data) => {
                    if (err) reject(err);
                    const bps = JSON.parse(data.Body.toString("utf-8"))
                      .intervals.map((i: any) => i.sum)
                      .map((s: any) => s.bits_per_second / 1000000000)
                      .sort((a, b) => a - b);

                    resolve({
                      lastUpdated: Key.slice(
                        Key.lastIndexOf("/") + 1,
                        Key.lastIndexOf(".")
                      ),
                      instanceType: prefixes[i].Prefix.slice(
                        8,
                        prefixes[i].Prefix.length - 1
                      ).replace("-", "."),
                      baseline: bps[Math.floor(0.1 * (bps.length + 1))].toFixed(
                        3
                      ),
                      burst: bps[Math.floor(0.97 * (bps.length + 1))].toFixed(
                        3
                      ),
                    });
                  }
                );
              }
            );
          });

          allInstanceData.push(singleInstanceData);
        }
        resolve(
          allInstanceData.sort((a, b) => {
            if (a.instanceType < b.instanceType) {
              return -1;
            }
            if (a.instanceType > b.instanceType) {
              return 1;
            }
            return 0;
          })
        );
      }
    );
  });

  return {
    props: {
      instanceResults: res,
    },
  };
}

export default Home;
