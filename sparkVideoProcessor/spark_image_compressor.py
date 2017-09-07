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
    #height, width = matrix.shape
    #height_range = height/BLOCK_SIZE
    #width_range = width/BLOCK_SIZE
    
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
    """ 
    for h in range(height_range):
        for w in range(width_range):
            block = [[h*8, w*8, matrix[h*8:(h+1)*8, w*8:(w+1)*8].astype(np.float32)]]
            img_list.append(((img_id, type_num), block))
    return img_list
    """
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

#def rebuild_3d(keyValue1, keyValue2):
#    return keyValue1 + keyValue2
    
def stitcher_2d(mlist):
    img_id = mlist[0][0]
    type_num = mlist[0][1]
    data = mlist[1]
    num_rows = data[0][2]#[0][2]
    num_cols = data[0][3]#[0][3]

    matrix_list = []
    data.sort(key=lambda x : x[1])
    for j in range(num_rows/8):
        sub_list = [triple[4] for triple in data if triple[0]==j]
        #sub_list = data[4]
        new_item = np.hstack(sub_list)
        matrix_list.append(new_item)
      
    matrix = np.vstack(matrix_list)
    #return matrix
    return (img_id, [[type_num, matrix]]) 

    """img_id = mlist[0][0]
    type_num = mlist[0][1]
    rows_list = [triple[0] for triple in mlist[1]]
    cols_list = [triple[1] for triple in mlist[1]]
    num_rows = max(rows_list)
    num_cols = max(cols_list)

    matrix_list = []
    for j in range(num_rows + 1):
        matrix_list.append(np.hstack([triple[2] for triple in mlist[1] if triple[0]==j]))

    matrix = np.vstack(matrix_list)
    return (img_id, [[type_num, matrix]])
    """
    """rows_list = [triple[0] for triple in matrix_list[1]]
    cols_list = [triple[1] for triple in matrix_list[1]]
    num_rows = max(rows_list)*8 + 8 #remove the *8 later
    num_cols = max(cols_list)*8 + 8
    matrix = np.zeros((num_rows, num_cols), np.uint8)   
    
    matrix_list = []
    for j in range(max(rows_list) + 1):
        matrix_list.append(np.hstack([triple[2] for triple in matrix_list[1] if triple[0]==j]))
    
    matrix = np.vstack(matrix_list)
    """ 
    """
    for triple in matrix_list[1]:
        r = triple[0]    
        c = triple[1]
        block = triple[2]

        for i in range(8):
            for j in range(8):
                matrix[r + i][c + j] = block[i][j]
    """    
    #return (img_id, [[type_num, matrix]])

def stitcher_3d(matrix_list):
    img_id = matrix_list[0]
    matrices = matrix_list[1]
    height, width = matrices[0][1].shape 
    #matrix = np.zeros((height, width, 3), np.uint8)
    
    #for element in matrices:
    #    matrix[element[0]] = element[1]
    #dtype = [('type', int), ('matrix', np.ndarray)]
    #m_sort_list = np.array(matrices, dtype=dtype)
    #msl = np.sort(m_sort_list, order='type')
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
    ### BEGIN SOLUTION ###
    rdd = rdd.map(converter)
    rdd = rdd.flatMap(lambda a: a)
    return rdd

def generate_sub_blocks(rdd):
    """
    THIS FUNCTION MUST RETURN AN RDD
    """
    ### BEGIN SOLUTION ###
    #[(img_id, 0, x,y,Y_mat), (img_id, 1, x,y,Cr_mat), (img_id, 2, x,y,Cb_mat)]
    rdd = rdd.flatMap(block_divider)
    #rdd = rdd.flatMap(lambda a: a)
    #rdd = rdd.reduce(lambda a, b: a + b)    
    return rdd
    
    # not sure whether I get 1 dictionary or 3 at the end of this step
    # find out by doing rdd.count() action on the return value

def apply_transformations(rdd):
    """
    THIS FUNCTION MUST RETURN AN RDD
    """
    ### BEGIN SOLUTION ###
    
    rdd = rdd.map(adder)    
    rdd = rdd.map(dct)
    rdd = rdd.map(quantizer)
    #rdd.foreach(printer)
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

    THIS FUNCTION MUST RETURN AN RDD
    """
    ### BEGIN SOLUTION ###
    
    #determine whether to resize_image
    rdd = rdd.reduceByKey(rebuild)
    #rdd.foreach(printer)
    rdd = rdd.map(stitcher_2d)
    #rdd.foreach(printer)
    #rdd.foreach(printer)
    rdd = rdd.reduceByKey(rebuild)
    rdd = rdd.map(resizer)
    rdd = rdd.map(stitcher_3d)
    return rdd

def run(images):
    """
    THIS FUNCTION MUST RETURN AN RDD

    Returns an RDD where all the images will be proccessed once the RDD is aggregated.
    The format returned in the RDD should be (image_id, image_matrix) where image_matrix 
    is an np array of size (height, width, 3).
    """
    sc = SparkContext()
    #EDITS
    rdd = sc.parallelize(images, 16) \
        .map(truncate).repartition(16)
    rdd = generate_Y_cb_cr_matrices(rdd)
    rdd = generate_sub_blocks(rdd)
    rdd = apply_transformations(rdd)
    rdd = combine_sub_blocks(rdd)
    #rdd.foreach(printer)

    ### BEGIN SOLUTION HERE ###
    # Add any other necessary functions you would like to perform on the rdd here
    # Feel free to write as many helper functions as necessary

    rdd = rdd.map(rgb_convert)
    return rdd

