import json
import numpy

bps = []
with open('/home/aaron/Downloads/2020-12-20 (1).json', 'r') as input_file:
    for interval in json.load(input_file)['intervals']:
        for stream in interval['streams']:
            bps += [int(stream['bits_per_second'])]

quantiles = [0.1, 0.25, 0.5, 0.75, 0.9, 1]
results = numpy.quantile(bps, quantiles)

for i in range(len(quantiles)):
    print(f'{quantiles[i]}\t--\t{results[i] / 1000000000:.3f} gigabits per second')
