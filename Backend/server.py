#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import asyncio
from autobahn.asyncio.websocket import WebSocketServerFactory
from autobahn.asyncio.websocket import WebSocketServerProtocol


class MyServerProtocol(WebSocketServerProtocol):
    def onMessage(self, payload, isBinary):
        ## echo back message verbatim
        obj = json.loads(payload.decode('utf8'))
        messages.append(obj)
        print(messages)

        # Append the this object to the senders dict if it's not there already
        if not senders.__contains__(str(self)):
            senders[str(self)] = self

        send_to_everyone(payload, isBinary)


# Set up a new list
messages = []

# Set up a new dict of senders
senders = {}


def send_to_everyone(payload, isBinary):
    for k, v in senders.items():
        v.sendMessage(payload, isBinary)
        print(v)


# Create a factory and set its protocol
factory = WebSocketServerFactory()
factory.protocol = MyServerProtocol

loop = asyncio.get_event_loop()
coro = loop.create_server(factory, '127.0.0.1', 8999)
server = loop.run_until_complete(coro)

try:
    loop.run_forever()
except KeyboardInterrupt:
    pass
finally:
    server.close()
    loop.close()
