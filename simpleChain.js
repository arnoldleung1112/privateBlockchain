/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* =====================levelDB===============================
|               level DB configurations                       |
|  =========================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(callback=(t)=>{}){
    this.blockCount = 0;
    this.getLevelDBCountPromoise().then((count)=>{
      console.log("initial block count = " + count);
      if (count == 0){
        this.addBlock(new Block("First block in the chain - Genesis block"));
        callback(this);
      }else{
        this.blockCount = count;
    
        callback(this);
      }
    });

  }

  /* ===== levelDB Methods ==========================
|  Method to access levelDB data 		|
|  ================================================*/

  getLevelDBCountPromoise() {
    return new Promise(function(resolve, reject){
      let count = 0;
      db.createReadStream()
        .on('data', function() {
          count++;
        }).on('error', function(err) {
              console.log('Unable to read', err)
            reject(err);
        }).on('end', function() {
          resolve(count);
        });
    });  
  }

  /* ===== blockchain  Methods ==========================
|  blockchain methods		|
|  ================================================*/
  // Add new block
  addBlock(newBlock){
    return new Promise((resolve, reject)=>{
      this.getLevelDBCountPromoise()
      .then((count)=>{
        // Block height
        newBlock.height = count;
        // UTC timestamp
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        // previous block hash
        if(count > 0){
        db.get(count-1).then((foundBlock)=>{
          newBlock.previousBlockHash = JSON.parse(foundBlock).hash;
          // Block hash with SHA256 using newBlock and converting to a string
          newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
           db.put(count, JSON.stringify(newBlock))
           .then(()=>{
            this.blockCount++;
            console.log("complete add block#" + this.blockCount + " with blockheight = " + this.getBlockHeight());
            console.log(this.validateBlock(this.blockCount-1).then((result)=>{console.log("is latest block valid: " + result)}));
            this.validateChain();
            resolve(newBlock);
            
           });
        })
      }else{
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
         db.put(count, JSON.stringify(newBlock))
         .then(()=>{
            this.blockCount++;
            console.log("complete add block#" + this.blockCount + " with blockheight = " + this.getBlockHeight());
            console.log(this.validateBlock(this.blockCount-1).then((result)=>{console.log("is latest block valid: " + result)}));
            this.validateChain();
            resolve(newBlock);
            
           });
      } 
      }
    )
    });
    
  }

    // Get block height
    getBlockHeight(){
      return this.blockCount-1;
    }

    // get block
    getBlock(blockHeight){
      // return a promoise that returns the block as string
     return db.get(blockHeight);
    }

    // validate block return promoise the return validate result
    validateBlock(blockHeight){
      // get block object
   
      return new Promise((resolve, reject)=>{
        db.get(blockHeight).then((foundBlock)=>{
          let block = JSON.parse(foundBlock);
          let blockHash = block.hash;
        // remove block hash to test block integrity
        block.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        // Compare
        if (blockHash===validBlockHash) {
          console.log(' Block height '+block.height+' valid' );
            resolve(true);
          } else {
            console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
            resolve(false);
            }
          });
          });
     
  }

     // Validate blockchain 
    validateChain(){
      console.log("****************** validating chian ********************");
      let errorLog = [];
      let previousHash = '';

      db.createReadStream().on('data', (data)=> {
        
        let block = JSON.parse(data.value);
        this.validateBlock(block.height).then((result)=>{
          if(result){
            if (block.height > 0){
              if(previousHash != block.previousBlockHash){
                errorLog.push(block.height);
              }
            }
          }else{
            errorLog.push(block.height);
          }
        });
        previousHash = block.hash;

        }).on('error', function(err) {
          console.log('Unable to read', err);
        }).on('end', function() {
          if (errorLog.length>0) {
            console.log('Block errors = ' + errorLog.length);
            console.log('Blocks: '+errorLog);
          }else{
            console.log('No errors detected');
          }
          console.log('********************** complete validateChain************************' );
        });
    
    }

    
//get blocks by hash
   
    getBlockByHash(hash){
      return new Promise((resolve,reject)=>{
          
          db.createReadStream()
          .on('data', function (data) {
            const block = JSON.parse(data.value);
            
            if(block.hash === hash){
              
              resolve(block); 
            }
          })
          .on('end',()=>{
            reject({err: "no block found"});
          })
        }
        
      )
    }
    //getblock by address
    
    getBlockByAddress(address){
      return new Promise((resolve,reject)=>{
        //initial list
          var addressList=[];
          //read from db
          db.createReadStream()
          .on('data', function (data) {

            const block = JSON.parse(data.value);
            //if address matches
            if(block.body.address === address){
              //add to list
              addressList.push(block);
            }
          })
          .on('end', function () {
            //return list as promoise resolve
            if (addressList.length() > 0 ){
              resolve(addressList);
            }else{
              reject({err: "no block found"});
            }
            
          });
        }
        
      )
    }

}


module.exports = {Block, Blockchain}
