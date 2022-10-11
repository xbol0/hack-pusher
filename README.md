# hack-pusher

Simple push bot for [hack.chat](https://hack.chat)

Can be deployed on Deno Deploy.

## Usage

Enviroments:

|name|desciprtion|default|
|:-:|:-:|:-:|
|TOKEN|access control token|none|
|HOST|hack chat server|wss://hack.chat/chat-ws|

```
deno run -A botd.ts
```

Push a message:

```
curl -d "hello" <your-host>/:channel/:nick
```

Push a file:

```
curl -T file.txt <your-host>/:channel/:nick
```

With access token:

```
curl -H "authorization: Bearer <token>" -d "hello" <your-host>/:channel/:nick
```
