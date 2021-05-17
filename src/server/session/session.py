# this function creates the necessary files using the session directory
import sys
import json
import os
class Session:
    def __init__(self, session_file):
        with open(session_file, 'rt') as f:
            text = f.read()
            self.session = json.loads(text)
        
        # We need to create a few folders. This would have to be update 
        os.makedirs("project/{}/session/{}/".format(self.session['project'], self.session['sessionId']))

        





if __name__ == "__main__":
    items = Session()