import { S3 } from "aws-sdk";

type Props = {
  baseline: number;
  burst: number;
};

const Home = ({ baseline, burst }: Props) => {
  return (
    <div>
      Hello there! {baseline} -- {burst}
    </div>
  );
};

export async function getStaticProps() {
  const s3Client = new S3({ region: "us-east-1" });

  const res = await new Promise((resolve, reject) => {
    s3Client.getObject(
      {
        Bucket: "ec2throughput.info",
        Key: "results/c5-2xlarge/2020-12-20.json",
      },
      (err, data) => {
        if (err) reject(err);
        const bps = JSON.parse(data.Body.toString("utf-8"))
          .intervals.map((i: any) => i.sum)
          .map((s: any) => s.bits_per_second / 1000000000);
        resolve((bps as number[]).sort((a, b) => a - b));
      }
    );
  });

  const bps: number[] = res as number[];
  console.log(bps);

  return {
    props: {
      baseline: bps[Math.floor(0.1 * (bps.length + 1))].toFixed(3),
      burst: bps[Math.floor(0.97 * (bps.length + 1))].toFixed(3),
    },
  };
}

export default Home;
