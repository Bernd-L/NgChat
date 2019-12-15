#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import websockets
import time

import cv2
import base64

import numpy as np
face_cascade = cv2.CascadeClassifier(
    "/usr/share/opencv4/haarcascades_cuda/haarcascade_frontalface_default.xml")
eye_cascade = cv2.CascadeClassifier(
    "/usr/share/opencv4/haarcascades_cuda/haarcascade_eye.xml")


async def webcam_stream(websocket, path):
    while True:
        cap = cv2.VideoCapture(0)

        key = ''
        while key != 'q':
            ret, frame = cap.read()

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)
            for (x, y, w, h) in faces:
                frame = cv2.rectangle(frame, (x, y), (x + w, y + h),
                                      (255, 0, 0), 2)
                roi_gray = gray[y:y + h, x:x + w]
                roi_color = frame[y:y + h, x:x + w]
                eyes = eye_cascade.detectMultiScale(roi_gray)
                for (ex, ey, ew, eh) in eyes:
                    cv2.rectangle(roi_color, (ex, ey), (ex + ew, ey + eh),
                                  (0, 255, 0), 2)

            ret, jpg = cv2.imencode('.jpg', frame)
            # print(jpg)
            b64 = base64.b64encode(jpg)
            # print(b64)
            await websocket.send(str(b64)[2:-1])
            # cv2.imshow('Window', frame)
            intkey = cv2.waitKey(50)
            if intkey > 0:
                key = chr(intkey)
            else:
                key = ''


start_server = websockets.serve(webcam_stream, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
