1. install all dependency in package.json:

npm build

2. run the web service use one of the following command:

node index.js
  or
npm run server

3. sever is now up and running at port 8000, you should see the following in the console

server started, listening on 3000

4. RESTFUL WEB API:

//@route: GET /:blockheight
//@task: GET block by blockheight
//@access public

  GET localhost:8000/:blockheight

  returns an JSON object of block data given the variable blockheight e.g.

  {
    "hash": "feacca39907d22d3a36da9e668c5c2bbb6c50c23758f7c15ae546cba99810dc5",
    "height": 0,
    "body": "First block in the chain - Genesis block",
    "time": "1535085045",
    "previousBlockHash": ""
  }

  if there is no block in the blockchain, a genesis block will be created.
  
  if the program failed to find a block it will return the message:
  
  {
  "err": "block not found"
  }

//@route: POST /block
//@task: add new block
//@access public

  POST localhost:8000/block
  params: body
  
  given a post request with a parameter of key "body", the program will add a new block on top of the blockchain. The API will return the block data after successfully adding the block
  
  {
    "hash": "124c34235ab88b98a8990a4cba8bb9e372e2aeeb8e3c4f0745baa2a4cf937381",
    "height": 4,
    "body": "this is the content",
    "time": "1535090920",
    "previousBlockHash": "89872591ba791fc5a6f42948f266364aa33ab4031162ce95ca77e0bf39fb466a"
  }

  faile attempt will return 

  {
  "err": "no no block added"
  }