import pyspark
from pyspark import SparkContext
import cv2
import numpy as np 
import scipy as sp
import struct
import argparse
from helper_functions import *
from constants import *
from spark_image_compressor import run

### DO NOT CHANGE THIS FILE ###
parser = argparse.ArgumentParser()
parser.add_argument('-t', '--test', action='store_true')
parser.add_argument('-i', '--input')
parser.add_argument('-o', '--output')
args = parser.parse_args()
pyspark.SparkConf().set('spark.driver.memory','15g')

if args.test:
    np.random.seed(1)
    image_collection = [(x, np.round(np.random.rand(400,400,3)*255).astype(np.uint8)) for x in range(100)]
    rdd = run(image_collection).collect()
    rdd.sort(key=lambda x: x[0])
    rdd = [str(x[0]) + ": " + str(x[1]) + "\n" for x in rdd]
    with open("test/test_output.txt", 'w') as f:
        f.writelines(rdd)
else:
    image = cv2.imread(args.input, cv2.IMREAD_UNCHANGED)
    image_collection = [(x, image) for x in range(10)]
    rdd = run(image_collection).collect()
    cv2.imwrite(args.output, rdd[0][1])


