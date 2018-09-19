const express = require('express');
const bodyparser = require('body-parser');
const simpleChain = require('./simpleChain');
const bitcoin = require('bitcoinjs-lib') // v3.x.x
const  bitcoinMessage = require('bitcoinjs-message')

const app = new express();
const port = 8000;
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());

//maximum validation window
const maxTime = 300;
/* =====================levelDB===============================
|               level DB configurations                       |
|  =========================================================*/

const level = require('level');
const messagedb = './starRegistry';
const regDbDir = './regDB';
const db = level(messagedb);
const regDB = level(regDbDir);

//@route: GET /stars/[lookupby]:[lookuptype]
//@task: Get endpoint with URL parameter for lookup by Blockchain Wallet Address
//@access public
app.get('/stars/:lookup',(req,res)=>{
    [type, value] = req.params.lookup.split(":");


    if(type == "hash" ){
        const blockchain = new simpleChain.Blockchain(
            (thisChain)=>{   
                thisChain.getBlockByHash(value).then(
                    (block)=>{
                        return res.status(200).json(decodeStory(block));
                        }
                    )
                    .catch((err)=>{
                        return res.status(404).json(err);
                        
                    })
                }
        );
        }else if(type == "address"){
            const blockchain = new simpleChain.Blockchain(
                (thisChain)=>{   
                    thisChain.getBlockByAddress(value).then(
                        (result)=>{
                            
                            return res.status(200).json(result.map((block)=> decodeStory(block) ));
                            }
                        )
                        .catch((err)=>{
                            return res.status(404).json(err);
                            
                        })
                    }
            );
        }

    }
);
    
 



//@route: GET block/:blockheight
//@task: Get endpoint with URL parameter for star block height Star JSON Response block object
//@access public
app.get('/block/:blockheight',(req,res)=>{
    const blockchain = new simpleChain.Blockchain(
        (thisChain)=>{   
            
            thisChain.getBlock(req.params.blockheight).then(
                (value)=>{
                    
                    if(req.params.blockheight != 0){
                        res.status(200).json(decodeStory(JSON.parse(value)));
                    }else{
                        res.status(200).json(JSON.parse(value));
                    }
                    
                }
            ).catch(
                (err)=>{
                    res.status(404).json({err: 'block not found: '+ err})
                }
            );
         }
    );
});

//@route: POST /block
//@task: star registration endpoint add new block with star info
//@access public

app.post("/block",(req,res)=>{
    //validate input limit to less than 250 words and 500 bytes

    if (!req.body.address || !req.body.star){
        return res.status(400).json({err: "address and star object are required"});
    }
    
    //remove \' character from star object
    const starObj = JSON.parse(req.body.star.replace("\\"+"'","\'"));

    if (!starObj.ra || !starObj.dec || !starObj.story){
        return res.status(400).json({err: "star object ra, dec and story are required "});
    }

        if((starObj.story.split(' ').length > 250) || Buffer.byteLength(starObj.story) > 500 )
    return res.status(400).json({err:"story exceed 250 word/500 bytes limit"})
    
    //compose body of the blockchain
    
    regDB.get(req.body.address)
    .then((permission)=>{
        // console.log("perm: " + permission);
        if(permission == "false"){
             return res.status(404).json({err: 'no permissioned granted for address'})
        }else{
            starObj.story = Buffer.from(starObj.story,'ascii').toString('hex');
        const body = {
        address:req.body.address,
        star: starObj
    }
    

    const block = new simpleChain.Block(body);
    
    const blockchain = new simpleChain.Blockchain((thisChain)=>{
        thisChain.addBlock(block).then(
            (newBlock) => {
                regDB.put(req.body.address,false);
                res.status(200).json(decodeStory(newBlock));
            }
            
        ).catch(
            (err)=>{res.status(404).json({err: 'block add failed: '+ err})}
        )
        
    });
        }
    }
    ).catch(
        (err)=>{return res.status(404).json({err: 'no permissioned granted for address: '+ err})}
        );
    
})


//@route: POST /requestValidation
//@task: response in JSON format with a message to sign.
//@access public

app.post('/requestValidation',(req,res)=>{
    
    //create response with message 
    //see address has requested validation previously
    if (!req.body.address){
        return res.status(400).json({err: "address parameter is required"});
    }

    db.get(req.body.address)
        .then((message)=>{
            // if has requested before, get the remaining validation window, if expires, reset to 300s
            [address,oldTimestamp,star] = message.split(":");
            
            if (Math.floor((Date.now() - oldTimestamp)/1000) < maxTime){
                validationWindow= maxTime - Math.floor((Date.now() - oldTimestamp)/1000)
                timestamp = oldTimestamp;
            }else{
                validationWindow=maxTime;
                timestamp = Date.now();
            }
            
            
            
            const response = {
                address: address,
                requestTimeStamp: timestamp,
                message: req.body.address+":"+timestamp+":starRegistry",
                validationWindow : validationWindow
              };
            
              //save address and message in levelDB
            db.put(req.body.address,req.body.address+":"+timestamp+":starRegistry").then(()=>{
                //return response
                return res.status(200).json(response);
            }
            ).catch((err)=>{
                //return err
                return res.status(400).json({status:"fail", err: err})
            });
        })
        .catch(
            // if has not requested before create new request
            (err)=>{
                
                address = req.body.address;
                timestamp = Date.now().toString();
                message = req.body.address+":"+timestamp+":starRegistry";
                validationWindow=maxTime;

                const response = {
                    address: address,
                    requestTimeStamp: timestamp,
                    message: message,
                    validationWindow : validationWindow
                  };
                
                  //save address and message in levelDB
                db.put(req.body.address,req.body.address+":"+timestamp+":starRegistry").then(()=>{
                    //return response
                    return res.status(200).json(response);
                }
                ).catch((err)=>{
                    //return err
                    return res.status(400).json({status:"fail", err: err})
                });
            }
        )
           
        }
        
    );


//@route: POST /message-signature/validate
//@task: validate their request and grant access to register a star
//@access public
// todo handle errors

app.post('/message-signature/validate', (req,res)=>{
    
    if (!req.body.address || !req.body.signature){
        return res.status(400).json({err: "address and signature parameters are required"});
    }

    

    db.get(req.body.address)
    .then((message)=>{
        //verify signature
         const messageSignature = bitcoinMessage.verify(message, req.body.address, req.body.signature) ? "valid": "invalid"
        // get timestamp
        // console.log("verified: " + messageSignature);
        
        [address,timestamp,star] = message.split(":");
        //verify validation window
        const validationWindow = maxTime - Math.floor((Date.now() - timestamp)/1000)
        const registerStar = ((messageSignature == "valid") && (validationWindow > 0))
        const response = {
            registerStar: registerStar,
            status: {
              address: req.body.address,
              requestTimeStamp: Date.now().toString(),
              message: message,
              validationWindow: validationWindow,
              messageSignature: messageSignature
            }
          }
        regDB.put(req.body.address, true);
        return res.json(response);
    })
    .catch(
        (err)=>{
            
            res.status(404).json({err:"validation failed, cant find address request or invalid input /n" + err.toString()});

        } 
    )

   
});

app.listen(port,(() =>{
    console.log('server started, listening on ' + port)
}))


//function returning decoded story
function decodeStory(blockObj){
    decodedObj = blockObj;
    if (decodedObj.body.star.story) decodedObj.body.star.story = Buffer.from(blockObj.body.star.story,'hex').toString('ascii');

    return decodedObj;
}
