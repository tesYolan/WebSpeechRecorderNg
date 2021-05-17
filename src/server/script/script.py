# this file takes a csv pair and then creates a script for the thing to be read. 
import sys
import csv

class script:
    def __init__(csv_file):
        # this file creates system
        with open(csv_file, 'wt') as f:
            pass