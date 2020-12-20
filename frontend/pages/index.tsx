import Head from "next/head";
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
    <div className="min-h-screen px-4 py-2 bg-gray-200">
      <Head>
        <title>EC2Throughput</title>
        <meta
          name="description"
          content="EC2Throughput tells you what it means when an EC2 instance says up to a certain network performance"
        />
        <meta
          name="keywords"
          content="aws, ec2, network, throughput, bandwidth, performance"
        />
        <meta name="author" content="Aaron Batilo" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <h1 className="text-4xl font-extrabold text-yellow-600">
        EC2Throughput.info
      </h1>
      <h2 className="text-2xl ">
        Find how much bandwidth "Up to" actually means
      </h2>
      <main>
        <section className="max-w-5xl p-2 mx-auto my-4 bg-yellow-500 rounded-lg">
          <a href="https://twitter.com/dvassallo/status/1120171727399448576?s=20">
            <blockquote className="italic">
              "TIL what EC2's 'Up to' means. I used to think it simply indicates
              best effort bandwidth, but apparently there's a hard baseline
              bottleneck for most EC2 instance types (those with an "up to").
              It's significantly smaller than the rating, and it can be reached
              in just a few minutes."
            </blockquote>
            <figcaption>-- Daniel Vassallo (@dvassalo)</figcaption>
          </a>
        </section>
        <div className="flex flex-col mx-8 mx-auto">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Instance Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Baseline (Maintained for 90% per hour of testing)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Burst (Maintained for 3% per hour of testing)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {instanceResults.map((results, i) => {
                      const {
                        instanceType,
                        lastUpdated,
                        baseline,
                        burst,
                      } = results;
                      return (
                        <tr className={i % 2 != 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {instanceType}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {baseline} Gigabits / second
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {burst} Gigabits / second
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {lastUpdated}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="pt-6">
        <p>
          This website works by running an iperf3 test for an hour between two
          instances in the same Availability Zone. This website takes{" "}
          <span className="font-extrabold">heavy</span> inspiration from the{" "}
          <a
            href="https://twitter.com/dvassallo/status/1120171727399448576"
            className="font-semibold text-yellow-600 hover:text-yellow-500"
          >
            @dvasallao Twitter thread
          </a>{" "}
          and{" "}
          <a
            href="https://cloudonaut.io/ec2-network-performance-cheat-sheet/"
            className="font-semibold text-yellow-600 hover:text-yellow-500"
          >
            this blog post from @andreaswittig / cloudonaut.io
          </a>
        </p>
        <p>
          <br />
          This entire project and all of its benchmarking methods are open
          source{" "}
          <a
            href="https://github.com/abatilo/ec2throughput.info"
            className="font-semibold text-yellow-600 hover:text-yellow-500"
          >
            on GitHub.
          </a>
        </p>
        <p>
          You can ask for more instance types or make other suggestions by
          opening an issue there.
        </p>
        <p>
          <br />
          If you'd like to help pay for other tests/instance types, I'd be
          grateful for a donation of any amount{" "}
          <a
            href="https://www.paypal.me/abatilo"
            className="font-semibold text-yellow-600 hover:text-yellow-500"
          >
            on PayPal.
          </a>{" "}
          One test costs usually between $3 - $10 depending on the instance
          being tested.
        </p>
      </footer>
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
