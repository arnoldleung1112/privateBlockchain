const express = require('express');
const bodyparser = require('body-parser');
const simpleChain = require('./simpleChain');

const app = new express();

app.use(bodyparser.urlencoded({extended:true}));




//@route: GET /:blockheight
//@task: GET block by blockheight
//@access public
app.get('/:blockheight',(req,res)=>{
    const blockchain = new simpleChain.Blockchain(
        (thisChain)=>{   
            
            thisChain.getBlock(req.params.blockheight).then(
                (value)=>{
                    res.status(200).json(JSON.parse(value));
                }
            ).catch(
                ()=>{
                    res.status(404).json({err: 'block not found'})
                }
            );
         }
    );
});

//@route: POST /block
//@task: add new block
//@access public

app.post("/block",(req,res)=>{
    const block = new simpleChain.Block(req.body.body);
    const blockchain = new simpleChain.Blockchain((thisChain)=>{
        thisChain.addBlock(block).then(
            newBlock => res.status(200).json(newBlock)
        ).catch(
            ()=>{res.status(404).json({err: 'block add failed'})}
        )
        
    });
})


app.listen(8000,(() =>{
    console.log('server started, listening on 3000')
}))