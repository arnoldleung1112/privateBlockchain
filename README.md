<h1>Setup</h1>

1. after clonning/ downloading the source code, \create chaindata directory:

<code> mkdir chaindata </code>

2. install all dependency in package.json:

<code> npm build  </code>

3. run the web service use one of the following command:

<code>node index.js</code>

or

<code>npm run server</code>

4. sever is now up and running at port 8000, you should see the following in the console

<code>server started, listening on 8000</code>

<h1>RESTFUL WEB API</h1>

<h2> 1. localhost:8000/:blockheight</h2>

returns an JSON object of block data given the variable blockheight e.g.

localhost:8000/0

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
  
  params: body
  
given a post request with a parameter of key "body", the program will add a new block on top of the blockchain, with value of "body" in stored in the new block.

The API will return the newly added block data in JSON after successfully adding the block. (make sure content type in the request header contain [{"key":"Content-Type","value":"application/x-www-form-urlencoded"}].
  
  example:
  
  localhost:8000/block
  params: "body": "this is the content"
  
  returns
  <code>
  {
    "hash": "124c34235ab88b98a8990a4cba8bb9e372e2aeeb8e3c4f0745baa2a4cf937381",
    "height": 4,
    "body": "this is the content",
    "time": "1535090920",
    "previousBlockHash": "89872591ba791fc5a6f42948f266364aa33ab4031162ce95ca77e0bf39fb466a"
  }
  </code>
  faile attempt will return 
  <code>
  {
  "err": "no no block added"
  }
  </code>
