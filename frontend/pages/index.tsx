import Head from "next/head";
import Script from 'next/script'
import aws, { S3, Pricing } from "aws-sdk";

type PerInstanceProps = {
  instanceType: string;
  lastUpdated: string;
  baseline: number;
  burst: number;
  advertised: string;
  price: string;
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
              bottleneck for most EC2 instance types (those with an 'up to').
              It's significantly smaller than the rating, and it can be reached
              in just a few minutes."
            </blockquote>
            <figcaption>-- Daniel Vassallo (@dvassallo)</figcaption>
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
                        Advertised
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Price OnDemand (USD in us-east-1)
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
                        advertised,
                        price,
                      } = results;
                      return (
                        <tr
                          key={instanceType}
                          className={i % 2 != 0 ? "bg-gray-50" : "bg-white"}
                        >
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
                            {advertised}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            ${price} hourly
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
        <Script src="https://scripts.simpleanalyticscdn.com/latest.js" strategy="lazyOnLoad" />
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
            @dvassallo Twitter thread
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
          If you would like to support the website, consider{" "}
          <a
            href="https://www.buymeacoffee.com/abatilo"
            className="font-semibold text-yellow-600 hover:text-yellow-500"
          >
            buying me a coffee
          </a>
          .
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
  const pricingClient = new Pricing({ region: "us-east-1" });

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
                  async (err, data) => {
                    if (err) reject(err);
                    const bps = JSON.parse(data.Body.toString("utf-8"))
                      .intervals.map(
                        (i: any) => i.sum.bits_per_second / 1000000000
                      )
                      .sort((a: number, b: number) => a - b);

                    const lastUpdated = Key.slice(
                      Key.lastIndexOf("/") + 1,
                      Key.lastIndexOf(".")
                    );
                    const instanceType = Key.slice(
                      Key.indexOf("/") + 1,
                      Key.lastIndexOf("/")
                    ).replace("-", ".");

                    const quantile = (
                      numbers: number[],
                      percentile: number
                    ) => {
                      return numbers[
                        Math.floor(percentile * (bps.length + 1))
                      ].toFixed(3);
                    };

                    const baseline = quantile(bps, 0.1);
                    const burst = quantile(bps, 0.97);

                    const { networkPerformance, price } = await new Promise(
                      (resolve, reject) => {
                        pricingClient.getProducts(
                          {
                            ServiceCode: "AmazonEC2",
                            Filters: [
                              {
                                Type: "TERM_MATCH",
                                Field: "instanceType",
                                Value: instanceType,
                              },
                              {
                                Type: "TERM_MATCH",
                                Field: "location",
                                Value: "US East (N. Virginia)",
                              },
                              {
                                Type: "TERM_MATCH",
                                Field: "operatingSystem",
                                Value: "Linux",
                              },
                              {
                                Type: "TERM_MATCH",
                                Field: "preInstalledSw",
                                Value: "NA",
                              },
                              {
                                Type: "TERM_MATCH",
                                Field: "capacitystatus",
                                Value: "Used",
                              },
                              {
                                Type: "TERM_MATCH",
                                Field: "tenancy",
                                Value: "Shared",
                              },
                            ],
                            MaxResults: 1,
                          },
                          (err, data) => {
                            if (err) reject(err);

                            const { PriceList: priceList } = data;
                            const {
                              terms: { OnDemand },
                              product: {
                                attributes: { networkPerformance },
                              },
                            } = JSON.parse(JSON.stringify(priceList[0]));

                            const onDemandID = Object.keys(OnDemand)[0];
                            const priceDimensionsID = Object.keys(
                              OnDemand[onDemandID].priceDimensions
                            )[0];

                            const price =
                              OnDemand[onDemandID].priceDimensions[
                                priceDimensionsID
                              ].pricePerUnit.USD;
                            resolve({ networkPerformance, price });
                          }
                        );
                      }
                    );

                    resolve({
                      lastUpdated,
                      instanceType,
                      baseline,
                      burst,
                      advertised: networkPerformance,
                      price,
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
