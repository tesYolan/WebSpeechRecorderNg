# Basic RESTAPI for WebSpeechRecorderNG

The main file that is required is a session file with the following configuration

```json
{
    "debugMode": false,
    "sessionId": 1,
    "type": "NORM",
    "project": "AmharicAudioRecordings",
    "sealed": false,
    "status": "COMPLETED",
    "script": 1,
```

There would be updates to this file from the REST end point. This indicates there should be a folder: "project/AmharicAudioRecordings/session/1/" and "project/AmharicAudioRecordings/session/1/recfile.json". THis can be created using the session.py or using `os.makedirs("project/AmharicAudioRecordings/session/1/)`

There should also be a a file called "AmharicAudioRecordings" in the project file. A sample config would be

```
{
    "name": "AmharicAudioRecordings",
    "audioFormat": {
        "channels": 1
    },
    "audioDevices": [
      {
        "name": "HypeMiC",
        "playback": false,
        "regex": true
      }],
    "speakerWindowShowStopRecordAction": true
}
```

Notice that the audioDevices could be something else for you. 

The script also requires a file `script/1.json` to also exist. 

```
{
    "type": "script",
    "scriptId": 1,
    "name": "Test1", 

    "sections": [
      {
        "name": "Introduction", 
        "mode": "MANUAL", 
        "order": "SEQUENTIAL", 
        "groups" : [
          {
            "promptItems": [{
            "itemcode": "I0", 
            "mediaitems": [
              {
                "text": "This is something!"
              }
            ]
            }
          ]
          },
          {
            "promptItems": [{
            "itemcode": "I1", 
            "mediaitems": [
              {
                "text": "This is another thing"
              }
            ]
            }
          ]
          },
          {
            "promptItems": [{
            "itemcode": "I2", 
            "mediaitems": [
              {
                "text": "Wow, this is another items."
              }
            ]
            }
          ]
          }
        ]
      }
    ]
  }
```

Also there needs to be `recordingfile` audio. But this doesn't work. 

And `script/1-script.json` notice it the word `1`. 
```
                {
                    "I0": "This is something!",
                    "I1": "This is another thing",
                    "I2": "Wow, this is another items."
                }
```

# T0DO

* When session is refreshed, the system does fetch the recordings. 
* The `recordingfile` routes don't really work well. 
* Better orgnaiztion of the script. 

