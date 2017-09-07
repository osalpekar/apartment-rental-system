import cv2
import numpy as np 
import scipy as sp
import struct
from constants import *

def quantize_block(block, is_luminance, QF=99, inverse=False):
    """
    Applies quantization or inverse quantization to an 8 by 8 block.

    is_luminance is true of it is a block from the Y matrix, else it is false.
    """
    scale = 1.0
    if QF < 50 and QF >= 1:
        scale = np.floor( 5000 / QF ) 
    elif QF < 100:
        scale = 200 - 2 * QF
    else:
        scale = 200 - 2 * 99
    scale = scale / 100.0
    Q = QC * scale
    if is_luminance:
        Q = QY * scale
    if inverse:
        return block * Q 
    else:
        return np.round(block / Q)

def dct_block(block, inverse=False):
    """
    Applies DCT or inverse DCT to an 8 by 8 block.
    """
    block = block.astype(np.float32)
    if inverse:
        return cv2.idct(block)
    else:
        return cv2.dct(block)

def convert_to_YCrCb(img):
    """
    Converts an image to Y,Cr,Cb colorspace and subsamples the Cr and Cb color spaces.

    Note that Y.shape is (height, width)
    while crf.shape and cbf.shape are (height/2, width/2)
    You will need to use resize_image after you finish performing transformations on it
    to reconstruct the image
    """
    img = cv2.cvtColor(img, bgr2ycrbr)
    Hscale = 2
    Vscale = 2
    Y = img[:,:,0]
    crf = cv2.boxFilter(img[:,:,1], ddepth=-1, ksize=(2,2))
    cbf = cv2.boxFilter(img[:,:,2], ddepth=-1, ksize=(2,2))
    crf = crf[::Vscale, ::Hscale]
    cbf = cbf[::Vscale, ::Hscale]
    return (Y, crf, cbf)

def resize_image(img, width, height):
    """
    Resize an image to the given width and height. It will be automatically padded.
    """
    return cv2.resize(img, (width, height))

def to_rgb(img):
    """
    Converts and image from YCbCr back to RGB
    """
    return cv2.cvtColor(img, ycrbr2bgr)

def truncate(pair):
    """
    Makes sure the images are the right size to fit a whole number of 8 by 8 blocks.
    """
    k = pair[0]
    img = pair[1]
    height, width = np.array(img.shape[:2])/8 * 8
    img = img[:height, :width]
    return (k, img)


def naive_compress(image):
    image = truncate((None, image))[1]
    Y, crf, cbf = convert_to_YCrCb(image)
    channels = [Y, crf, cbf]
    height, width = np.array(image.shape[:2])
    reimg = np.zeros((height, width, 3), np.uint8)
    for idx, channel in enumerate(channels):
        no_rows = channel.shape[0]
        no_cols = channel.shape[1]
        dst = np.zeros((no_rows, no_cols), np.float32)
        no_vert_blocks = no_cols / b_size
        no_horz_blocks = no_rows / b_size
        for j in range(no_vert_blocks):
            for i in range(no_horz_blocks):
                i_start = i * b_size
                i_end = (i + 1) * b_size
                j_start = j * b_size
                j_end = (j + 1) * b_size
                cur_block = channel[i_start : i_end, j_start : j_end]
                dct = dct_block(cur_block.astype(np.float32) - 128)
                q = quantize_block(dct, idx==0, QF)
                inv_q = quantize_block(q, idx==0, QF, inverse = True)
                inv_dct = dct_block(inv_q, inverse = True)
                dst[i_start : i_end, j_start : j_end] = inv_dct
        dst = dst + 128
        dst[dst>255] = 255
        dst[dst<0] = 0
        dst = cv2.resize(dst, (width, height))
        reimg[:,:,idx] = dst
    return cv2.cvtColor(reimg, ycrbr2bgr)

