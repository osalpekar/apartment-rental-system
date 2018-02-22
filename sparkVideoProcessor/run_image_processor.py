import pyspark
from pyspark import SparkContext
import cv2
import os
import numpy as np 
import scipy as sp
import struct
import argparse
import mysql.connector
import cStringIO
# from PIL import Image
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
    #connecting mysql
    # db = mysql.connector.connect(user='user', password='runner',
    #                           host=os.environ['mySQLHost'],
    #                           database='my_db')
    # cursor=db.cursor()
    # db.commit()
    sc = SparkContext()
    sc.addPyFile("./helper-functions.py")
    sc.addPyFile("./constants.py")
    sc.addPyFile("./spark_image_compressor.py")
    while True:
        # sql1='select * from people'
        # cursor.execute(sql1)
        # data=cursor.fetchall()
        # if len(data) % 3 == 0:

            # file_like=cStringIO.StringIO(data[0][0])
            # img=PIL.Image.open(file_like)
            # this is the line that gets the images
        image = cv2.imread(args.input, cv2.IMREAD_UNCHANGED)
        image_collection = [(x, image) for x in range(10)]
        rdd = run(image_collection, sc).collect()
        cv2.imwrite(args.output, rdd[0][1])


