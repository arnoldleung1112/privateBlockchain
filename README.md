<h1>Setup</h1>

1. after clonning/ downloading the source code, create chaindata and starRegistry directory:

<code> mkdir chaindata </code> <br>
<code> mkdir starRegistry </code>

2. install all dependency in package.json:

<code> npm build  </code>

3. run the web service use one of the following command:

<code>node index.js</code>

or

<code>npm run server</code>

4. sever is now up and running at port 8000, you should see the following in the console

<code>server started, listening on 8000</code>

<h1>RESTFUL WEB API</h1>

<h2> 1. localhost:8000/block/:blockheight</h2>

Response includes entire star block contents along with the addition of star story decoded to ascii.
e.g.

localhost:8000/block/0

returns

<code>
  {
    "hash": "feacca39907d22d3a36da9e668c5c2bbb6c50c23758f7c15ae546cba99810dc5",
    "height": 0,
    "body": "First block in the chain - Genesis block",
    "time": "1535085045",
    "previousBlockHash": ""
  }
</code>

if there is no block in the blockchain, a genesis block will be created.
  
if the program failed to find a block it will return the message:
<code>
{
  "err": "block not found"
  }
</code>

<h2>2. POST localhost:8000/block</h2>
  
  params: 
  <ul>
  <li>address [Wallet address]</li>
  <li>star object with properties:</li>
    <ul>
    <li>right_ascension</li>
    <li>declination</li>
    <li>magnitude [optional]</li>
    <li>constellation [optional]</li>
    <li>star_story [Hex encoded Ascii string limited to 250 words/500 bytes]</li>
    </ul>
  </ul>
  example:
  <br>
  <code>
   "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"}
  </code>
  <br>
  
Star object and properties are stored within the body of the block.
Star properties include the coordinates with encoded story.
Star story supports ASCII text, limited to 250 words (500 bytes), and hex encoded.

The API will return the newly added block data in JSON after successfully adding the block. (make sure content type in the request header contain [{"key":"Content-Type","value":"application/x-www-form-urlencoded"}].
  
the above example request params returns 
<br>
  <code>
  {
  "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
  "height": 1,
  "body": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "star": {
      "ra": "16h 29m 1.0s",
      "dec": "-26° 29' 24.9",
      "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
    }
  },
  "time": "1532296234",
  "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
  }
  </code>
  <br>
  faile attempt will return 
  <br>
  <code>
  {
  "err": "no no block added"
  }
 </code>
  
<h2>3. POST localhost:8000/requestValidation</h2>
  
params: address

The Web API will allow users to submit their request using their wallet address.

The web API will accept a Blockchain ID (The Blockchain ID is your wallet address, take a look again at Course 2 Blockchain Identity) with a request for star registration. The users Blockchain ID will be stored with a timestamp. This timestamp must be used to time wall the user request for star registration. 
  
Response contain message details, request timestamp, and time remaining for validation window.

User obtains a response in JSON format with a message to sign.

Message format = [walletAddress]:[timeStamp]:starRegistry

The request must be configured with a limited validation window of five minutes.

When re-submitting within validation window, validation window reduce until it expires and create a new request with a window of five minutes

Example: requestValidation endpoint
Here is an example post request using curl.
<br>
<code>
curl -X "POST" "http://localhost:8000/requestValidation" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
}'
 </code>
 <br>
Example: JSON response
Your application will provide a JSON response to users. Here is an example of this response.
<br>
<code>
{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "requestTimeStamp": "1532296090",
  "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
  "validationWindow": 300
}
 </code>

<h2>4. POST http://localhost:8000/message-signature/validate </h2>
params:
address: Wallet address
signature: Message signature

After receiving the response, users will prove their blockchain identity by signing a message with their wallet. Once they sign this message, the application will validate their request and grant access to register a star.

example:
<code> "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="</code>
  <br>

JSON Response Example
<br>
<code>
{
  "registerStar": true,
  "status": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "requestTimeStamp": "1532296090",
    "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
    "validationWindow": 193,
    "messageSignature": "valid"
  }
}
</code>

<h2>5. POST  http://localhost:8000/stars/hash:[hash]</h2>
Response includes entire star block contents along with the addition of star story decoded to ascii.
<h2>6. POST  http://localhost:8000/stars/address:[ADDRESS] </h2>
Response includes entire star block contents along with the addition of star story decoded to ascii.

Multiple stars might be registered to a single blockchain identity.

The response should support multiple star blocks.
