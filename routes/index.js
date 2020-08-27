const express = require('express');
const router = express.Router();
const joinPath = require('path').join;
const fs = require('fs');
const path = require('path')
const sanitize = require('sanitize-html')
const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);
const pas = require('../pas/pasRequest');

router.get('/', async (req, res /*, next*/) => {

  const fileList = fs.readdirSync(path.resolve('./documents'))

  res.render('index', {
    title: 'Hello PrizmDoc Viewer!',
    fileList
  });


});

router.get('/viewFile/:fileName', async (req, res)=>{

  const fileName = req.params.fileName
  const file = await(readFileFromDocumentsDirectory(fileName))
  let html = file.toString();
  try {
    html = sanitize(html, {
      allowedSchemes: [ 'data' ],
      allowedTags: [ 
        'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'abbr', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'
      ],
      allowProtocolRelative: false
    })
  }
  catch(err) {
    console.error(err)
  }

  let prizmdocRes = await pas.post('/ViewingSession', { // See https://help.accusoft.com/PrizmDoc/v13.5/HTML/webframe.html#pas-viewing-sessions.html
    json: {
      source: {
        type: 'upload',
        displayName: fileName
      }
    }
  });
  
  const viewingSessionId = prizmdocRes.body.viewingSessionId;

  prizmdocRes = await pas.put(`/ViewingSession/u${viewingSessionId}/SourceFile`, {
    body: Buffer.from(html)
  });

  return res.send({viewingSessionId})
})


// Util function to read a document from the documents/ directory
async function readFileFromDocumentsDirectory(filename) {
  return readFile(joinPath(__dirname, '..', 'documents', filename));
}

module.exports = router;
