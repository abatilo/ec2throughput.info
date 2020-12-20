# ec2throughput.info

The smaller and cheaper EC2 instances are listed as having network performance
using the phrase "up to". For the longest thing, I always thought this meant
that performance would match that number but might possibly drop temporarily.

After doing some research, I came across [this Twitter thread by
@dvasallo](https://twitter.com/dvassallo/status/1120171727399448576).
Apparently, my misunderstanding is much more common than I thought. There
appears to actually be a credit system of sorts and the listed "up to" value is
actually best case scenario. Once best case usage is sustained for too long,
your instance will have its network performance limited.

In the same Twitter thread, [this blog
post](https://cloudonaut.io/ec2-network-performance-cheat-sheet/) is referenced
which agrees with Daniel's research.

I've had situations come up at work where network performance would suddenly
get worse and it was never clear why that happened until now.

Both listed resources have excel sheets with some numbers, but I wanted to
throw together a website that made this information even more accessible and
indexable. So that's what I'm doing! The name of the website:
`ec2throughput.info` is taking direct inspiration from
[ec2instances.info](https://ec2instances.info/).

## Methodology

I'm using a combination of Pulumi's infrastructure as code solution (all under
the [./operations](./operations/)) combined with GitHub Actions to apply the
Pulumi code. I run iperf3 on two machines that are placed in the same
availability zone in AWS. These tests run for an hour and we store the
information in S3.

The website at [https://ec2throughput.info](https://ec2throughput.info) is
hosted on Vercel. Whenever a new iperf3 test is complete, the build process is
kicked off where the website bundle will download the latest data we have for
each instance type and will convert that into a static, client side only
website.
