import pyspark
from pyspark import SparkContext
import cv2
import numpy as np 
import scipy as sp
import struct
from helper_functions import *
from constants import *

BLOCK_SIZE = 8

def printer(x):
	print x

def converter(keyValue):
    img_id = keyValue[0]
    img = keyValue[1]
    
    Y, Cr, Cb = convert_to_YCrCb(img)
    return [((img_id, 0), [Y.shape[0], Y.shape[1], Y]), ((img_id, 1), [Cr.shape[0], Cr.shape[1], Cr]), ((img_id, 2), [Cb.shape[0], Cb.shape[1], Cb])]

def block_divider(triple):
    #given 2D matrix, divides up into blocks

    img_list = []
    
    matrix = triple[1][2]
    x = triple[1][0]
    y = triple[1][1]
    
    type_num = triple[0][1]
    img_id = triple[0][0]
    
    blocks = map(lambda mat : np.split(mat, matrix.shape[1]/BLOCK_SIZE, 1),
                              np.split(matrix, matrix.shape[0]/BLOCK_SIZE, 0)) 

    height = len(blocks)
    width = len(blocks[0])    
    
    for h in range(height):
        for w in range(width):
            block = [[h, w, x, y, blocks[h][w].astype(np.float32)]]
            kv_tuple = ((img_id, type_num), block)
            img_list.append(kv_tuple)
            
    return img_list

def adder(keyValue):
	keyValue[1][0][4] -= 128.0
	return keyValue

def subtractor(keyValue):
	keyValue[1][0][4] += 128.0
	return keyValue
	
def quantizer(keyValue):
    if keyValue[0][1] == 0:
        is_luminance = True
    else:
        is_luminance = False    
    inverse = False
     
    keyValue[1][0][4] = quantize_block(keyValue[1][0][4], is_luminance, QF, inverse)
    return keyValue    

def inv_quantizer(keyValue):
    if keyValue[0][1] == 0:
        is_luminance = True
    else:
        is_luminance = False    
    inverse = True    

    keyValue[1][0][4] = quantize_block(keyValue[1][0][4], is_luminance, QF, inverse)
    return keyValue    

def dct(keyValue):
    inverse = False
    keyValue[1][0][4] = dct_block(keyValue[1][0][4], inverse)
    return keyValue    

def inv_dct(keyValue):
    inverse = True
    keyValue[1][0][4] = dct_block(keyValue[1][0][4], inverse)
    return keyValue    

def normalize(keyValue):
    key = keyValue[0]
    x = keyValue[1][0][0]
    y = keyValue[1][0][1]
    h = keyValue[1][0][2]
    w = keyValue[1][0][3]
    matrix = keyValue[1][0][4]    
    rows, cols = matrix.shape
    
    for i in range(rows):
        for j in range(cols):
            if matrix[i][j] > 255:
                matrix[i][j] = 255.0
            if matrix[i][j] < 0:
                matrix[i][j] = 0.0
    
    return (key, [[x,y,h,w,matrix]])    

def int_converter(keyValue):
	keyValue[1][0][4] = keyValue[1][0][4].astype(np.uint8)
	return keyValue
        
def rebuild(keyValue1, keyValue2):
    return keyValue1 + keyValue2

def stitcher_2d(mlist):
    img_id = mlist[0][0]
    type_num = mlist[0][1]
    data = mlist[1]
    num_rows = data[0][2]
    num_cols = data[0][3]

    matrix_list = []
    data.sort(key=lambda x : x[1])
    for j in range(num_rows/8):
        sub_list = [triple[4] for triple in data if triple[0]==j]
        new_item = np.hstack(sub_list)
        matrix_list.append(new_item)
      
    matrix = np.vstack(matrix_list)
    return (img_id, [[type_num, matrix]]) 


def stitcher_3d(matrix_list):
    img_id = matrix_list[0]
    matrices = matrix_list[1]
    height, width = matrices[0][1].shape 
    matrices.sort(key=lambda x : x[0])
    m_list = [element[1] for element in matrices]
    matrix = np.dstack(m_list)
    
    return (img_id, matrix)    

def resizer(keyValue):
    height, width = [item[1] for item in keyValue[1] if item[0] == 0][0].shape
    
    for item in keyValue[1]:
        if item[0] != 0:
            item[1] = resize_image(item[1], width, height)

    return keyValue

def rgb_convert(keyValue):
    item = to_rgb(keyValue[1])
    return (keyValue[0], item)

### WRITE ALL HELPER FUNCTIONS ABOVE THIS LINE ###

def generate_Y_cb_cr_matrices(rdd):
    """
    THIS FUNCTION MUST RETURN AN RDD
    """
    #[(img_id, 0, Y_mat), (img_id, 1, Cr_mat), (img_id, 2, Cb_mat)]
    rdd = rdd.map(converter)
    rdd = rdd.flatMap(lambda a: a)
    return rdd

def generate_sub_blocks(rdd):
    """
    THIS FUNCTION MUST RETURN AN RDD
    """
    rdd = rdd.flatMap(block_divider)
    return rdd
    
def apply_transformations(rdd):
    """
    THIS FUNCTION MUST RETURN AN RDD
    """
    rdd = rdd.map(adder)    
    rdd = rdd.map(dct)
    rdd = rdd.map(quantizer)
    rdd = rdd.map(inv_quantizer)
    rdd = rdd.map(inv_dct)
    rdd = rdd.map(subtractor)    
    rdd = rdd.map(normalize)
    rdd = rdd.map(int_converter)
    return rdd
    

def combine_sub_blocks(rdd):
    """
    Given an rdd of subblocks from many different images, combine them together to reform the images.
    Should your rdd should contain values that are np arrays of size (height, width).
    """
    
    #determine whether to resize_image
    rdd = rdd.reduceByKey(rebuild)
    rdd = rdd.map(stitcher_2d)
    rdd = rdd.reduceByKey(rebuild)
    rdd = rdd.map(resizer)
    rdd = rdd.map(stitcher_3d)
    return rdd

def run(images):
    """
    Returns an RDD where all the images will be proccessed once the RDD is aggregated.
    The format returned in the RDD should be (image_id, image_matrix) where image_matrix 
    is an np array of size (height, width, 3).
    """
    sc = SparkContext()
    rdd = sc.parallelize(images, 16) \
        .map(truncate).repartition(16)
    rdd = generate_Y_cb_cr_matrices(rdd)
    rdd = generate_sub_blocks(rdd)
    rdd = apply_transformations(rdd)
    rdd = combine_sub_blocks(rdd)
    rdd = rdd.map(rgb_convert)
    return rdd

