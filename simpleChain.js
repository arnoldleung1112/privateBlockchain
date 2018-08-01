/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

// Todo
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
  constructor(callback=()=>{}){
    this.blockCount = 0;
    this.getLevelDBCountPromoise(db).then((count)=>{
      console.log("initial block count = " + count);
      if (count == 0){
        this.addBlock(new Block("First block in the chain - Genesis block"));
      }else{
        this.blockCount = count;
        callback(this);
      }
    });

  }

  /* ===== levelDB Methods ==========================
|  Method to access levelDB data 		|
|  ================================================*/

  getLevelDBCountPromoise(db) {
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

  readLevelDB (db) {
    return new Promise((resolve,reject)=>{
      let dataArray = [];
      console.log('********************** reading levelDB data************************' );
      db.createReadStream().on('data', function(data) {
          console.log('levelDB data key = ' + data.key + '\nvalue: ' + data.value );
          dataArray.push(data.value)+"\n";
          
          
          }).on('error', function(err) {
            reject('Unable to read', err);
          }).on('end', function() {
            resolve("dataArray = " + dataArray);
            console.log('********************** complete reading levelDB data************************' );
          });
      });
  }
  /* ===== blockchain  Methods ==========================
|  blockchain methods		|
|  ================================================*/
  // Add new block
  addBlock(newBlock){
    return new Promise((resolve, reject)=>{
      this.getLevelDBCountPromoise(db)
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
      db.get(blockHeight,(err, value)=>{console.log(value)});
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



      // for (var i = 0; i < this.blockCount-1; i++) {
      //   // validate block
      //   console.log("i =  " + i);
      //   console.log("comparing block height#" + i + " hash and block height#" + (i +1)+" previoushash value");
      //   db.get(i).then((blockData)=>{
      //     let thisBlock = Object.setPrototypeOf(JSON.parse(blockData), new Block(""));
      //     console.log("i =  " + i);
      //     this.validateBlock(i).then((result)=>{
      //       if (!result) errorLog.push(i);
      //     });
      //     return thisBlock
      //   }).then((thisBlock)=>{
      //     if(thisBlock.count>1){
      //       db.get(thisBlock.height+1).then((nextBlock)=>{
      //         let blockHash = thisBlock.hash;
      //         let previousHash = JSON.parse(nextBlock).previousHash;
      //         if (blockHash!==previousHash) {
      //           errorLog.push(i);
      //         }
      //       });
      //     }
          
      //   }).catch((err,i)=>{console.log("i = "+ i + " err = "+ err )});
      // }
      // if (errorLog.length>0) {
      //   console.log('Block errors = ' + errorLog.length);
      //   console.log('Blocks: '+errorLog);
      //   console.log("****************** complete validating chian ********************");
      //   return false;
      // } else {
      //   console.log('No errors detected');
      //   console.log("****************** complete validating chian ********************");
      //   return true;
      // }
      
    }
 
      
      
}



// ******************** test ****************************
console.log("initializing blockchain");

let blockchain = new Blockchain((blockchain)=>{
  console.log(blockchain.blockCount);
  if (blockchain.blockCount>=1){
    blockchain.addBlock(new Block("new block"));
  }
});



// ******************** test ****************************


